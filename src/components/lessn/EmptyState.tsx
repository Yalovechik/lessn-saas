import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  desc: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, desc, action }: EmptyStateProps) {
  return (
    <div className="text-center py-14 px-5">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-sm font-semibold text-muted-foreground mb-1.5">{title}</p>
      <p className="text-xs text-muted-foreground/70 mb-5">{desc}</p>
      {action}
    </div>
  );
}
