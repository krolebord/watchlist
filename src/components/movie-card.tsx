import type { TrpcOutput } from '@/trpc';
import { motion } from 'motion/react';

type Movie = TrpcOutput['findMovie'][number];

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <div className="flex flex-row gap-2 bg-card p-2 rounded-md shadow-sm border border-border">
      <img
        className="rounded-md aspect-[2/3] h-48 w-32 object-cover"
        src={`https://image.tmdb.org/t/p/w200${movie.posterPath}`}
        alt={movie.title}
      />
      <div className="flex flex-col">
        <h3>{movie.title}</h3>
      </div>
    </div>
  );
}
