import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <header
      className={
        actions ? "page-header-row page-header-row-actions" : "page-header-row"
      }
    >
      <h2>{title}</h2>
      {actions ? <div>{actions}</div> : null}
    </header>
  );
}
