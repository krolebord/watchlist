import { trpc } from '@/trpc';

import type { TrpcOutput } from '@/trpc';
import { cn } from '@/utils/cn';
import { formatDuration } from '@/utils/format-duration';
import { useListStore } from '@/utils/list-store';
import { format } from 'date-fns';
import { Clock4Icon, EllipsisVerticalIcon, EyeOffIcon, MinusIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { CalendarIcon } from 'lucide-react';
import { CheckIcon } from 'lucide-react';
import { VoteAverage } from './movie-card';
import { Button } from './ui/button';
import { ContextMenu, ContextMenuTrigger } from './ui/context-menu';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu';
import { DynamicMenuContent, type DynamicMenuContentType, DynamicMenuItem } from './ui/dynamic-menu-content';

type ListItem = TrpcOutput['list']['getItems'][number];
export function ListItemCard({ item, listId }: { item: ListItem; listId: string }) {
  const isWatched = !!item.watchedAt;
  const isSelected = useIsItemSelected(item.id);
  const isSelectionMode = useIsSelectionMode();
  const isRandomizedItem = useIsRandomizedItem(item.id);

  const toggleItemSelection = useListStore((state) => state.toggleItemSelection);

  const utils = trpc.useUtils();
  const markAsWatchedMutation = trpc.list.markAsWatched.useMutation({
    onSuccess: () => {
      utils.list.getItems.invalidate({ listId });
    },
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            'bg-card rounded-md shadow-sm border border-border overflow-hidden relative group w-full grid grid-cols-3',
            isRandomizedItem && 'border-primary',
          )}
        >
          <div
            className={cn('w-full aspect-[2/3] overflow-hidden relative cursor-pointer')}
            onClick={() => {
              toggleItemSelection(item.id);
            }}
          >
            {item.posterUrl && <img className="object-cover w-full h-full" src={item.posterUrl} alt={item.title} />}
            {item.rating && !isSelected && (
              <VoteAverage className="absolute top-2 left-2" voteAverage={item.rating / 10} />
            )}
            {(isWatched || isSelected) && (
              <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center">
                {isWatched && <CheckIcon className="!size-10 text-green-500" />}
              </div>
            )}
            {isSelected && (
              <p className="absolute top-2 left-2 flex items-center justify-center size-8 bg-primary rounded-full text-white select-none">
                <CheckIcon />
              </p>
            )}
          </div>

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

  const isSelected = useIsItemSelected(item.id);
  const toggleItemSelection = useListStore((state) => state.toggleItemSelection);

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
      <DynamicMenuItem onClick={() => toggleItemSelection(item.id)}>
        {isSelected ? <MinusIcon /> : <PlusIcon />}
        <span>{isSelected ? 'Deselect' : 'Select'}</span>
      </DynamicMenuItem>
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

function useIsItemSelected(itemId: string) {
  return useListStore((state) => state.selectedItems.includes(itemId));
}

export function useIsSelectionMode() {
  return useListStore((state) => state.selectedItems.length > 0);
}

function useIsRandomizedItem(itemId: string) {
  return useListStore((state) => state.randomizedItem === itemId);
}
