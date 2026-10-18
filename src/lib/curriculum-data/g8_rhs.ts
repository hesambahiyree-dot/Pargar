import type { Lesson } from "../curriculum";
function L(p: Lesson): Lesson { return p; }
export const lesson_g8_rhs: Lesson = L({
  id: "g8-rhs", grade: 8, book: "official", chapter: "فصل ۶. هم‌نهشتی مثلث‌ها",
  title: "حالت وتر و یک ضلع", page: "۹۸", pageNote: "حالت خاص مثلث قائم‌الزاویه.",
  tags: ["پایهٔ هشتم", "هم‌نهشتی"], goal: "در مثلث قائم‌الزاویه، وتر و یک ضلع برای هم‌نهشتی کافی است.",
  definitions: [{ term: "وتر و یک ضلع", text: "حالت هم‌نهشتی مثلث‌های قائم‌الزاویه با وتر و یک ضلع برابر." }],
  steps: ["دو مثلث قائم با وتر و یک ضلع برابر بساز.", "مقایسه کن."],
  notes: ["فقط برای قائم‌الزاویه این حالت جدا نوشته می‌شود."],
  example: { prompt: "وتر ۵ و یک ضلع ۳؛ ضلع دیگر؟", solution: "۴." },
  exercise: { prompt: "دو مثلث قائم با وتر برابر بساز.", hint: "از فیثاغورس کمک بگیر." },
  tools: ["چندضلعی", "عمود"], activity: "رسم", concepts: ["وتر و ضلع"],
});
