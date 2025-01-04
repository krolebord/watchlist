import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Server } from 'partyserver';
import { createContext, listRouter } from './router';

export class ListDurableObject extends Server {
  async sayHello(name: string): Promise<string> {
    return `Hello, ${name}!`;
  }

  onRequest(request: Request) {
    return fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: listRouter,
      createContext: createContext,
    });
  }
}
