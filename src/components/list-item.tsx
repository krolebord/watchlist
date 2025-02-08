import { trpc } from '@/trpc';

import type { TrpcOutput } from '@/trpc';
import { Clock4Icon, EllipsisVerticalIcon, EyeOffIcon, TrashIcon } from 'lucide-react';
import { CalendarIcon } from 'lucide-react';
import { VoteAverage } from './movie-card';
import { CheckIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { ContextMenu, ContextMenuTrigger } from './ui/context-menu';
import { DynamicMenuContent, type DynamicMenuContentType, DynamicMenuItem } from './ui/dynamic-menu-content';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu';

type ListItem = TrpcOutput['list']['getItems'][number];
export function ListItemCard({ item, listId }: { item: ListItem; listId: string }) {
  const isWatched = !!item.watchedAt;

  const utils = trpc.useUtils();
  const markAsWatchedMutation = trpc.list.markAsWatched.useMutation({
    onSuccess: () => {
      utils.list.getItems.invalidate({ listId });
    },
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger>
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
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(item.title)}`}
                target="_blank"
                rel="noreferrer"
                tabIndex={-1}
                className="font-semibold truncate cursor-pointer"
              >
                {item.title}
              </a>
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
                  disabled={markAsWatchedMutation.isPending}
                  onClick={() => markAsWatchedMutation.mutate({ listId, itemId: item.id })}
                >
                  <CheckIcon />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <EllipsisVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <ListItemMenuContent type="dropdown-menu" item={item} listId={listId} />
              </DropdownMenu>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ListItemMenuContent type="context-menu" item={item} listId={listId} />
    </ContextMenu>
  );
}

type ListItemMenuContentProps = {
  type: DynamicMenuContentType;
  item: ListItem;
  listId: string;
};
function ListItemMenuContent({ type, item, listId }: ListItemMenuContentProps) {
  const isWatched = !!item.watchedAt;

  const utils = trpc.useUtils();
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
  const markAsWatchedMutation = trpc.list.markAsWatched.useMutation({
    onSuccess: () => {
      utils.list.getItems.invalidate({ listId });
    },
  });

  return (
    <DynamicMenuContent type={type}>
      <DynamicMenuItem
        disabled={removeItemMutation.isPending}
        onClick={() => removeItemMutation.mutate({ listId, itemId: item.id })}
      >
        <TrashIcon />
        Delete
      </DynamicMenuItem>
      {isWatched ? (
        <DynamicMenuItem
          disabled={markAsUnwatchedMutation.isPending}
          onClick={() => markAsUnwatchedMutation.mutate({ listId, itemId: item.id })}
        >
          <EyeOffIcon />
          <span>Mark as unwatched</span>
        </DynamicMenuItem>
      ) : (
        <DynamicMenuItem
          disabled={markAsWatchedMutation.isPending}
          onClick={() => markAsWatchedMutation.mutate({ listId, itemId: item.id })}
        >
          <CheckIcon />
          Mark as watched
        </DynamicMenuItem>
      )}
    </DynamicMenuContent>
  );
}

function formatDuration(duration: number) {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}h ${minutes}m`;
}
