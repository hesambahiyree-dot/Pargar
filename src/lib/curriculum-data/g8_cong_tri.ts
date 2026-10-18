import type { Lesson } from "../curriculum";
function L(p: Lesson): Lesson { return p; }
export const lesson_g8_cong_tri: Lesson = L({
  id: "g8-cong-tri", grade: 8, book: "official", chapter: "فصل ۶. هم‌نهشتی مثلث‌ها",
  title: "هم‌نهشتی مثلث‌ها", page: "۹۶", pageNote: "حالت‌های هم‌نهشتی مثلث.",
  tags: ["پایهٔ هشتم", "هم‌نهشتی"], goal: "حالت ض‌ض‌ض را روی مثلث آزمایش کنی.",
  definitions: [{ term: "ض‌ض‌ض", text: "سه ضلع یک مثلث با سه ضلع مثلث دیگر برابر باشند." }],
  steps: ["دو مثلث با اضلاع برابر بساز.", "بررسی کن آیا منطبق می‌شوند."],
  notes: ["ض‌ض‌ض برای هم‌نهشتی مثلث کافی است."],
  example: { prompt: "مثلث‌های ۳-۴-۵ و ۳-۴-۵؟", solution: "هم‌نهشت‌اند." },
  exercise: { prompt: "دو مثلث با ض‌ض‌ض بساز.", hint: "طول اضلاع را یکی بگیر." },
  tools: ["چندضلعی"], activity: "رسم", concepts: ["ض‌ض‌ض"],
});
