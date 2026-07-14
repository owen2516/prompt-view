"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import {
  IconGrid,
  IconList,
  IconUsers,
  IconSparkle,
  IconGear,
  IconLogo,
} from "@/components/admin/icons";

const navItems = [
  { href: "/admin/interviews", label: "面試管理", icon: IconGrid },
  { href: "/admin/sessions", label: "面試紀錄", icon: IconList, badgeKey: "pending" as const },
  { href: "/admin/candidates", label: "應試者", icon: IconUsers },
  { href: "/admin/ai-settings", label: "AI 設定", icon: IconSparkle },
  { href: "/admin/settings", label: "系統設定", icon: IconGear },
];

export function Sidebar({
  adminName,
  adminRole,
  pendingReviewCount,
}: {
  adminName: string;
  adminRole: string;
  pendingReviewCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside
      className={clsx(
        "flex h-screen flex-col border-r border-gray-200 bg-white transition-all",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
          <IconLogo className="h-4 w-4" />
        </div>
        {!collapsed && <span className="text-lg font-semibold text-gray-900">InterviewHub</span>}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <div className="mb-2 px-2 text-xs font-medium text-gray-400">主管工作台</div>
        )}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            const badge = item.badgeKey === "pending" ? pendingReviewCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-violet-50 text-violet-700"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {badge > 0 && (
                  <span
                    className={clsx(
                      "flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white",
                      collapsed && "absolute ml-6 -mt-4"
                    )}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-100 p-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="mb-2 w-full rounded-lg px-3 py-1.5 text-left text-xs text-gray-400 hover:bg-gray-50"
        >
          {collapsed ? "»" : "‹ 收合側欄"}
        </button>
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
            {adminName.slice(0, 1)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-900">{adminName}</div>
              <div className="truncate text-xs text-gray-500">{adminRole}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="shrink-0 text-xs text-gray-400 hover:text-gray-600"
            >
              登出
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
