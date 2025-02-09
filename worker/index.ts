import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { mainRouter } from './main/router';
import { createContext, createServices } from './main/trpc';

export default {
  async fetch(req, env, ctx): Promise<Response> {
    const pathname = new URL(req.url).pathname;

    if (pathname.startsWith('/api')) {
      const services = await createServices({ env, req });
      return await fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: mainRouter,
        createContext: ({ req, resHeaders, info }) => createContext({ req, resHeaders, info, env, services }),
        onError({ error }) {
          console.error(error);
        },
        responseMeta({ ctx }) {
          if (!ctx) {
            return {};
          }
          return {
            headers: {
              'Server-Timing': ctx?.serverTimings.getSerializedTimings(),
            },
          };
        },
      });
    }
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;

export { ListDurableObject } from './list/list-durable-object';

export type { MainRouter } from './main/router';
export type { ListRouter } from './list/router';
