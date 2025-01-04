import { AsyncLocalStorage } from 'node:async_hooks';
import { getServerByName } from 'partyserver';
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

    console.log(pathname);
    if (pathname.startsWith('/api')) {
      const stub = await getServerByName(env.LIST_DO, 'singleton');
      const resp = await stub.fetch(request);
      return resp;
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

export { ListDurableObject } from './list/list-durable-object';
export type { ListRouter } from './list/router';
