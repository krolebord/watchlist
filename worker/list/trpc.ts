import { initTRPC } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';

export function createContext({
  req,
  resHeaders,
  info,
  env,
}: FetchCreateContextFnOptions & {
  env: Env;
}) {
  return { req, resHeaders, env, info };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
