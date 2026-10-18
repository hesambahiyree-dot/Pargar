import type { Lesson } from "../curriculum";

function L(p: Lesson): Lesson { return p; }

export const lesson_g9_slope: Lesson = L({
    id: "g9-slope",
    grade: 9,
    book: "official",
    chapter: "فصل ۶. خط و معادله‌های خطی",
    title: "شیب خط و عرض از مبدأ",
    page: "شماره در PDF تأیید نشد",
    pageNote: "عنوان از فهرست رسمی.",
    tags: ["پایهٔ نهم", "کتاب رسمی"],
    goal: "عرض از مبدأ را نقطهٔ برخورد خط با محور عمودی ببینی.",
    definitions: [{ term: "عرض از مبدأ", text: "مقدار y وقتی x صفر است؛ محل قطع محور y." }],
    steps: ["خطی بکش که محور عمودی را قطع کند.", "نقطهٔ تقاطع خط با محور را، اگر ساختی، بخوان."],
    notes: ["دو خط با شیب برابر موازی‌اند و اگر عرض از مبدأ هم یکی باشد بر هم منطبق‌اند."],
    example: {
      prompt: "خط y = ۲x + ۳ محور y را کجا قطع می‌کند؟",
      solution: "در نقطهٔ (۰، ۳).",
    },
    exercise: {
      prompt: "عرض از مبدأ خطی که از (۰، −۲) می‌گذرد چقدر است؟",
      hint: "همان y در x = ۰.",
      answer: "−۲",
    },
    tools: ["خط", "تقاطع", "محورها"],
    activity: "رسم",
    concepts: ["عرض از مبدأ"],
});
