import type { Lesson } from "../curriculum";
function L(p: Lesson): Lesson { return p; }
export const lesson_g8_inscribed: Lesson = L({
  id: "g8-inscribed", grade: 8, book: "official", chapter: "فصل ۹. دایره",
  title: "زاویهٔ محاطی", page: "۱۲۶", pageNote: "زاویه روی محیط دایره.",
  tags: ["پایهٔ هشتم", "دایره"], goal: "ببینی زاویهٔ محاطی نصف زاویهٔ مرکزی روبه‌روی همان کمان است.",
  definitions: [{ term: "زاویهٔ محاطی", text: "زاویه‌ای که رأسش روی دایره است و اضلاعش وترند." }],
  steps: ["دایره بکش.", "یک زاویهٔ مرکزی و یک محاطی روی یک کمان بساز.", "اندازه‌ها را مقایسه کن."],
  notes: ["زاویهٔ محاطی روبه‌روی قطر، قائمه است."],
  example: { prompt: "مرکزی ۸۰ درجه؛ محاطی همان کمان؟", solution: "۴۰ درجه." },
  exercise: { prompt: "زاویهٔ محاطی روبه‌روی قطر را بساز.", hint: "باید ۹۰ درجه باشد." },
  tools: ["دایره", "زاویه"], activity: "اندازه‌گیری", concepts: ["زاویهٔ محاطی"],
});
