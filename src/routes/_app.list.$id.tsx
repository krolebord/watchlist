import { AddMovieDialog } from '@/components/add-movie-dialog';
import { AppHeader, ProjectSelector, UserAvatarDropdown } from '@/components/app-layout';
import { ListItemCard } from '@/components/list-item';
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
  return (
    <>
      <AppHeader>
        <div className="flex items-center gap-2">
          <ProjectSelector />
          <ListSettings />
        </div>
        <UserAvatarDropdown />
      </AppHeader>
      <AddItemButton />
      <div className="w-full flex flex-col items-center">
        <ItemsList />
      </div>
    </>
  );
}

function AddItemButton() {
  const listId = useListId();

  const { data: alreadyAddedItems } = trpc.list.getItems.useQuery(
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
  const { data: items } = trpc.list.getItems.useQuery({ listId });

  const [animateRef] = useAutoAnimate();

  return (
    <div
      className="w-full flex flex-wrap justify-center md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 px-4 pt-4 pb-20 max-w-7xl"
      ref={animateRef}
    >
      {items?.map((item) => (
        <ListItemCard key={item.id} item={item} listId={listId} />
      ))}
    </div>
  );
}
