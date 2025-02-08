import { AddMovieDialog } from '@/components/add-movie-dialog';
import { AppHeader, ProjectSelector, UserAvatarDropdown } from '@/components/app-layout';
import { ListSettingsSheet } from '@/components/list-settings-sheet';
import { VoteAverage } from '@/components/movie-card';
import { Button } from '@/components/ui/button';
import { type TrpcOutput, trpc } from '@/trpc';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { format } from 'date-fns';
import {
  CalendarIcon,
  CheckIcon,
  Clock4Icon,
  EyeOffIcon,
  PlusIcon,
  SettingsIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import { RefObject, useMemo } from 'react';

export const Route = createFileRoute('/_app/list/$id')({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    await context.trpc.list.getItems.prefetch({ listId: params.id });
    return {
      listId: params.id,
    };
  },
});

function ListSettings() {
  const listId = useListId();
  return (
    <ListSettingsSheet listId={listId} asChild>
      <Button variant="ghost" size="icon" className="size-10 rounded-full">
        <SettingsIcon className="!size-6 text-gray-400" />
      </Button>
    </ListSettingsSheet>
  );
}

export function useListId() {
  const { id } = useParams({ from: '/_app/list/$id' });

  return id;
}

function RouteComponent() {
  const listId = useListId();
  const { data: items } = trpc.list.getItems.useQuery({ listId });

  const alreadyAddedItems = useMemo(() => items?.map((item) => item.tmdbId).filter((id) => id !== null) ?? [], [items]);

  const [animateRef] = useAutoAnimate();

  return (
    <>
      <AppHeader>
        <div className="flex items-center gap-2">
          <ProjectSelector />
          <ListSettings />
        </div>
        <UserAvatarDropdown />
      </AppHeader>
      <div className="w-full flex flex-col items-center">
        <AddMovieDialog listId={listId} alreadyAddedItems={alreadyAddedItems} asChild>
          <Button variant="default" size="icon" className="size-10 rounded-full fixed bottom-4 right-4 z-50">
            <PlusIcon className="!size-6" />
          </Button>
        </AddMovieDialog>
        <div
          className="w-full flex flex-wrap justify-center md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 pt-4 pb-20 max-w-7xl"
          ref={animateRef}
        >
          {items?.map((item) => (
            <MovieCard key={item.id} item={item} listId={listId} />
          ))}
        </div>
      </div>
    </>
  );
}

type ListItem = TrpcOutput['list']['getItems'][number];
function MovieCard({ item, listId }: { item: ListItem; listId: string }) {
  const isWatched = !!item.watchedAt;

  const utils = trpc.useUtils();
  const markAsWatchedMutation = trpc.list.markAsWatched.useMutation({
    onSuccess: () => {
      utils.list.getItems.invalidate({ listId });
    },
  });
  const removeItemMutation = trpc.list.removeItem.useMutation({
    onSuccess: () => {
      utils.list.getItems.invalidate({ listId });
    },
  });
  const markAsUnwatchedMutation = trpc.list.markAsUnwatched.useMutation({
    onSuccess: () => {
      utils.list.getItems.invalidate({ listId });
    },
  });

  return (
    <div className="bg-card rounded-md shadow-sm border border-border overflow-hidden relative group w-full grid grid-cols-3">
      {item.posterUrl && (
        <div className="w-full aspect-[2/3] overflow-hidden relative">
          <img className="object-cover w-full h-full" src={item.posterUrl} alt={item.title} />
          {item.rating && <VoteAverage className="absolute top-2 left-2" voteAverage={item.rating / 10} />}
          {isWatched && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center">
              <CheckIcon className="!size-10 text-green-500" />
            </div>
          )}
        </div>
      )}
      <div className="col-span-2 flex flex-col justify-between p-4">
        <div className="flex flex-col gap-2">
          <p className="font-semibold truncate">{item.title}</p>
          <p className="text-sm text-muted-foreground flex gap-4">
            {!!item.releaseDate && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="!size-4" /> {format(new Date(item.releaseDate), 'y')}
              </span>
            )}
            {!!item.duration && (
              <span className="flex items-center gap-1">
                <Clock4Icon className="!size-4" /> {formatDuration(item.duration)}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          {!isWatched && (
            <Button
              variant="ghost"
              size="icon"
              disabled={removeItemMutation.isPending}
              onClick={() => removeItemMutation.mutate({ listId, itemId: item.id })}
            >
              <TrashIcon />
            </Button>
          )}
          {!isWatched && (
            <Button
              variant="ghost"
              size="icon"
              disabled={markAsWatchedMutation.isPending}
              onClick={() => markAsWatchedMutation.mutate({ listId, itemId: item.id })}
            >
              <CheckIcon />
            </Button>
          )}
          {isWatched && (
            <Button
              variant="ghost"
              size="icon"
              disabled={markAsUnwatchedMutation.isPending}
              onClick={() => markAsUnwatchedMutation.mutate({ listId, itemId: item.id })}
            >
              <EyeOffIcon />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(duration: number) {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}h ${minutes}m`;
}
