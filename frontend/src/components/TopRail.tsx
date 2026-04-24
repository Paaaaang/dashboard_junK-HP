import { BellRing } from "lucide-react";

export function TopRail() {
  return (
    <header className="top-rail top-rail-dashboard">
      <button
        className="dashboard-alert-button"
        type="button"
        aria-label="알림"
      >
        <BellRing className="icon-sm" />
      </button>
    </header>
  );
}
