import { QueryClient } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCQueryUtils, createTRPCReact } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import superjson from 'superjson';
import type { ListRouter } from '../worker';

export const trpc = createTRPCReact<ListRouter>();
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
    }),
  ],
});

export const queryClient = new QueryClient();

export const trpcUtils = createTRPCQueryUtils({
  client: trpcClient,
  queryClient,
});

export type TrpcInput = inferRouterInputs<ListRouter>;
export type TrpcOutput = inferRouterOutputs<ListRouter>;
