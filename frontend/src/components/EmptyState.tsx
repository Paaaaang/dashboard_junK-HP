import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={999} style={{ padding: "60px 20px", textAlign: "center" }}>     
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "var(--color-surface-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center",     
            }}
            aria-hidden="true"
          >
            <Icon style={{ width: 32, height: 32, color: "var(--color-text-tertiary)" }} />
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {title}
            </p>
            {description && (
              <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-tertiary)" }}>
                {description}
              </p>
            )}
          </div>
          {action && (
            <button type="button" className="btn btn-primary" onClick={action.onClick}>
              {action.label}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
