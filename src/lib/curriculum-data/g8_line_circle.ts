import type { Lesson } from "../curriculum";
function L(p: Lesson): Lesson { return p; }
export const lesson_g8_line_circle: Lesson = L({
  id: "g8-line-circle", grade: 8, book: "official", chapter: "فصل ۹. دایره",
  title: "وضع خط و دایره", page: "۱۲۰", pageNote: "فصل دایره.",
  tags: ["پایهٔ هشتم", "دایره"], goal: "حالت‌های متقاطع، مماس و خارج بودن خط نسبت به دایره را ببینی.",
  definitions: [{ term: "مماس", text: "خطی که دایره را در دقیقاً یک نقطه قطع می‌کند." }],
  steps: ["دایره بکش.", "خطی نزدیک کن تا مماس شود.", "فاصلهٔ مرکز تا خط را با شعاع مقایسه کن."],
  notes: ["اگر فاصلهٔ مرکز تا خط برابر شعاع باشد، خط مماس است."],
  example: { prompt: "فاصلهٔ مرکز تا خط = شعاع؛ وضعیت؟", solution: "مماس." },
  exercise: { prompt: "یک مماس بر دایره رسم کن.", hint: "از نقطه روی دایره عمود بر شعاع." },
  tools: ["دایره", "خط", "عمود"], activity: "رسم", concepts: ["مماس"],
});
