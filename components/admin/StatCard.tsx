import clsx from "clsx";
import type { ReactNode } from "react";

export function StatCard({
  icon,
  value,
  label,
  highlight,
}: {
  icon?: ReactNode;
  value: ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-1 rounded-lg border p-4 text-center",
        highlight ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white"
      )}
    >
      {icon && <div className="text-xl">{icon}</div>}
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
