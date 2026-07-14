import { getAuthenticatedAdmin } from "@/lib/auth";
import { getPendingReviewCount } from "@/lib/data/sessions";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    // /admin/login renders without the sidebar chrome.
    return <>{children}</>;
  }

  const pendingReviewCount = await getPendingReviewCount(admin.id);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        adminName={admin.name ?? admin.email ?? "主管"}
        adminRole={admin.role === "manager" ? "技術主管" : admin.role}
        pendingReviewCount={pendingReviewCount}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
