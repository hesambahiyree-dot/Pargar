import { create } from "zustand";
import { createBoard, type BoardDoc } from "./geometry/types.ts";
import { restoreBoard } from "./geometry/svg.ts";

const KEY = "pargar.boards.v1";

type State = {
  ready: boolean;
  boards: BoardDoc[];
  activeId: string | null;
  past: BoardDoc[];
  future: BoardDoc[];
  hydrate: () => void;
  active: () => BoardDoc | null;
  setActive: (id: string) => void;
  openDoc: (doc: BoardDoc) => void;
  commit: (doc: BoardDoc) => void;
  live: (doc: BoardDoc) => void;
  begin: () => void;
  undo: () => void;
  redo: () => void;
  rename: (id: string, name: string, grade?: BoardDoc["grade"]) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => string | null;
  clearAll: () => void;
};

function persist(boards: BoardDoc[], activeId: string | null) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ boards, activeId }));
  } catch {
    /* فضای دستگاه پر است؛ تخته در حافظه می‌ماند */
  }
}

function upsert(boards: BoardDoc[], doc: BoardDoc): BoardDoc[] {
  const i = boards.findIndex((b) => b.id === doc.id);
  if (i < 0) return [doc, ...boards];
  const next = boards.slice();
  next[i] = doc;
  return next;
}

export const useBoards = create<State>((set, get) => ({
  ready: false,
  boards: [],
  activeId: null,
  past: [],
  future: [],
  hydrate: () => {
    if (get().ready) return;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        set({ ready: true });
        return;
      }
      const data = JSON.parse(raw) as { boards?: unknown; activeId?: unknown };
      const boards = Array.isArray(data.boards)
        ? data.boards.map((item) => restoreBoard(JSON.stringify(item))).filter((b): b is BoardDoc => !!b)
        : [];
      const activeId = typeof data.activeId === "string" ? data.activeId : (boards[0]?.id ?? null);
      set({ ready: true, boards, activeId });
    } catch {
      set({ ready: true });
    }
  },
  active: () => {
    const { boards, activeId } = get();
    return boards.find((b) => b.id === activeId) ?? null;
  },
  setActive: (id) => {
    set({ activeId: id, past: [], future: [] });
    persist(get().boards, id);
  },
  openDoc: (doc) => {
    const boards = upsert(get().boards, doc);
    set({ boards, activeId: doc.id, past: [], future: [] });
    persist(boards, doc.id);
  },
  commit: (doc) => {
    const cur = get().active();
    const past = cur && cur.id === doc.id ? [...get().past, structuredClone(cur)].slice(-50) : get().past;
    const boards = upsert(get().boards, doc);
    set({ boards, activeId: doc.id, past, future: [] });
    persist(boards, doc.id);
  },
  live: (doc) => {
    const boards = upsert(get().boards, doc);
    set({ boards, activeId: doc.id });
    persist(boards, doc.id);
  },
  begin: () => {
    const cur = get().active();
    if (!cur) return;
    set({ past: [...get().past, structuredClone(cur)].slice(-50), future: [] });
  },
  undo: () => {
    const { past, future, active } = get();
    const cur = active();
    const prev = past[past.length - 1];
    if (!cur || !prev) return;
    const boards = upsert(get().boards, prev);
    set({ boards, past: past.slice(0, -1), future: [structuredClone(cur), ...future].slice(0, 50) });
    persist(boards, cur.id);
  },
  redo: () => {
    const { past, future, active } = get();
    const cur = active();
    const next = future[0];
    if (!cur || !next) return;
    const boards = upsert(get().boards, next);
    set({ boards, future: future.slice(1), past: [...past, structuredClone(cur)].slice(-50) });
    persist(boards, cur.id);
  },
  rename: (id, name, grade) => {
    const boards = get().boards.map((b) =>
      b.id === id ? { ...b, name, grade: grade === undefined ? b.grade : grade, updatedAt: Date.now() } : b,
    );
    set({ boards });
    persist(boards, get().activeId);
  },
  remove: (id) => {
    const boards = get().boards.filter((b) => b.id !== id);
    const activeId = get().activeId === id ? (boards[0]?.id ?? null) : get().activeId;
    set({ boards, activeId, past: [], future: [] });
    persist(boards, activeId);
  },
  duplicate: (id) => {
    const src = get().boards.find((b) => b.id === id);
    if (!src) return null;
    const copy = createBoard({
      ...structuredClone(src),
      id: undefined,
      name: `کپی ${src.name}`,
      updatedAt: Date.now(),
    });
    const boards = [copy, ...get().boards];
    set({ boards, activeId: copy.id, past: [], future: [] });
    persist(boards, copy.id);
    return copy.id;
  },
  clearAll: () => {
    set({ boards: [], activeId: null, past: [], future: [] });
    persist([], null);
  },
}));

export function readTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function toggleTheme(): "dark" | "light" {
  const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
  document.documentElement.classList.toggle("dark", next === "dark");
  localStorage.setItem("pargar-theme", next);
  return next;
}
