import { MovieCard } from '@/components/movie-card';
import { Input } from '@/components/ui/input';
import { trpc } from '@/trpc';
import { useThrottle } from '@/utils/use-throttle';
import autoAnimate from '@formkit/auto-animate';
import { keepPreviousData } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const [search, setSearch] = useState('');
  const searchQuery = useThrottle(search, 200);

  const { data } = trpc.findMovie.useQuery(
    { q: searchQuery },
    {
      enabled: !!searchQuery,
      placeholderData: keepPreviousData,
    },
  );

  const parentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (parentRef.current) {
      autoAnimate(parentRef.current);
    }
  }, []);

  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <Input placeholder="Search for a movie" onChange={(e) => setSearch(e.target.value)} />
      <div ref={parentRef}>
        {data?.map((result) => (
          <MovieCard key={result.tmdbId} movie={result} />
        ))}
      </div>
    </div>
  );
}
