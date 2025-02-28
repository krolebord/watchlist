import type { TMDB } from 'tmdb-ts';

type GetItemMetadataOptions = {
  tmdbId: number;
  type: 'movie' | 'tv';
  tmdb: TMDB;
};
export async function getItemMetadata(options: GetItemMetadataOptions) {
  const { tmdbId, type, tmdb } = options;

  const tmdbMetadata = await getTmdbMetadata(tmdb, tmdbId, type);

  return {
    tmdb: tmdbMetadata,
  };
}

async function getTmdbMetadata(tmdb: TMDB, tmdbId: number, type: 'movie' | 'tv') {
  switch (type) {
    case 'movie':
      return getMovieTMDBMetadata(tmdb, tmdbId);
    case 'tv':
      return getTVTMDBMetadata(tmdb, tmdbId);
  }
}

async function getMovieTMDBMetadata(tmdb: TMDB, tmdbId: number) {
  const movie = await tmdb.movies.details(tmdbId, ['keywords']);

  if (!movie) {
    return null;
  }

  return {
    tmdbId: tmdbId,
    title: movie.title,
    overview: movie.overview,
    duration: movie.runtime,
    episodeCount: null,
    rating: Math.round(movie.vote_average * 10),
    releaseDate: movie.release_date ? new Date(movie.release_date) : null,
    posterUrl: `https://image.tmdb.org/t/p/w300${movie.poster_path ?? movie.backdrop_path}`,
  };
}

async function getTVTMDBMetadata(tmdb: TMDB, tmdbId: number) {
  const show = await tmdb.tvShows.details(tmdbId, ['keywords']);

  if (!show) {
    return null;
  }

  return {
    tmdbId: tmdbId,
    title: show.name,
    overview: show.overview,
    duration: show.episode_run_time.find((x) => x > 0) ?? null,
    episodeCount: show.number_of_episodes,
    rating: Math.round(show.vote_average * 10),
    releaseDate: show.first_air_date ? new Date(show.first_air_date) : null,
    posterUrl: `https://image.tmdb.org/t/p/w300${show.poster_path ?? show.backdrop_path}`,
  };
}
