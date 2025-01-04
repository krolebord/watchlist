import { createFileRoute } from '@tanstack/react-router';
import { trpc, trpcUtils } from '../trpc';
import { wait } from '../utils/wait';

export const Route = createFileRoute('/about')({
  component: About,
  pendingComponent: () => <div>Loading...</div>,
  loaderDeps(opts) {
    return { time: new Date().toString() };
  },
  loader: async ({ deps }) => {
    await wait(5000);
    return trpcUtils.greet.ensureData(deps.time);
  },
});

function About() {
  const { time } = Route.useLoaderDeps();
  const [data] = trpc.greet.useSuspenseQuery(time);
  return <div className="p-2">{data}</div>;
}
