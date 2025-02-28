import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/trpc';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const Route = createFileRoute('/_auth/login')({
  component: RouteComponent,
});

const emailSchema = z.object({
  email: z.string().email(),
});

type EmailFormSchema = z.infer<typeof emailSchema>;

function RouteComponent() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormSchema>({
    resolver: zodResolver(emailSchema),
  });

  const sendLinkMutation = trpc.auth.sendMagicLink.useMutation();

  const onSubmit = (data: EmailFormSchema) => {
    sendLinkMutation.mutate(data);
  };

  return (
    <div className="flex w-full flex-col items-center justify-center gap-6">
      <h1 className="font-bold text-3xl">Magic Link Login</h1>
      {!sendLinkMutation.isSuccess && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-sm flex-col gap-4 rounded-md p-4">
          <div className="flex min-h-16 flex-col justify-between gap-1 text-center">
            <Input {...register('email')} placeholder="example@gmail.com" autoFocus className="text-center" />
            <p className="text-red-500 text-sm">{errors.email?.message}</p>
          </div>
          <Button type="submit" disabled={sendLinkMutation.isPending}>
            Send Magic Link
          </Button>
        </form>
      )}
      {sendLinkMutation.isSuccess && sendLinkMutation.data.success && (
        <p className="text-purple-400 text-sm">Magic link has been sent to your email</p>
      )}
    </div>
  );
}
