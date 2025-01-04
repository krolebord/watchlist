import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { z } from 'zod';
import { publicProcedure, router } from './trpc';

export function createContext({ req, resHeaders }: FetchCreateContextFnOptions) {
  return { req, resHeaders };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

export const listRouter = router({
  greet: publicProcedure.input(z.string()).query(async ({ input }) => {
    return `Hello, ${input}!`;
  }),
});

export type ListRouter = typeof listRouter;
