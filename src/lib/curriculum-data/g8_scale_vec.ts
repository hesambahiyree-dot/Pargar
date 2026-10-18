import type { Lesson } from "../curriculum";
function L(p: Lesson): Lesson { return p; }
export const lesson_g8_scale_vec: Lesson = L({
  id: "g8-scale-vec", grade: 8, book: "official", chapter: "فصل ۵. بردار و مختصات",
  title: "ضرب عدد در بردار", page: "۷۴", pageNote: "ادامهٔ فصل بردار.",
  tags: ["پایهٔ هشتم", "بردار"], goal: "اثر ضرب یک عدد در اندازه و جهت بردار را ببینی.",
  definitions: [{ term: "ضرب عدد در بردار", text: "اندازه در قدرمطلق عدد ضرب می‌شود؛ اگر عدد منفی باشد جهت عوض می‌شود." }],
  steps: ["یک بردار بساز.", "با مقیاس ۲ آن را بزرگ کن.", "با مقیاس ۱− جهت را برگردان."],
  notes: ["ضریب صفر بردار صفر می‌سازد."],
  example: { prompt: "اگر ضریب ۲ باشد اندازه چه می‌شود؟", solution: "دو برابر." },
  exercise: { prompt: "برداری با ضریب ۳− بساز.", hint: "از تجانس با ضریب منفی استفاده کن." },
  tools: ["بردار", "تجانس"], activity: "رسم", concepts: ["مقیاس بردار"],
});
