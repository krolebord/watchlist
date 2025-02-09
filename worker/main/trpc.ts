import { createId } from '@paralleldrive/cuid2';
import { TRPCError, initTRPC } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { and } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import superjson from 'superjson';
import { TMDB } from 'tmdb-ts';
import { z } from 'zod';
import { EmailService } from '../emails/emails';
import { getSessionId, getValidUserSession } from '../utils/auth';
import { createDb, mainSchema } from './db';

export function createContext({
  req,
  resHeaders,
  info,
  env,
}: FetchCreateContextFnOptions & {
  env: Env;
}) {
  const emailService = new EmailService(env.RESEND_API_KEY);
  const db = createDb(env);
  const tmdb = new TMDB(env.TMDB_READ_ACCESS_TOKEN);

  return { req, resHeaders, env, info, db, emailService, tmdb, createId };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const sessionProcedure = t.procedure.use(async (opts) => {
  const sessionId = getSessionId(opts.ctx.req);

  const userSession = sessionId ? await getValidUserSession(opts.ctx.db, sessionId) : null;

  return opts.next({ ctx: { userSession } });
});

export const protectedProcedure = sessionProcedure.use(async (opts) => {
  const userSession = opts.ctx.userSession;

  if (!userSession) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return opts.next({ ctx: { userSession } });
});

export const listProcedure = protectedProcedure.input(z.object({ listId: z.string() })).use(async (opts) => {
  const userId = opts.ctx.userSession.user.id;
  const listId = opts.input.listId;

  const list = await opts.ctx.db
    .select({
      listId: mainSchema.usersToListsTable.listId,
      userId: mainSchema.usersToListsTable.userId,
    })
    .from(mainSchema.usersToListsTable)
    .where(and(eq(mainSchema.usersToListsTable.userId, userId), eq(mainSchema.usersToListsTable.listId, listId)))
    .limit(1);

  if (list.length === 0) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return opts.next();
});
