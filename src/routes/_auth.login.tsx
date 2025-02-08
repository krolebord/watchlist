import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/trpc';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Outlet, createFileRoute } from '@tanstack/react-router';
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
    <div className="w-full flex-col flex items-center gap-6 justify-center">
      <h1 className="text-3xl font-bold">Magic Link Login</h1>
      {!sendLinkMutation.isSuccess && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-sm w-full flex-col gap-4 p-4 rounded-md">
          <div className="flex flex-col gap-1 justify-between min-h-16 text-center">
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
