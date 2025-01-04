import { z } from 'zod';
import { publicProcedure, router } from './trpc';

export const listRouter = router({
  greet: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    console.log(ctx.env);
    return `Hello, ${input}!`;
  }),
});

export type ListRouter = typeof listRouter;
