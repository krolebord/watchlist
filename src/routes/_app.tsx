import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

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
