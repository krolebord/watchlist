import { Link } from '@tanstack/react-router';

import { trpc } from '@/trpc';
import { cn } from '@/utils/cn';
import { useUser } from '@/utils/use-user';
import { useMatch, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
type AppHeaderProps = {
  children: React.ReactNode;
  className?: string;
};
export function AppHeader({ children, className }: AppHeaderProps) {
  return (
    <header
      className={cn('bg-card border-b border-border justify-between items-center h-14 flex px-4 gap-2', className)}
    >
      {children}
    </header>
  );
}

type ProjectSelectorProps = {
  showCreate?: boolean;
};
export function ProjectSelector({ showCreate = true }: ProjectSelectorProps) {
  const lists = trpc.list.getLists.useQuery();

  const selectedListId = useMatch({ from: '/_app/list/$id', shouldThrow: false, select: (m) => m.loaderData?.listId });
  const selectedList = useMemo(() => {
    return lists.data?.find((list) => list.id === selectedListId);
  }, [lists.data, selectedListId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={lists.isLoading || lists.isError || lists.data?.length === 0}
        className="w-56 text-start flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
      >
        {selectedList?.name ?? 'Available lists...'}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {lists.data?.map((list) => (
          <DropdownMenuItem key={list.id} asChild>
            <Link to="/list/$id" params={{ id: list.id }}>
              {list.name}
            </Link>
          </DropdownMenuItem>
        ))}

        {showCreate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/">Create new list</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserAvatarDropdown() {
  const user = useUser();
  const navigate = useNavigate();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      navigate({ to: '/login', replace: true });
    },
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="select-none cursor-pointer">
          <AvatarFallback>{user.name?.slice(0, 2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Profile</DropdownMenuLabel>
        <DropdownMenuLabel className="font-normal">{user.name}</DropdownMenuLabel>
        <DropdownMenuLabel className="font-normal">{user.email}</DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
