import type { Lesson } from "../curriculum";

function L(p: Lesson): Lesson { return p; }

export const lesson_g9_line: Lesson = L({
    id: "g9-line",
    grade: 9,
    book: "official",
    chapter: "فصل ۶. خط و معادله‌های خطی",
    title: "معادلهٔ خط",
    page: "شماره در PDF تأیید نشد",
    pageNote: "عنوان از فهرست رسمی. این درس رسم هندسی دارد.",
    tags: ["پایهٔ نهم", "کتاب رسمی"],
    goal: "یک خط را روی صفحهٔ مختصات بکشی و از دو نقطه‌اش شیب را بخوانی.",
    definitions: [{ term: "شیب", text: "تغییر عمودی تقسیم بر تغییر افقی بین دو نقطهٔ خط." }],
    steps: ["محورها روشن است.", "دو نقطه بگذار و خط را بکش.", "شیب را در پنل ببین."],
    notes: ["خط عمودی شیب عددی ندارد. برنامه در این حالت شیب را تعریف‌نشده می‌گوید."],
    example: {
      prompt: "خطی از (۰، ۱) و (۲، ۵). شیب؟",
      solution: "(۵ − ۱) / (۲ − ۰) = ۲.",
    },
    exercise: {
      prompt: "شیب خطی که از (۰، ۰) و (۴، ۲) می‌گذرد چقدر است؟",
      hint: "۲ تقسیم بر ۴.",
      answer: "۰٫۵",
    },
    tools: ["خط", "محورها", "نقطه"],
    activity: "رسم",
    concepts: ["شیب", "معادلهٔ خط"],
});
