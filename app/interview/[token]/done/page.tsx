export default function InterviewDonePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
          ✓
        </div>
        <h1 className="text-xl font-semibold text-gray-900">面試已完成，感謝參與</h1>
        <p className="mt-2 text-sm text-gray-500">
          您的作答已成功提交，我們會盡快與您聯繫後續結果。此連結已無法再次進入作答。
        </p>
      </div>
    </div>
  );
}
