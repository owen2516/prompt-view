import { getAuthenticatedAdmin } from "@/lib/auth";

export default async function SettingsPage() {
  const admin = await getAuthenticatedAdmin();

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900">系統設定</h1>
      <p className="mt-0.5 text-sm text-gray-500">帳號資訊與通知偏好</p>

      <div className="mt-4 max-w-xl rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">帳號資訊</h2>
        <dl className="grid grid-cols-3 gap-y-3 text-sm">
          <dt className="text-gray-500">姓名</dt>
          <dd className="col-span-2 text-gray-900">{admin?.name ?? "-"}</dd>
          <dt className="text-gray-500">Email</dt>
          <dd className="col-span-2 text-gray-900">{admin?.email ?? "-"}</dd>
          <dt className="text-gray-500">職稱</dt>
          <dd className="col-span-2 text-gray-900">
            {admin?.role === "manager" ? "技術主管" : admin?.role}
          </dd>
        </dl>
      </div>

      <div className="mt-4 max-w-xl rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">通知偏好</h2>
        <p className="text-sm text-gray-400">
          候選人提交面試後的 Email 通知功能將於 Phase 3 開放。
        </p>
      </div>
    </div>
  );
}
