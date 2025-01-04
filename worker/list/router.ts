import { z } from 'zod';
import { publicProcedure, router } from './trpc';
import { MovieWithMediaType, TMDB, TVWithMediaType } from 'tmdb-ts';

export const listRouter = router({
  greet: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    console.log(ctx.env);
    return `Hello, ${input}!`;
  }),
  findMovie: publicProcedure.input(z.object({ q: z.string() })).query(async ({ input, ctx }) => {
    const tmdb = new TMDB(ctx.env.TMDB_READ_ACCESS_TOKEN);
    const results = (await tmdb.search.multi({ query: input.q })).results;
    return results.filter((result) => result.media_type === 'movie' || result.media_type === 'tv') as (
      | MovieWithMediaType
      | TVWithMediaType
    )[];
  }),
});

export type ListRouter = typeof listRouter;
