import { type TrpcOutput, trpc } from '@/trpc';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { CheckIcon, MailIcon, PenIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectTrigger } from './ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Skeleton } from './ui/skeleton';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './ui/table';
import { formatDuration } from '@/utils/format-duration';

type ListSettingsSheetProps = {
  listId: string;
  children: React.ReactNode;
  asChild?: boolean;
};

export function ListSettingsSheet({ listId, children, asChild }: ListSettingsSheetProps) {
  const [open, setOpen] = useState(false);

  const listDetails = trpc.list.getDetails.useQuery(
    { listId },
    {
      enabled: open,
    },
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild={asChild}>{children}</SheetTrigger>
      <SheetContent side="left" noClose onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader>
          <SheetTitle>List Settings</SheetTitle>
        </SheetHeader>
        <div className="h-4" />
        {listDetails.data ? (
          <ListSettingsForm list={listDetails.data} />
        ) : (
          <div className="flex flex-col gap-2">
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-2/3 h-8" />
            <Skeleton className="w-1/3 h-8" />
            <Skeleton className="w-1/2 h-8" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

type ListSettingsFormProps = {
  list: TrpcOutput['list']['getDetails'];
};
function ListSettingsForm({ list }: ListSettingsFormProps) {
  return (
    <div className="flex flex-col gap-12 justify-between h-full">
      <div className="flex flex-col gap-12">
        <ListNameForm listId={list.id} name={list.name} />
        <ListUsers listId={list.id} users={list.users} />
      </div>
      <div className="flex flex-col text-gray-500 pb-6">
        <p>
          Watched: {list.stats.watchedCount} / {list.stats.count}
        </p>
        <p>
          Duration: {formatDuration(list.stats.watchedDuration)} / {formatDuration(list.stats.totalDuration)}
        </p>
        <p>Average rating: {Math.round(list.stats.averageRating)}</p>
      </div>
    </div>
  );
}

const editListSchema = z.object({
  name: z.string().min(2),
});

type EditListSchema = z.infer<typeof editListSchema>;

type ListNameFormProps = {
  listId: string;
  name: string;
};
function ListNameForm({ listId, name }: ListNameFormProps) {
  const utils = trpc.useUtils();
  const editListMutation = trpc.list.editList.useMutation({
    onSuccess: (data, { newName }) => {
      if (data.listId) {
        utils.list.getLists.invalidate();
        utils.list.getDetails.invalidate({ listId });
        reset({
          name: newName,
        });
      }
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<EditListSchema>({
    resolver: zodResolver(editListSchema),
    defaultValues: {
      name,
    },
  });

  const onSubmit = (data: EditListSchema) => {
    editListMutation.mutate({ listId, newName: data.name });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-row gap-2">
      <Input {...register('name')} placeholder="Create a new list" />
      <Button
        type="submit"
        variant="outline"
        disabled={editListMutation.isPending || !isDirty}
        className="p-0 aspect-square"
      >
        {editListMutation.isSuccess && !isDirty ? <CheckIcon className="!size-4" /> : <PenIcon className="!size-4" />}
      </Button>
    </form>
  );
}

const emailSchema = z.object({
  email: z.string().email(),
});

type EmailSchema = z.infer<typeof emailSchema>;

type ListUsersProps = {
  listId: string;
  users: {
    id: string;
    name: string;
    email: string;
  }[];
};
function ListUsers({ listId, users }: ListUsersProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid, isDirty },
  } = useForm<EmailSchema>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const inviteUserMutation = trpc.list.inviteUser.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        reset();
      }
    },
  });

  const onSubmit = (data: EmailSchema) => {
    inviteUserMutation.mutate({ listId, email: data.email });
  };

  return (
    <div>
      <p>Collaborators</p>
      <div className="h-2" />
      <Table>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="p-2">
                <div className="max-w-[120px] truncate">{user.name}</div>
              </TableCell>
              <TableCell className="p-2">
                <div className="max-w-[180px] truncate">{user.email}</div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="h-2" />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-row gap-2">
        <Input {...register('email')} placeholder="Invite by email" />
        <Button
          type="submit"
          variant="outline"
          disabled={inviteUserMutation.isPending || !isValid}
          className="p-0 aspect-square"
        >
          {inviteUserMutation.isSuccess && !isDirty ? (
            <CheckIcon className="!size-4" />
          ) : (
            <MailIcon className="!size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
