import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { useDismissLayer } from "@/components/shell";
import { faNum } from "@/lib/format";
import { restoreBoard, serializeBoard } from "@/lib/geometry/svg";
import type { BoardDoc } from "@/lib/geometry/types";
import { useBoards } from "@/lib/store";

export const Route = createFileRoute("/boards")({ component: BoardsPage });

function BoardsPage() {
  const boards = useBoards((s) => s.boards);
  const ready = useBoards((s) => s.ready);
  const setActive = useBoards((s) => s.setActive);
  const rename = useBoards((s) => s.rename);
  const remove = useBoards((s) => s.remove);
  const duplicate = useBoards((s) => s.duplicate);
  const openDoc = useBoards((s) => s.openDoc);
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const closeDelete = useDismissLayer(pendingDelete != null, () => setPendingDelete(null));
  const sorted = [...boards].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <Shell title="تخته‌ها" helpId="boards" backTo="/">
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-3xl font-black">تخته‌های ذخیره‌شده</h1>
        <p className="mt-2 text-sm leading-7 text-muted">ذخیره خودکار است. فایل خروجی، خودِ نقطه‌ها و رابطه‌هاست.</p>
        <label className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-xl bg-navy px-4 text-sm font-bold text-paper">
          بازیابی فایل
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const doc = restoreBoard(text);
              if (!doc) return;
              doc.id = `board-${Date.now().toString(36)}`;
              doc.updatedAt = Date.now();
              openDoc(doc);
              void navigate({ to: "/board" });
            }}
          />
        </label>
        {!ready ? <p className="mt-6 text-sm text-muted">در حال خواندن…</p> : null}
        {ready && sorted.length === 0 ? <p className="mt-6 rounded-3xl bg-board p-4 text-sm">هنوز تخته‌ای نیست. از خانه یک تختهٔ تازه بسازید.</p> : null}
        <ul className="mt-4 space-y-3">
          {sorted.map((b) => (
            <li key={b.id} className="rounded-3xl border border-line bg-board p-4">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  aria-label="نام تخته"
                  value={b.name}
                  onChange={(e) => rename(b.id, e.target.value)}
                  className="h-10 min-w-40 flex-1 rounded-xl border border-line bg-paper px-2 font-bold"
                />
                <select
                  aria-label="پایه"
                  value={b.grade ?? ""}
                  onChange={(e) => rename(b.id, b.name, e.target.value === "" ? null : (Number(e.target.value) as 8 | 9))}
                  className="h-10 rounded-xl border border-line bg-paper px-2"
                >
                  <option value="">پایه</option>
                  <option value="8">هشتم</option>
                  <option value="9">نهم</option>
                </select>
              </div>
              <p className="mt-2 text-xs text-muted">
                {faNum(b.objects.length, 0)} شیء
                {b.lessonId ? ` · درس ${b.lessonId}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-10 rounded-xl bg-orange px-3 text-sm font-bold text-night"
                  onClick={() => {
                    setActive(b.id);
                    void navigate({ to: "/board" });
                  }}
                >
                  ادامه
                </button>
                <button type="button" className="h-10 rounded-xl bg-paper px-3 text-sm font-bold" onClick={() => duplicate(b.id)}>
                  کپی
                </button>
                <button type="button" className="h-10 rounded-xl bg-paper px-3 text-sm font-bold" onClick={() => download(b)}>
                  فایل قابل ویرایش
                </button>
                <button type="button" className="h-10 rounded-xl bg-paper px-3 text-sm font-bold text-orange" onClick={() => setPendingDelete(b.id)}>
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
        {pendingDelete ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/55 p-3 sm:items-center" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-3xl bg-board p-5">
              <h2 className="text-lg font-black">حذف دائمی این تخته؟</h2>
              <p className="mt-2 text-sm leading-7 text-muted">بعد از حذف، با برگرداندن برنمی‌گردد.</p>
              <div className="mt-4 flex gap-2">
                <button type="button" className="h-11 flex-1 rounded-xl bg-paper font-bold" onClick={closeDelete}>
                  انصراف
                </button>
                <button
                  type="button"
                  className="h-11 flex-1 rounded-xl bg-orange font-bold text-night"
                  onClick={() => {
                    remove(pendingDelete);
                    closeDelete();
                  }}
                >
                  حذف شود
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </Shell>
  );
}

function download(doc: BoardDoc) {
  const blob = new Blob([serializeBoard(doc)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${doc.name || "pargar"}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
