import { TRPCError } from '@trpc/server';
import { and, count, eq, sql } from 'drizzle-orm';
import { TMDB } from 'tmdb-ts';
import { z } from 'zod';
import { mainSchema } from '../db';
import { listProcedure, protectedProcedure, router } from '../trpc';
import { sendMagicLinkEmail } from './auth.router';
import { itemsFilterSchema } from '../../../common/items-filter-schema';

export const listRouter = router({
  getLists: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.userSession.user;
    const lists = await ctx.db
      .selectDistinct({
        id: mainSchema.listsTable.id,
        name: mainSchema.listsTable.name,
      })
      .from(mainSchema.listsTable)
      .innerJoin(
        mainSchema.usersToListsTable,
        and(
          eq(mainSchema.usersToListsTable.userId, user.id),
          eq(mainSchema.usersToListsTable.listId, mainSchema.listsTable.id),
        ),
      );

    return lists;
  }),

  createList: protectedProcedure.input(z.object({ name: z.string() })).mutation(async ({ input, ctx }) => {
    const user = ctx.userSession.user;

    const listId = crypto.randomUUID();
    await ctx.db.insert(mainSchema.listsTable).values({
      id: listId,
      name: input.name,
    });

    await ctx.db.insert(mainSchema.usersToListsTable).values({
      userId: user.id,
      listId,
    });

    return { listId };
  }),

  editList: listProcedure.input(z.object({ newName: z.string() })).mutation(async ({ input, ctx }) => {
    await ctx.db
      .update(mainSchema.listsTable)
      .set({
        name: input.newName,
      })
      .where(eq(mainSchema.listsTable.id, input.listId));

    return { listId: input.listId };
  }),

  getDetails: listProcedure.query(async ({ input, ctx }) => {
    const [list, [stats]] = await Promise.all([
      ctx.db.query.listsTable.findFirst({
        where: eq(mainSchema.listsTable.id, input.listId),
        columns: {
          id: true,
          name: true,
          createdAt: true,
        },
        with: {
          usersToLists: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      ctx.db
        .select({
          count: count(mainSchema.listItemsTable.id),
          watchedCount: sql<number>`count(case when ${mainSchema.listItemsTable.watchedAt} is not null then 1 end)`,
          totalDuration: sql<number>`sum(${mainSchema.listItemsTable.duration})`,
          watchedDuration: sql<number>`sum(case when ${mainSchema.listItemsTable.watchedAt} is not null then ${mainSchema.listItemsTable.duration} else 0 end)`,
          averageRating: sql<number>`avg(${mainSchema.listItemsTable.rating})`,
        })
        .from(mainSchema.listItemsTable)
        .where(eq(mainSchema.listItemsTable.listId, input.listId))
        .groupBy(mainSchema.listItemsTable.listId),
    ]);

    if (!list) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    const { usersToLists, ...rest } = list;

    return {
      ...rest,
      users: usersToLists.map((user) => user.user),
      stats,
    };
  }),

  inviteUser: listProcedure.input(z.object({ email: z.string() })).mutation(async ({ input, ctx }) => {
    return await sendMagicLinkEmail(ctx, { email: input.email, listId: input.listId });
  }),

  addTMDBMovie: listProcedure.input(z.object({ tmdbId: z.number() })).mutation(async ({ input, ctx }) => {
    const movie = await ctx.tmdb.movies.details(input.tmdbId, ['keywords']);

    if (!movie) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    const itemId = ctx.createId();
    await ctx.db.insert(mainSchema.listItemsTable).values({
      id: itemId,
      listId: input.listId,
      tmdbId: input.tmdbId,
      title: movie.title,
      overview: movie.overview,
      duration: movie.runtime,
      rating: Math.round(movie.vote_average * 10),
      releaseDate: movie.release_date ? new Date(movie.release_date) : null,
      posterUrl: `https://image.tmdb.org/t/p/w300${movie.poster_path ?? movie.backdrop_path}`,
    });

    return { itemId };
  }),

  addTMDBTvShow: listProcedure.input(z.object({ tmdbId: z.number() })).mutation(async ({ input, ctx }) => {
    const show = await ctx.tmdb.tvShows.details(input.tmdbId, ['keywords']);

    if (!show) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    const itemId = ctx.createId();
    await ctx.db.insert(mainSchema.listItemsTable).values({
      id: itemId,
      listId: input.listId,
      tmdbId: input.tmdbId,
      title: show.name,
      overview: show.overview,
      duration: show.episode_run_time[0] * show.number_of_episodes,
      rating: Math.round(show.vote_average * 10),
      releaseDate: show.first_air_date ? new Date(show.first_air_date) : null,
      posterUrl: `https://image.tmdb.org/t/p/w300${show.poster_path ?? show.backdrop_path}`,
    });

    return { itemId };
  }),

  removeItem: listProcedure.input(z.object({ itemId: z.string() })).mutation(async ({ input, ctx }) => {
    await ctx.db.delete(mainSchema.listItemsTable).where(eq(mainSchema.listItemsTable.id, input.itemId));
  }),

  markAsWatched: listProcedure.input(z.object({ itemId: z.string() })).mutation(async ({ input, ctx }) => {
    await ctx.db
      .update(mainSchema.listItemsTable)
      .set({ watchedAt: new Date() })
      .where(eq(mainSchema.listItemsTable.id, input.itemId));
  }),

  markAsUnwatched: listProcedure.input(z.object({ itemId: z.string() })).mutation(async ({ input, ctx }) => {
    await ctx.db
      .update(mainSchema.listItemsTable)
      .set({ watchedAt: null })
      .where(eq(mainSchema.listItemsTable.id, input.itemId));
  }),

  getItems: listProcedure.input(itemsFilterSchema).query(async ({ ctx, input }) => {
    const { sortBy, sortOrder } = input;

    const sortByColumn = getItemsOrderByColumn(sortBy);
    const items = await ctx.db.query.listItemsTable.findMany({
      where: eq(mainSchema.listItemsTable.listId, input.listId),
      orderBy: (f, x) => [
        x.sql`case when ${f.watchedAt} is not null then 1 else 0 end`,
        sortOrder === 'asc' ? x.asc(sortByColumn) : x.desc(sortByColumn),
        x.desc(f.watchedAt),
        f.order,
      ],
    });

    return items;
  }),
});

type FilteringOptions = z.infer<typeof itemsFilterSchema>;

function getItemsOrderByColumn(sortBy: FilteringOptions['sortBy']) {
  switch (sortBy) {
    case 'duration':
      return mainSchema.listItemsTable.duration;
    case 'rating':
      return mainSchema.listItemsTable.rating;
    case 'dateAdded':
      return mainSchema.listItemsTable.createdAt;
  }
}
