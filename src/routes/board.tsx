import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { BoardStudio } from "@/components/board-studio";
import { Shell } from "@/components/shell";
import { createBoard } from "@/lib/geometry/types";
import { useBoards } from "@/lib/store";

export const Route = createFileRoute("/board")({
  validateSearch: (search: Record<string, unknown>): { fresh?: "1" } =>
    search.fresh === "1" ? { fresh: "1" } : {},
  component: BoardPage,
});

function BoardPage() {
  const { fresh } = Route.useSearch();
  const ready = useBoards((s) => s.ready);
  const active = useBoards((s) => s.boards.find((b) => b.id === s.activeId) ?? null);
  const openDoc = useBoards((s) => s.openDoc);
  const navigate = useNavigate();
  const booted = useRef(false);

  useEffect(() => {
    if (!ready || booted.current) return;
    booted.current = true;
    const current = useBoards.getState().active();
    if (fresh === "1" || !current) {
      openDoc(createBoard({ name: "تختهٔ تازه" }));
    }
    if (fresh === "1") void navigate({ to: "/board", search: {}, replace: true });
  }, [fresh, navigate, openDoc, ready]);

  return (
    <Shell title={active?.name ?? "تخته"} helpId="board" backTo={null}>
      {!ready || !active ? <p className="p-6 text-sm text-muted">در حال باز کردن تخته…</p> : <BoardStudio />}
    </Shell>
  );
}
