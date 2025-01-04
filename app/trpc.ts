import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { ListRouter } from '../worker';

export const trpc = createTRPCClient<ListRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
});
