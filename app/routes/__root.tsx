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
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </div>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
