import { type MovieWithMediaType, TMDB, type TVWithMediaType } from 'tmdb-ts';
import { z } from 'zod';
import { authRouter } from './routers/auth.router';
import { listRouter } from './routers/list.router';
import { searchRouter } from './routers/search.router';
import { publicProcedure, router } from './trpc';
export const mainRouter = router({
  auth: authRouter,

  list: listRouter,

  search: searchRouter,
});

export type MainRouter = typeof mainRouter;
