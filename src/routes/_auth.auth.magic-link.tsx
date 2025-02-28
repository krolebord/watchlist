import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/trpc';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const magicLinkSchema = z.object({
  email: z.string().email().default(''),
  token: z.string().default(''),
});

export const Route = createFileRoute('/_auth/auth/magic-link')({
  component: RouteComponent,
  validateSearch: zodValidator(magicLinkSchema),
  loaderDeps: ({ search }) => ({ email: search.email, token: search.token }),
  loader: async ({ deps, context: { trpcClient } }) => {
    if (!deps.email || !deps.token) {
      return { status: 'invalid-token' as const };
    }
    const result = await trpcClient.auth.useMagicLink.mutate({ email: deps.email, token: deps.token });

    if (result.status === 'success') {
      if (result.listId) {
        throw redirect({ to: '/list/$id', params: { id: result.listId }, replace: true });
      }
      throw redirect({ to: '/', replace: true });
    }

    return result;
  },
});

function RouteComponent() {
  const { status } = Route.useLoaderData();
  return (
    <div className="flex w-full flex-col items-center justify-center gap-6">
      {status === 'invalid-token' && (
        <>
          <h1 className="font-bold text-3xl">Magic Link Login</h1>
          <p className="text-red-500 text-sm">Seems like your login link has expired</p>
          <Button asChild>
            <Link to="/login">Send me a new link again</Link>
          </Button>
        </>
      )}
      {status === 'user-not-found' && <Onboarding />}
    </div>
  );
}

const registerSchema = z.object({
  name: z.string().min(2),
});

type RegisterFormSchema = z.infer<typeof registerSchema>;

function Onboarding() {
  const { email, token } = Route.useLoaderDeps();
  const navigate = useNavigate();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      if (data.status === 'success') {
        if (data.listId) {
          navigate({ to: '/list/$id', params: { id: data.listId }, replace: true });
          return;
        }

        navigate({ to: '/', replace: true });
      }
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormSchema>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormSchema) => {
    registerMutation.mutate({ email, token, name: data.name });
  };

  return (
    <>
      <h1 className="font-bold text-3xl">Welcome!</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-sm flex-col gap-4 rounded-md p-4">
        <div className="flex min-h-16 flex-col justify-between gap-1 text-center">
          <Input {...register('name')} placeholder="Your name" autoFocus className="text-center" />
          <p className="text-red-500 text-sm">{errors.name?.message}</p>
        </div>
        <Button type="submit" disabled={registerMutation.isPending}>
          Submit
        </Button>
      </form>
    </>
  );
}
