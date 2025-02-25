import { AddMovieDialog } from '@/components/add-movie-dialog';
import { AppHeader, ProjectSelector, UserAvatarDropdown } from '@/components/app-layout';
import { ListItemCard, useIsSelectionMode } from '@/components/list-item';
import { ListSettingsSheet } from '@/components/list-settings-sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { trpc } from '@/trpc';
import { cn } from '@/utils/cn';
import { lastOpenedList } from '@/utils/last-opened-list';
import { ListStoreProvider, useListStore } from '@/utils/list-store';
import { itemsFilterSchema, useSortedAndFilteredListItemsSelector } from '@/utils/use-list-items';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Link, createFileRoute, useParams, useSearch } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  CheckIcon,
  Clock4Icon,
  EllipsisVertical,
  HashIcon,
  PlusIcon,
  SettingsIcon,
  ShuffleIcon,
  SquareDashed,
  SquareDashedMousePointerIcon,
  StarIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import type { z } from 'zod';

export const Route = createFileRoute('/_app/list/$id')({
  component: RouteComponent,
  validateSearch: zodValidator(itemsFilterSchema),
  loaderDeps: () => ({}),
  loader: async ({ params, context }) => {
    lastOpenedList.set(params.id);
    await Promise.all([
      context.trpc.list.getItems.prefetch({ listId: params.id }),
      context.trpc.list.getLists.prefetch(),
    ]);
    return {
      listId: params.id,
    };
  },
});

type SortingOptions = z.infer<typeof itemsFilterSchema>;

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

  return (
    <ListStoreProvider listId={listId}>
      <AppHeader>
        <div className="flex items-center gap-2">
          <ProjectSelector />
          <ListSettings />
        </div>
        <UserAvatarDropdown />
      </AppHeader>
      <AddItemButton />
      <div className="flex items-center justify-center top-0 sticky z-10 bg-background/80 pb-2 backdrop-blur-md">
        <div className="items-center gap-x-4 w-full justify-start px-4 pt-2 max-w-7xl grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto] gap-y-1">
          <SortingHeader />
          <SearchInput className="max-sm:col-span-2 max-sm:row-start-2 sm:max-w-52" />
          <HeaderMenu />
        </div>
      </div>
      <div className="w-full flex flex-col items-center">
        <ItemsList />
      </div>
    </ListStoreProvider>
  );
}

const sortOrderIcon: Record<SortingOptions['sortOrder'], React.ReactNode> = {
  asc: <ArrowUpIcon />,
  desc: <ArrowDownIcon />,
};

const sortByIcon: Record<SortingOptions['sortBy'], React.ReactNode> = {
  duration: <Clock4Icon />,
  rating: <StarIcon />,
  dateAdded: <CalendarIcon />,
  priority: <HashIcon />,
};

const sortByLabel: Record<SortingOptions['sortBy'], string> = {
  duration: 'Duration',
  rating: 'Rating',
  dateAdded: 'Date Added',
  priority: 'Priority',
};

type SortingByOptionProps = {
  sortBy: SortingOptions['sortBy'];
};
function SortingOption({ sortBy }: SortingByOptionProps) {
  return (
    <DropdownMenuItem asChild className="w-full justify-between">
      <Link to="." search={(prev) => ({ ...prev, sortBy })}>
        <div className="flex items-center gap-2">
          {sortByIcon[sortBy]}
          <span>{sortByLabel[sortBy]}</span>
        </div>
      </Link>
    </DropdownMenuItem>
  );
}

function HeaderMenu({ className }: { className?: string }) {
  const selectAllItems = useListStore((state) => state.selectItems);
  const clearSelectedItems = useListStore((state) => state.clearSelectedItems);
  const isSelectionMode = useIsSelectionMode();
  const isRandomizedItem = useListStore((state) => !!state.randomizedItem);

  const selectRandomFromSelectedItems = useListStore((state) => state.selectRandomFromSelectedItems);
  const clearRandomizedItem = useListStore((state) => state.clearRandomizedItem);

  const listId = useListId();
  const { data: allItems = [] } = trpc.list.getItems.useQuery(
    { listId },
    {
      select: (data) => data.map((item) => item.id),
    },
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className={cn('shrink-0', className)}>
        <Button variant="outline" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {isSelectionMode ? (
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              clearSelectedItems();
            }}
          >
            <SquareDashed /> Clear selection
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              selectAllItems(allItems);
            }}
          >
            <SquareDashedMousePointerIcon /> Select all
          </DropdownMenuItem>
        )}
        {isSelectionMode && !isRandomizedItem && (
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              selectRandomFromSelectedItems();
            }}
          >
            <ShuffleIcon /> Select random
          </DropdownMenuItem>
        )}
        {isRandomizedItem && (
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              clearRandomizedItem();
            }}
          >
            <CheckIcon /> Clear randomized
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortingHeader({ className }: { className?: string }) {
  const { sortBy, sortOrder } = useSearch({ from: '/_app/list/$id' });

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {sortByIcon[sortBy]}
            <span>{sortByLabel[sortBy]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <SortingOption sortBy="duration" />
          <SortingOption sortBy="dateAdded" />
          <SortingOption sortBy="rating" />
          <SortingOption sortBy="priority" />
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" size="icon" asChild>
        <Link to="." search={(prev) => ({ ...prev, sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}>
          {sortOrderIcon[sortOrder]}
        </Link>
      </Button>
    </div>
  );
}

function SearchInput({ className }: { className?: string }) {
  const searchQuery = useListStore((state) => state.searchQuery);
  const setSearchQuery = useListStore((state) => state.setSearchQuery);

  return (
    <Input
      placeholder="Search..."
      className={className}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  );
}

function AddItemButton() {
  const listId = useListId();

  const { data: alreadyAddedItems = [] } = trpc.list.getItems.useQuery(
    { listId },
    {
      select: (data) => data.map((item) => item.tmdbId).filter((id) => id !== null),
    },
  );

  return (
    <AddMovieDialog listId={listId} alreadyAddedItems={alreadyAddedItems} asChild>
      <Button variant="default" size="icon" className="size-10 rounded-full fixed bottom-4 right-4 z-50">
        <PlusIcon className="!size-6" />
      </Button>
    </AddMovieDialog>
  );
}

function ItemsList() {
  const listId = useListId();
  const { data: items } = trpc.list.getItems.useQuery(
    { listId },
    {
      select: useSortedAndFilteredListItemsSelector(),
    },
  );

  const selectedRandomizedItem = useListStore((state) => state.randomizedItem);
  const searchQuery = useListStore((state) => state.searchQuery);
  const orderedItems = useMemo(() => {
    if (!items) {
      return items ?? [];
    }

    const newItems = searchQuery
      ? [...items.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))]
      : [...items];

    if (selectedRandomizedItem) {
      const selectedItemIndex = items.findIndex((item) => item.id === selectedRandomizedItem);
      newItems.splice(selectedItemIndex, 1);
      newItems.unshift(items[selectedItemIndex]);
    }

    return newItems;
  }, [items, selectedRandomizedItem, searchQuery]);

  const [animateRef] = useAutoAnimate();

  return (
    <div
      className="w-full flex flex-wrap justify-center md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 pt-2 pb-20 max-w-7xl"
      ref={animateRef}
    >
      {orderedItems.map((item) => (
        <ListItemCard key={item.id} item={item} listId={listId} />
      ))}
    </div>
  );
}
