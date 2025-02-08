import { Button } from '@/components/ui/button';
import { QueryClientProvider } from '@tanstack/react-query';
import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { queryClient, trpc, type trpcClient, type trpcUtils } from '../trpc';

type RouterContext = {
  trpc: typeof trpcUtils;
  trpcClient: typeof trpcClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
});

function Root() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}
