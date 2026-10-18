import type { Lesson } from "../curriculum";
function L(p: Lesson): Lesson { return p; }
export const lesson_g8_central: Lesson = L({
  id: "g8-central", grade: 8, book: "official", chapter: "فصل ۹. دایره",
  title: "زاویهٔ مرکزی", page: "۱۲۴", pageNote: "زاویه در مرکز دایره.",
  tags: ["پایهٔ هشتم", "دایره"], goal: "زاویهٔ مرکزی و کمان روبه‌رویش را مرتبط کنی.",
  definitions: [{ term: "زاویهٔ مرکزی", text: "زاویه‌ای که رأسش مرکز دایره است و اضلاعش از دو نقطه روی دایره می‌گذرند." }],
  steps: ["دایره و مرکز.", "دو شعاع بکش.", "زاویهٔ بینشان را اندازه بگیر."],
  notes: ["اندازهٔ زاویهٔ مرکزی با اندازهٔ کمان روبه‌رو برابر است."],
  example: { prompt: "زاویهٔ مرکزی ۹۰ درجه چه کمانی می‌سازد؟", solution: "کمان یک‌چهارم دایره." },
  exercise: { prompt: "زاویهٔ مرکزی ۶۰ درجه بساز.", hint: "از ابزار زاویه استفاده کن." },
  tools: ["دایره", "زاویه", "شعاع"], activity: "اندازه‌گیری", concepts: ["زاویهٔ مرکزی"],
});
