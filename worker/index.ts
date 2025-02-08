import { AsyncLocalStorage } from 'node:async_hooks';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { getServerByName } from 'partyserver';
import { createDb } from './main/db';
import { mainRouter } from './main/router';
import { createContext } from './main/trpc';
import { getSessionId, getValidUserSession } from './utils/auth';
import type { ServerTimings } from './utils/server-timings';

const asyncLocalStorage = new AsyncLocalStorage<{ timings: ServerTimings }>();

function time<T>(name: string, fn: () => Promise<T>) {
  const store = asyncLocalStorage.getStore();
  if (!store) {
    throw new Error('No store found');
  }
  return store.timings.time(name, fn);
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const pathname = new URL(request.url).pathname;

    if (pathname.startsWith('/api')) {
      return await fetchRequestHandler({
        endpoint: '/api/trpc',
        req: request,
        router: mainRouter,
        createContext: ({ req, resHeaders, info }) => createContext({ req, resHeaders, info, env }),
        onError({ error }) {
          console.error(error);
        },
      });

      // const stub = await getServerByName(env.LIST_DO, 'singleton');
      // const resp = await stub.fetch(request);
      // return resp;
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

export { ListDurableObject } from './list/list-durable-object';

export type { MainRouter } from './main/router';
export type { ListRouter } from './list/router';
