import type { Lesson } from "../curriculum";
function L(p: Lesson): Lesson { return p; }
export const lesson_g8_pyth: Lesson = L({
  id: "g8-pyth", grade: 8, book: "official", chapter: "فصل ۶. فیثاغورس",
  title: "قضیهٔ فیثاغورس", page: "۸۸", pageNote: "فصل فیثاغورس.",
  tags: ["پایهٔ هشتم", "فیثاغورس"], goal: "در مثلث قائم‌الزاویه رابطهٔ a²+b²=c² را آزمایش کنی.",
  definitions: [{ term: "وتر", text: "ضلع روبه‌روی زاویهٔ قائمه؛ بلندترین ضلع." }],
  steps: ["مثلث قائم‌الزاویه بساز.", "طول اضلاع را بخوان.", "a²+b² و c² را مقایسه کن."],
  notes: ["فقط برای زاویهٔ قائمه این برابری برقرار است."],
  example: { prompt: "اضلاع ۳ و ۴؛ وتر؟", solution: "۵." },
  exercise: { prompt: "اگر وتر ۱۳ و یک ضلع ۵ باشد، ضلع دیگر؟", hint: "۱۳²−۵² را جذر بگیر.", answer: "۱۲" },
  tools: ["چندضلعی", "پاره‌خط"], activity: "اندازه‌گیری", concepts: ["فیثاغورس"],
});
