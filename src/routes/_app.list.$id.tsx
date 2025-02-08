import { itemsFilterSchema } from '@/../common/items-filter-schema';
import { AddMovieDialog } from '@/components/add-movie-dialog';
import { AppHeader, ProjectSelector, UserAvatarDropdown } from '@/components/app-layout';
import { ListItemCard, useIsSelectionMode } from '@/components/list-item';
import { ListSettingsSheet } from '@/components/list-settings-sheet';
import { VoteAverage } from '@/components/movie-card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type TrpcOutput, trpc } from '@/trpc';
import { ListStoreProvider, useListStore } from '@/utils/list-store';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Link, createFileRoute, useLoaderData, useParams, useSearch } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { format } from 'date-fns';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  CheckIcon,
  Clock4Icon,
  EyeOffIcon,
  PlusIcon,
  SettingsIcon,
  ShuffleIcon,
  StarIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import { RefObject, useMemo } from 'react';
import type { z } from 'zod';

export const Route = createFileRoute('/_app/list/$id')({
  component: RouteComponent,
  validateSearch: zodValidator(itemsFilterSchema),
  loaderDeps: ({ search: { sortBy, sortOrder } }) => ({ sortBy, sortOrder }),
  loader: async ({ params, context, deps }) => {
    const data = await context.trpc.list.getItems.fetch({ listId: params.id, ...deps });
    return {
      listId: params.id,
      items: data,
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
      <div className="flex items-center justify-between px-4 pt-2">
        <SortingHeader />
        <RandomizeSelectionButton />
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
};

const sortByLabel: Record<SortingOptions['sortBy'], string> = {
  duration: 'Duration',
  rating: 'Rating',
  dateAdded: 'Date Added',
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

function RandomizeSelectionButton() {
  const selectedRandomItem = useListStore((state) => state.randomizedItem);
  const isSelectionMode = useIsSelectionMode();

  const randomizeSelection = useListStore((state) => state.selectRandomFromSelectedItems);
  const clearRandomizedItem = useListStore((state) => state.clearRandomizedItem);

  if (!isSelectionMode && !selectedRandomItem) {
    return null;
  }

  return (
    <Button
      variant="outline"
      onClick={() => {
        if (!selectedRandomItem) {
          randomizeSelection();
        } else {
          clearRandomizedItem();
        }
      }}
    >
      {selectedRandomItem ? (
        <>
          <CheckIcon /> Clear
        </>
      ) : (
        <>
          <ShuffleIcon /> Select random{' '}
        </>
      )}
    </Button>
  );
}

function SortingHeader() {
  const { sortBy, sortOrder } = useSearch({ from: '/_app/list/$id' });

  return (
    <div className="flex items-center gap-1">
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

function AddItemButton() {
  const listId = useListId();

  const alreadyAddedItems = useLoaderData({
    from: '/_app/list/$id',
    select: (data) => data.items.map((item) => item.tmdbId).filter((id) => id !== null),
  });

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
  const { items } = useLoaderData({ from: '/_app/list/$id' });

  const selectedRandomizedItem = useListStore((state) => state.randomizedItem);

  const orderedItems = useMemo(() => {
    if (!selectedRandomizedItem) {
      return items;
    }

    const selectedItemIndex = items.findIndex((item) => item.id === selectedRandomizedItem);
    const newItems = [...items];
    newItems.splice(selectedItemIndex, 1);
    newItems.unshift(items[selectedItemIndex]);

    return newItems;
  }, [items, selectedRandomizedItem]);

  const [animateRef] = useAutoAnimate();

  return (
    <div
      className="w-full flex flex-wrap justify-center md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 pt-4 pb-20 max-w-7xl"
      ref={animateRef}
    >
      {orderedItems.map((item) => (
        <ListItemCard key={item.id} item={item} listId={listId} />
      ))}
    </div>
  );
}
