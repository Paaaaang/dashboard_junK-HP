import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={twMerge("flex items-center justify-between mb-6 py-4 border-b border-border", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-text-primary tracking-tight">{title}</h2>
        {description && <p className="text-sm font-medium text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}