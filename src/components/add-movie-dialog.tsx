import { type TrpcOutput, trpc } from '@/trpc';
import { cn } from '@/utils/cn';
import { useThrottle } from '@/utils/use-throttle';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { keepPreviousData } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckIcon, XIcon } from 'lucide-react';
import { useRef } from 'react';
import { useState } from 'react';
import { VoteAverage } from './movie-card';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';

type AddMovieDialogProps = {
  listId: string;
  asChild?: boolean;
  children: React.ReactNode;
  alreadyAddedItems?: number[];
};
export function AddMovieDialog({ listId, asChild, children, alreadyAddedItems }: AddMovieDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  const [animateRef] = useAutoAnimate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const searchQuery = useThrottle(search, 200);

  const [addedItems, setAddedItems] = useState<number[]>(alreadyAddedItems ?? []);

  const { data } = trpc.search.findMovie.useQuery(
    { q: searchQuery },
    {
      enabled: !!searchQuery && isOpen,
      placeholderData: keepPreviousData,
    },
  );

  const searchItems = searchQuery ? data : [];

  const utils = trpc.useUtils();
  const addMovie = trpc.list.addTMDBMovie.useMutation({
    onSuccess: () => {
      utils.list.getItems.invalidate({ listId });
    },
  });
  const addTvShow = trpc.list.addTMDBTvShow.useMutation({
    onSuccess: () => {
      utils.list.getItems.invalidate({ listId });
    },
  });

  const handleAddMovie = (movie: Exclude<typeof searchItems, undefined>[number], isKeyboard: boolean) => {
    if (movie.type === 'movie') {
      addMovie.mutate({ listId, tmdbId: movie.tmdbId });
      setAddedItems([...addedItems, movie.tmdbId]);
    } else {
      addTvShow.mutate({ listId, tmdbId: movie.tmdbId });
      setAddedItems([...addedItems, movie.tmdbId]);
    }

    if (isKeyboard) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
      <DialogContent
        noClose
        className="h-screen max-h-[calc(100dvh)] sm:h-[80vh] w-screen sm:max-w-[480px] md:max-w-[700px] lg:max-w-[900px] flex flex-col items-start justify-start content-start p-2 sm:p-4"
      >
        <DialogTitle hidden>Add a movie</DialogTitle>
        <div className="w-full flex flex-row gap-3 items-center">
          <Input
            placeholder="Search for a movie"
            className="min-h-10"
            autoFocus
            onChange={(e) => setSearch(e.target.value)}
            ref={inputRef}
          />
          <button type="button" tabIndex={-1} onClick={close}>
            <XIcon />
          </button>
        </div>
        <div
          ref={animateRef}
          className="flex flex-row py-1 flex-wrap gap-4 overflow-y-auto overflow-x-hidden content-start justify-center items-start scrollbar w-full"
        >
          {searchItems?.map((result) => (
            <SearchCard
              className="sm:w-48 w-[40vw]"
              key={result.tmdbId}
              movie={result}
              onClick={({ isKeyboard }) => handleAddMovie(result, isKeyboard)}
              isAdded={addedItems.includes(result.tmdbId)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Movie = TrpcOutput['search']['findMovie'][number];

function SearchCard({
  movie,
  onClick,
  isAdded = false,
  className,
}: { movie: Movie; onClick?: (event: { isKeyboard: boolean }) => void; isAdded?: boolean; className?: string }) {
  return (
    <button
      type="button"
      className={cn(
        'bg-card rounded-md shadow-sm border border-border overflow-hidden relative group',
        'focus-visible:outline-none focus-visible:ring-2 ring-offset-background focus-visible:ring-ring focus-visible:ring-offset-1',
        className,
        onClick && 'cursor-pointer',
      )}
      disabled={isAdded}
      tabIndex={isAdded ? -1 : 0}
      onClick={(e) => {
        if (!onClick) return;

        const isKeyboard = e.clientX === 0 && e.clientY === 0;
        onClick({ isKeyboard });
      }}
    >
      <img
        className="rounded-md object-cover"
        src={`https://image.tmdb.org/t/p/w300${movie.posterPath}`}
        alt={movie.title}
      />
      <div
        className={cn(
          'absolute top-0 left-0 right-0 bottom-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center',
          isAdded && 'opacity-100 bg-black/50',
        )}
      >
        {isAdded && <CheckIcon className="size-10 text-purple-500 text-primary" />}
      </div>
      {!!movie.releaseDate && (
        <p className="absolute top-1 left-1 px-3 py-1 bg-black rounded-full text-white select-none">
          {format(new Date(movie.releaseDate), 'y')}
        </p>
      )}
      <VoteAverage className="absolute top-1 right-1" voteAverage={movie.voteAverage} />
      <div className="flex flex-col absolute bottom-0 left-0 right-0">
        <div className="bg-gradient-to-b from-transparent to-black/70 h-8" />
        <h3 className="font-semibold text-lg bg-black/70 px-2 pb-2">{movie.title}</h3>
      </div>
    </button>
  );
}
