import type { Lesson } from "../curriculum";
function L(p: Lesson): Lesson { return p; }
export const lesson_g8_cong_shape: Lesson = L({
  id: "g8-cong-shape", grade: 8, book: "official", chapter: "فصل ۶. فیثاغورس و هم‌نهشتی",
  title: "شکل‌های هم‌نهشت", page: "۹۴", pageNote: "هم‌نهشتی شکل‌ها.",
  tags: ["پایهٔ هشتم", "هم‌نهشتی"], goal: "دو شکل هم‌نهشت را با انطباق بشناسی.",
  definitions: [{ term: "هم‌نهشتی", text: "دو شکل که با انتقال، دوران یا بازتاب روی هم می‌افتند." }],
  steps: ["دو مثلث یکسان بساز.", "با انتقال یا دوران روی هم بینداز."],
  notes: ["اندازه و زاویه‌ها در هم‌نهشتی حفظ می‌شوند."],
  example: { prompt: "آیا همهٔ مربع‌های هم‌اندازه هم‌نهشت‌اند؟", solution: "بله." },
  exercise: { prompt: "دو مثلث هم‌نهشت بساز.", hint: "اضلاع متناظر برابر." },
  tools: ["چندضلعی", "انتقال"], activity: "رسم", concepts: ["هم‌نهشتی"],
});
