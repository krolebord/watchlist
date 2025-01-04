import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Server } from 'partyserver';
import { listRouter } from './router';
import { createContext } from './trpc';

export class ListDurableObject extends Server {
  async sayHello(name: string): Promise<string> {
    return `Hello, ${name}!`;
  }

  onRequest(request: Request) {
    return fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: listRouter,
      createContext: ({ req, resHeaders, info }) => createContext({ req, resHeaders, info, env: this.env as Env }),
    });
  }
}
