import { DurableObject } from 'cloudflare:workers';

export class ListDurableObject extends DurableObject {
  // biome-ignore lint/complexity/noUselessConstructor: <explanation>
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async sayHello(name: string): Promise<string> {
    return `Hello, ${name}!`;
  }
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const id: DurableObjectId = env.MY_DURABLE_OBJECT.idFromName(new URL(request.url).pathname);

    const stub = env.MY_DURABLE_OBJECT.get(id);

    const greeting = await stub.sayHello('world');

    return new Response(greeting);
  },
} satisfies ExportedHandler<Env>;
