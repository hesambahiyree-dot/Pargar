export type PageId = "home" | "lessons" | "lesson" | "board" | "formulas" | "boards" | "settings";

export type PageMeta = {
  id: PageId;
  path: string;
  title: string;
  /** null: برگشت با تاریخچه. "exit": هشدار خروج از خانه. */
  backTo: string | null | "exit";
  help: PageId;
};

export const PAGES: PageMeta[] = [
  { id: "home", path: "/", title: "پرگار", backTo: "exit", help: "home" },
  { id: "lessons", path: "/lessons", title: "درس‌ها", backTo: "/", help: "lessons" },
  { id: "lesson", path: "/lessons/$lessonId", title: "درس", backTo: "/lessons", help: "lesson" },
  { id: "board", path: "/board", title: "تخته", backTo: null, help: "board" },
  { id: "formulas", path: "/formulas", title: "فرمول‌ها و اندازه‌ها", backTo: "/", help: "formulas" },
  { id: "boards", path: "/boards", title: "تخته‌های ذخیره‌شده", backTo: "/", help: "boards" },
  { id: "settings", path: "/settings", title: "تنظیمات", backTo: "/", help: "settings" },
];

export function pageById(id: PageId): PageMeta {
  return PAGES.find((p) => p.id === id) ?? PAGES[0]!;
}
