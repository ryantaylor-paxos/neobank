import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'glass-card p-5',
        hover && 'hover:border-white/20 transition-all duration-200 cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
