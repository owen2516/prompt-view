"use client";

import { useEffect, useState } from "react";
import { InterviewListPanel } from "@/components/admin/interviews/InterviewListPanel";
import { InterviewDetailPanel } from "@/components/admin/interviews/InterviewDetailPanel";
import { NewInterviewDialog } from "@/components/admin/interviews/NewInterviewDialog";
import type { InterviewSetCard } from "@/lib/data/interviews";

export default function InterviewsPage() {
  const [sets, setSets] = useState<InterviewSetCard[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load(selectAfter?: string) {
    const res = await fetch("/api/admin/interviews");
    if (!res.ok) return;
    const { sets } = await res.json();
    setSets(sets);
    if (selectAfter) {
      setSelectedId(selectAfter);
    } else if (!selectedId && sets.length > 0) {
      setSelectedId(sets[0].id);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!sets) {
    return <div className="p-8 text-sm text-gray-400">載入中...</div>;
  }

  return (
    <div className="flex h-screen">
      <InterviewListPanel
        sets={sets}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreateClick={() => setShowCreate(true)}
      />
      {selectedId ? (
        <InterviewDetailPanel setId={selectedId} />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
          尚無面試模板，點選「+ 新增」建立第一個面試
        </div>
      )}

      {showCreate && (
        <NewInterviewDialog
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            load(id);
          }}
        />
      )}
    </div>
  );
}
