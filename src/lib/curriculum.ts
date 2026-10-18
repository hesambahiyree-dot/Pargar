import { LESSONS_A } from "./curriculum-lessons-a";
import { LESSONS_B } from "./curriculum-lessons-b";

export type BookKind = "official" | "supplementary";

export type Lesson = {
  id: string;
  grade: 8 | 9;
  book: BookKind;
  chapter: string;
  title: string;
  page: string;
  pageNote: string;
  tags: string[];
  goal: string;
  definitions: { term: string; text: string }[];
  steps: string[];
  notes: string[];
  example: { prompt: string; solution: string };
  exercise: { prompt: string; hint: string; answer?: string };
  challenge?: string;
  tools: string[];
  activity: string;
  concepts: string[];
};

const src8 = "ریاضی هشتم، کد ۸۰۵، سال تحصیلی ۱۴۰۳–۱۴۰۴، پایگاه کتاب‌های درسی chap.sch.ir/books/12173";
const src9 = "ریاضی نهم، کد ۹۰۵، سال تحصیلی ۱۴۰۳–۱۴۰۴، پایگاه کتاب‌های درسی chap.sch.ir/books/12192";

export const LESSONS: Lesson[] = [...LESSONS_A, ...LESSONS_B];

export const NON_GEOMETRY: { grade: 8 | 9; book: BookKind; chapter: string; reason: string }[] = [
  { grade: 8, book: "official", chapter: "فصل ۱. عددهای صحیح و گویا", reason: "محاسبهٔ عددی است و ابزار رسم نمی‌خواهد." },
  { grade: 8, book: "official", chapter: "فصل ۲. عددهای اول", reason: "حساب است، نه رسم." },
  { grade: 8, book: "official", chapter: "فصل ۴. جبر و معادله", reason: "عبارت جبری است." },
  { grade: 8, book: "official", chapter: "فصل ۷. توان و جذر", reason: "محور اعداد کافی است و شکل هندسی تازه نمی‌سازد." },
  { grade: 8, book: "official", chapter: "فصل ۸. آمار و احتمال", reason: "داده و شانس است." },
  { grade: 9, book: "official", chapter: "فصل ۱. مجموعه‌ها", reason: "نمودار ون هندسهٔ اقلیدسی این برنامه نیست." },
  { grade: 9, book: "official", chapter: "فصل ۲. عددهای حقیقی", reason: "محور و تقریب است." },
  { grade: 9, book: "official", chapter: "فصل ۴. توان و ریشه", reason: "جبری است." },
  { grade: 9, book: "official", chapter: "فصل ۵. عبارت‌های جبری", reason: "اتحاد و نامعادله است." },
  { grade: 9, book: "official", chapter: "فصل ۶. دستگاه معادله‌های خطی", reason: "حل دستگاه عمدتاً جبری است؛ رسم خط در دو درس قبلی همین فصل آمده." },
  { grade: 9, book: "official", chapter: "فصل ۷. عبارت‌های گویا", reason: "جبری است." },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export const SOURCES: { id: string; title: string; detail: string }[] = [
  {
    id: "g8",
    title: "ریاضی هشتم — کتاب رسمی",
    detail: `${src8}. عنوان درس‌ها با فهرست محسن نجفی (۱۴۰۳–۱۴۰۴) یکی است.`,
  },
  {
    id: "g9",
    title: "ریاضی نهم — کتاب رسمی",
    detail: `${src9}. فصل ۳ و فصل ۸ طبق بودجه‌بندی رسمی.`,
  },
  {
    id: "s8",
    title: "ریاضیات تکمیلی هشتم — استعدادهای درخشان",
    detail: "کد ۸۲۳، سال تحصیلی ۱۴۰۵–۱۴۰۶.",
  },
  {
    id: "s9",
    title: "ریاضیات تکمیلی نهم — استعدادهای درخشان",
    detail: "کد ۹۲۳، سال تحصیلی ۱۴۰۵–۱۴۰۶.",
  },
];
