import { Input } from '@/components/ui/input';
import { trpc } from '@/trpc';
import { useThrottle } from '@/utils/use-throttle';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { MovieWithMediaType, TVWithMediaType } from 'tmdb-ts';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  useEffect(() => {
    console.log('mount');
  }, []);
  const [search, setSearch] = useState('');
  const searchQuery = useThrottle(search, 500);

  const { data } = trpc.findMovie.useQuery(
    { q: searchQuery },
    {
      enabled: !!searchQuery,
    },
  );

  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <Input placeholder="Search for a movie" onChange={(e) => setSearch(e.target.value)} />
      {data?.map((result) => (
        <MovieCard key={result.id} movie={adaptSearchResult(result)} />
      ))}
    </div>
  );
}

function adaptSearchResult(result: MovieWithMediaType | TVWithMediaType) {
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

type Movie = ReturnType<typeof adaptSearchResult>;

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <div>
      <img className="rounded-md" src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`} alt={movie.title} />
      <div>{movie.title}</div>
    </div>
  );
}
