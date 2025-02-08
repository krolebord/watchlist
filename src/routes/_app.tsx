import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trpc } from '@/trpc';
import { useUser } from '@/utils/use-user';
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useLoaderData,
  useMatch,
  useMatches,
  useNavigate,
  useRouteContext,
} from '@tanstack/react-router';
import { useMemo, useState } from 'react';

export const Route = createFileRoute('/_app')({
  component: RouteComponent,
  loader: async ({ context: { trpc } }) => {
    const user = await trpc.auth.getUser.fetch();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    return {
      user,
    };
  },
  staleTime: 1000 * 60 * 5,
});

function RouteComponent() {
  return <Outlet />;
}
