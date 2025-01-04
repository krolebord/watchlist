import { type MovieWithMediaType, TMDB, type TVWithMediaType } from 'tmdb-ts';
import { z } from 'zod';
import { publicProcedure, router } from './trpc';

export const listRouter = router({
  greet: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    console.log(ctx.env);
    return `Hello, ${input}!`;
  }),
  findMovie: publicProcedure.input(z.object({ q: z.string() })).query(async ({ input, ctx }) => {
    const tmdb = new TMDB(ctx.env.TMDB_READ_ACCESS_TOKEN);
    const results = (await tmdb.search.multi({ query: input.q })).results;
    return results
      .filter((result) => result.media_type === 'movie' || result.media_type === 'tv')
      .map(adaptSearchResult);
  }),
});

export function adaptSearchResult(result: MovieWithMediaType | TVWithMediaType) {
  if (result.media_type === 'tv') {
    return {
      title: result.name,
      tmdbId: result.id,
      posterPath: result.poster_path,
      releaseDate: result.first_air_date,
      overview: result.overview,
      popularity: result.popularity,
      voteAverage: result.vote_average,
      voteCount: result.vote_count,
    };
  }

  return {
    title: result.title,
    tmdbId: result.id,
    posterPath: result.poster_path,
    releaseDate: result.release_date,
    overview: result.overview,
    popularity: result.popularity,
    voteAverage: result.vote_average,
    voteCount: result.vote_count,
  };
}

export type ListRouter = typeof listRouter;
