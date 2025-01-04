import { Button } from '@/components/ui/button';
import { QueryClientProvider } from '@tanstack/react-query';
import { Link, Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { queryClient, trpc, trpcClient } from '../trpc';

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <div>
          <Button asChild>
            <Link to="/">Home</Link>
          </Button>
          <Button asChild>
            <Link to="/about">About</Link>
          </Button>
        </div>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
