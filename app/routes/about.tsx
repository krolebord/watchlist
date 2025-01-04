import { createFileRoute } from '@tanstack/react-router';
import { trpc, trpcUtils } from '../trpc';

export const Route = createFileRoute('/about')({
  component: About,
  loader: async () => {
    return trpcUtils.greet.ensureData('hello');
  },
});

function About() {
  const [data] = trpc.greet.useSuspenseQuery('hello');
  return <div className="p-2">{data}</div>;
}
