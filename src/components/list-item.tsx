import { trpc } from '@/trpc';

import type { TrpcOutput } from '@/trpc';
import { cn } from '@/utils/cn';
import { formatDuration } from '@/utils/format-duration';
import { useListStore } from '@/utils/list-store';
import { format } from 'date-fns';
import {
  Clock4Icon,
  EllipsisVerticalIcon,
  EyeOffIcon,
  FlameIcon,
  HashIcon,
  MinusIcon,
  PlusIcon,
  SkullIcon,
  ThumbsUpIcon,
  TrashIcon,
} from 'lucide-react';
import { CalendarIcon } from 'lucide-react';
import { CheckIcon } from 'lucide-react';
import { VoteAverage } from './movie-card';
import { Button } from './ui/button';
import { ContextMenu, ContextMenuTrigger } from './ui/context-menu';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu';
import {
  DynamicMenuContent,
  type DynamicMenuContentType,
  DynamicMenuItem,
  DynamicMenuSub,
  DynamicMenuSubContent,
  DynamicMenuSubTrigger,
} from './ui/dynamic-menu-content';

type ListItem = TrpcOutput['list']['getItems'][number];
export function ListItemCard({ item, listId }: { item: ListItem; listId: string }) {
  const isWatched = !!item.watchedAt;
  const isSelected = useIsItemSelected(item.id);
  const isSelectionMode = useIsSelectionMode();
  const isRandomizedItem = useIsRandomizedItem(item.id);

  const toggleItemSelection = useListStore((state) => state.toggleItemSelection);

  const utils = trpc.useUtils();
  const setWatchedMutation = trpc.list.setWatched.useMutation({
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
            {item.posterUrl && (
              <img
                className="object-cover w-full h-full select-none"
                draggable={false}
                src={item.posterUrl}
                alt={item.title}
              />
            )}
            {item.rating && !isSelected && (
              <VoteAverage className="absolute top-2 left-2" voteAverage={item.rating / 10} />
            )}

            <PriorityBadge className="absolute bottom-2 left-2" priority={item.priority} />

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
                  disabled={setWatchedMutation.isPending}
                  onClick={() => setWatchedMutation.mutate({ listId, itemId: item.id, watched: true })}
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
  const setWatchedMutation = trpc.list.setWatched.useMutation({
    onSuccess: () => {
      utils.list.getItems.invalidate({ listId });
    },
  });

  const setPriorityMutation = trpc.list.setPriority.useMutation({
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
          disabled={setWatchedMutation.isPending}
          onClick={() => setWatchedMutation.mutate({ listId, itemId: item.id, watched: false })}
        >
          <EyeOffIcon />
          <span>Mark as unwatched</span>
        </DynamicMenuItem>
      ) : (
        <DynamicMenuItem
          disabled={setWatchedMutation.isPending}
          onClick={() => setWatchedMutation.mutate({ listId, itemId: item.id, watched: true })}
        >
          <CheckIcon />
          Mark as watched
        </DynamicMenuItem>
      )}
      <DynamicMenuSub>
        <DynamicMenuSubTrigger disabled={setPriorityMutation.isPending}>
          <HashIcon />
          Set priority
        </DynamicMenuSubTrigger>
        <DynamicMenuSubContent>
          <DynamicMenuItem onClick={() => setPriorityMutation.mutate({ listId, itemId: item.id, priority: 'low' })}>
            {priorityColors.low.icon}
            Low
          </DynamicMenuItem>
          <DynamicMenuItem onClick={() => setPriorityMutation.mutate({ listId, itemId: item.id, priority: 'normal' })}>
            {priorityColors.normal.icon}
            Normal
          </DynamicMenuItem>
          <DynamicMenuItem onClick={() => setPriorityMutation.mutate({ listId, itemId: item.id, priority: 'high' })}>
            {priorityColors.high.icon}
            High
          </DynamicMenuItem>
        </DynamicMenuSubContent>
      </DynamicMenuSub>
    </DynamicMenuContent>
  );
}

function getPriorityLabel(priority: number) {
  if (priority === 0) return 'normal' as const;
  if (priority > 0) return 'high' as const;
  return 'low' as const;
}

function getPriorityValue(priority: string) {
  if (priority === 'high') return 1;
  if (priority === 'low') return -1;
  return 0;
}

const priorityColors = {
  high: {
    bg: 'bg-orange-500',
    icon: <FlameIcon />,
  },
  normal: {
    bg: 'bg-blue-500',
    icon: <ThumbsUpIcon />,
  },
  low: {
    bg: 'bg-gray-500',
    icon: <SkullIcon />,
  },
};

export function PriorityBadge({ priority, className }: { priority: number; className: string }) {
  const { bg, icon } = priorityColors[getPriorityLabel(priority)];

  return (
    <p
      className={cn(
        'flex items-center justify-center size-8 rounded-full border-2 border-white text-white select-none [&_svg]:size-5 [&_svg]:shrink-0',
        bg,
        className,
      )}
    >
      {icon}
    </p>
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
