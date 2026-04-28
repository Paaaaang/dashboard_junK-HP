import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h2>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}