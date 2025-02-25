import { lastOpenedList } from '@/utils/last-opened-list';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/last-list')({
  loader: ({ context: { trpc } }) => {
    const lastListId = lastOpenedList.get();
    if (!lastListId) {
      return null;
    }

    throw redirect({ to: '/list/$id', params: { id: lastListId } });
  },
});
