import { TRPCError } from '@trpc/server';
import { and, count, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getItemMetadata } from '../../utils/item-metadata';
import { mainSchema } from '../db';
import { listProcedure, protectedProcedure, router } from '../trpc';
import { sendMagicLinkEmail } from './auth.router';

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

  addTMDBItem: listProcedure
    .input(z.object({ tmdbId: z.number(), type: z.enum(['movie', 'tv']) }))
    .mutation(async ({ input, ctx }) => {
      const meta = await getItemMetadata({
        tmdb: ctx.tmdb,
        tmdbId: input.tmdbId,
        type: input.type,
      });

      if (!meta.tmdb) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const itemId = ctx.createId();
      await ctx.db.insert(mainSchema.listItemsTable).values({
        id: itemId,
        listId: input.listId,
        type: input.type,
        tmdbId: input.tmdbId,
        title: meta.tmdb.title,
        overview: meta.tmdb.overview,
        duration: meta.tmdb.duration,
        episodeCount: meta.tmdb.episodeCount,
        rating: meta.tmdb.rating,
        releaseDate: meta.tmdb.releaseDate,
        posterUrl: meta.tmdb.posterUrl,
      });

      return { itemId };
    }),

  reindexItem: listProcedure.input(z.object({ itemId: z.string() })).mutation(async ({ input, ctx }) => {
    const [item] = await ctx.db
      .select({
        id: mainSchema.listItemsTable.id,
        tmdbId: mainSchema.listItemsTable.tmdbId,
        type: mainSchema.listItemsTable.type,
      })
      .from(mainSchema.listItemsTable)
      .where(eq(mainSchema.listItemsTable.id, input.itemId));

    if (!item) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    if (!item.tmdbId) {
      return { status: 'skipped' as const };
    }

    const meta = await getItemMetadata({
      tmdb: ctx.tmdb,
      tmdbId: item.tmdbId,
      type: item.type,
    });

    if (!meta.tmdb) {
      return { status: 'skipped' as const };
    }

    await ctx.db
      .update(mainSchema.listItemsTable)
      .set({
        title: meta.tmdb.title,
        overview: meta.tmdb.overview,
        duration: meta.tmdb.duration,
        episodeCount: meta.tmdb.episodeCount,
        rating: meta.tmdb.rating,
        releaseDate: meta.tmdb.releaseDate,
        posterUrl: meta.tmdb.posterUrl,
      })
      .where(eq(mainSchema.listItemsTable.id, input.itemId));

    return { status: 'success' as const };
  }),

  removeItem: listProcedure.input(z.object({ itemId: z.string() })).mutation(async ({ input, ctx }) => {
    await ctx.db.delete(mainSchema.listItemsTable).where(eq(mainSchema.listItemsTable.id, input.itemId));
  }),

  setWatched: listProcedure
    .input(z.object({ itemId: z.string(), watched: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(mainSchema.listItemsTable)
        .set({ watchedAt: input.watched ? new Date() : null })
        .where(eq(mainSchema.listItemsTable.id, input.itemId));
    }),

  setPriority: listProcedure
    .input(z.object({ itemId: z.string(), priority: z.enum(['low', 'normal', 'high']) }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(mainSchema.listItemsTable)
        .set({ priority: input.priority === 'low' ? -1 : input.priority === 'normal' ? 0 : 1 })
        .where(eq(mainSchema.listItemsTable.id, input.itemId));
    }),

  getItems: listProcedure.query(async ({ ctx, input }) => {
    const f = mainSchema.listItemsTable;
    const items = await ctx.db.select().from(f).where(eq(f.listId, input.listId));

    return items;
  }),

  updateItem: listProcedure
    .input(
      z.object({
        itemId: z.string(),
        title: z.string().min(1).optional(),
        overview: z.string().optional(),
        duration: z.number().int().min(0).optional(),
        type: z.enum(['movie', 'tv']).optional(),
        episodeCount: z.number().int().min(0).optional(),
        watchedAt: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(mainSchema.listItemsTable)
        .set({
          ...(input.title ? { title: input.title } : {}),
          ...(input.overview ? { overview: input.overview } : {}),
          ...(input.duration ? { duration: input.duration } : {}),
          ...(input.type ? { type: input.type } : {}),
          ...(input.episodeCount ? { episodeCount: input.episodeCount } : {}),
          ...(input.watchedAt !== undefined ? { watchedAt: input.watchedAt } : {}),
        })
        .where(eq(mainSchema.listItemsTable.id, input.itemId));
    }),
});
