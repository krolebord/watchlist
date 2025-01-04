import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCQueryUtils, createTRPCReact } from '@trpc/react-query';
import type { ListRouter } from '../worker';

export const trpc = createTRPCReact<ListRouter>();
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
});

export const queryClient = new QueryClient();

export const trpcUtils = createTRPCQueryUtils({
  client: trpcClient,
  queryClient,
});
