import type { Lesson } from "../curriculum";
function L(p: Lesson): Lesson { return p; }
export const lesson_g8_unit: Lesson = L({
  id: "g8-unit", grade: 8, book: "official", chapter: "فصل ۵. بردار و مختصات",
  title: "بردار واحد", page: "۷۶", pageNote: "ادامهٔ فصل بردار.",
  tags: ["پایهٔ هشتم", "بردار"], goal: "بردار هم‌جهت با اندازهٔ ۱ را بشناسی.",
  definitions: [{ term: "بردار واحد", text: "برداری با اندازهٔ ۱ که جهت بردار اصلی را دارد." }],
  steps: ["یک بردار بکش.", "اندازه‌اش را در پنل بخوان.", "بردار واحد هم‌جهت را تصور کن."],
  notes: ["بردار واحد برای نشان‌دادن جهت بدون وابستگی به اندازه است."],
  example: { prompt: "اندازهٔ بردار واحد چند است؟", solution: "۱." },
  exercise: { prompt: "بردار واحد هم‌جهت با بردار داده‌شده را توضیح بده.", hint: "اندازه ۱، همان جهت." },
  tools: ["بردار"], activity: "بحث", concepts: ["بردار واحد"],
});
