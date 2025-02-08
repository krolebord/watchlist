import type { TrpcOutput } from '@/trpc';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { CheckIcon } from 'lucide-react';
import { motion } from 'motion/react';

export function VoteAverage({ voteAverage, className }: { voteAverage: number; className: string }) {
  const score = Math.round(voteAverage * 10);
  const { border, text } = getScoreStyles(voteAverage);
  return (
    <p
      className={cn(
        'flex items-center justify-center size-8 bg-black rounded-full border-2 text-white select-none',
        border,
        className,
      )}
    >
      <span className={cn(text)}>{score}</span>
    </p>
  );
}

function getScoreStyles(voteAverage: number) {
  if (voteAverage >= 7) {
    return {
      border: 'border-green-500',
      text: 'text-green-500',
    };
  }

  if (voteAverage >= 5) {
    return {
      border: 'border-yellow-500',
      text: 'text-yellow-500',
    };
  }

  return {
    border: 'border-red-500',
    text: 'text-red-500',
  };
}
