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

export const LESSONS: Lesson[] = [
  {
    id: "g8-ch1-point-line",
    grade: 8,
    book: "official",
    chapter: "فصل ۱ — آشنایی با هندسه",
    title: "نقطه، خط و صفحه",
    page: "۱–۸",
    pageNote: "کتاب درسی پایه هشتم",
    tags: ["مقدمات", "نقطه", "خط"],
    goal: "شناخت مفاهیم پایه نقطه، خط، نیم‌خط و پاره‌خط و تمایز آن‌ها.",
    definitions: [
      { term: "نقطه", text: "مکان بدون بُعد که با یک حرف نام‌گذاری می‌شود." },
      { term: "خط راست", text: "مجموعه‌ای بی‌نهایت از نقاط که در دو جهت امتداد دارد." },
      { term: "پاره‌خط", text: "بخشی از خط که دو سر مشخص دارد." },
      { term: "نیم‌خط", text: "خطی که از یک نقطه آغاز و در یک جهت امتداد می‌یابد." },
    ],
    steps: [
      "چند نقطه آزاد روی تخته بساز.",
      "با ابزار پاره‌خط دو نقطه را به هم وصل کن.",
      "با ابزار خط و نیم‌خط همان نقاط را امتداد بده و تفاوت را مشاهده کن.",
    ],
    notes: [
      "خط راست از دو نقطه یکتا عبور می‌کند.",
      "پاره‌خط طول دارد؛ خط راست طول ندارد.",
    ],
    example: {
      prompt: "اگر A و B دو نقطه باشند، چند خط راست از هر دو می‌گذرد؟",
      solution: "فقط یک خط راست یکتا از دو نقطهٔ متمایز می‌گذرد.",
    },
    exercise: {
      prompt: "سه نقطهٔ غیرهم‌خط بساز و همهٔ پاره‌خط‌های ممکن را رسم کن. چند پاره‌خط داری؟",
      hint: "هر جفت نقطه یک پاره‌خط می‌سازد.",
      answer: "۳ پاره‌خط",
    },
    tools: ["point", "segment", "line", "ray"],
    activity: "روی تخته نقطه، پاره‌خط، نیم‌خط و خط بساز و نام‌گذاری کن.",
    concepts: ["نقطه", "خط", "پاره‌خط", "نیم‌خط"],
  },
  {
    id: "g8-ch1-angle",
    grade: 8,
    book: "official",
    chapter: "فصل ۱ — آشنایی با هندسه",
    title: "زاویه و انواع آن",
    page: "۹–۱۶",
    pageNote: "کتاب درسی پایه هشتم",
    tags: ["زاویه", "اندازه‌گیری"],
    goal: "شناخت زاویه، رأس، اضلاع و دسته‌بندی زاویه‌ها (تند، قائم، منفرجه).",
    definitions: [
      { term: "زاویه", text: "شکلی که از دو نیم‌خط با مبدأ مشترک ساخته می‌شود." },
      { term: "زاویهٔ قائم", text: "زاویه‌ای با اندازهٔ ۹۰ درجه." },
    ],
    steps: [
      "سه نقطه بساز و با ابزار زاویه آن را علامت بزن.",
      "زاویه‌های تند، قائم و منفرجه بساز و اندازه بگیر.",
    ],
    notes: ["مجموع زاویه‌های مکمل ۱۸۰ درجه است."],
    example: {
      prompt: "اگر یک زاویه ۴۰ درجه باشد، مکمل آن چند درجه است؟",
      solution: "۱۸۰ − ۴۰ = ۱۴۰ درجه.",
    },
    exercise: {
      prompt: "یک زاویهٔ قائم و یک زاویهٔ تند روی تخته بساز.",
      hint: "از ابزار زاویه و بازرسی استفاده کن.",
    },
    tools: ["point", "ray", "angle", "segment"],
    activity: "انواع زاویه را رسم و اندازه‌گیری کن.",
    concepts: ["زاویه", "قائم", "مکمل"],
  },
  {
    id: "g8-ch2-triangle",
    grade: 8,
    book: "official",
    chapter: "فصل ۲ — مثلث",
    title: "انواع مثلث و مجموع زوایا",
    page: "۱۷–۳۰",
    pageNote: "کتاب درسی پایه هشتم",
    tags: ["مثلث", "زوایا"],
    goal: "شناخت مثلث از نظر اضلاع و زوایا و درک مجموع ۱۸۰ درجه.",
    definitions: [
      { term: "مثلث متساوی‌الاضلاع", text: "مثلثی با سه ضلع برابر." },
      { term: "مثلث قائم‌الزاویه", text: "مثلثی با یک زاویهٔ ۹۰ درجه." },
    ],
    steps: [
      "مثلث‌های مختلف با ابزار چندضلعی بساز.",
      "زاویه‌ها را اندازه بگیر و جمع بزن.",
    ],
    notes: ["مجموع زوایای داخلی هر مثلث ۱۸۰ درجه است."],
    example: {
      prompt: "در مثلثی دو زاویه ۴۰ و ۶۰ درجه است. زاویهٔ سوم؟",
      solution: "۱۸۰ − ۴۰ − ۶۰ = ۸۰ درجه.",
    },
    exercise: {
      prompt: "یک مثلث قائم‌الزاویه رسم کن و زوایا را بررسی کن.",
      hint: "از ابزار بازرسی استفاده کن.",
    },
    tools: ["polygon", "angle", "segment"],
    activity: "مثلث بساز و ویژگی‌های آن را با بازرسی ببین.",
    concepts: ["مثلث", "مجموع زوایا"],
  },
  {
    id: "g8-ch3-parallel",
    grade: 8,
    book: "official",
    chapter: "فصل ۳ — خطوط موازی",
    title: "خطوط موازی و عمود",
    page: "۳۱–۴۵",
    pageNote: "کتاب درسی پایه هشتم",
    tags: ["موازی", "عمود"],
    goal: "ساخت و تشخیص خطوط موازی و عمود با ابزارهای هندسی.",
    definitions: [
      { term: "خطوط موازی", text: "خطوطی که هرگز همدیگر را قطع نمی‌کنند." },
      { term: "خطوط عمود", text: "خطوطی که زاویهٔ ۹۰ درجه می‌سازند." },
    ],
    steps: [
      "یک خط بکش و از یک نقطه خط موازی بساز.",
      "از همان نقطه خط عمود بساز.",
    ],
    notes: ["از یک نقطه بیرون خط فقط یک موازی و یک عمود می‌توان رسم کرد."],
    example: {
      prompt: "چگونه مطمئن شویم دو خط موازی‌اند؟",
      solution: "اگر فاصله در چند نقطه یکسان باشد یا زاویه با قاطع برابر باشد.",
    },
    exercise: {
      prompt: "خطی رسم کن و موازی و عمود آن را از یک نقطه بساز.",
      hint: "ابزار موازی و عمود را به کار ببر.",
    },
    tools: ["line", "parallel", "perpendicular", "point"],
    activity: "خطوط موازی و عمود بساز و زاویه را بررسی کن.",
    concepts: ["موازی", "عمود"],
  },
  {
    id: "g9-ch1-congruent",
    grade: 9,
    book: "official",
    chapter: "فصل ۱ — هم‌نهشتی",
    title: "هم‌نهشتی مثلث‌ها",
    page: "۱–۲۰",
    pageNote: "کتاب درسی پایه نهم",
    tags: ["هم‌نهشتی", "مثلث"],
    goal: "آشنایی با حالت‌های هم‌نهشتی (ض‌ض‌ض، زض‌ز، …).",
    definitions: [
      { term: "هم‌نهشتی", text: "دو شکل که با انتقال، دوران یا بازتاب بر هم منطبق می‌شوند." },
    ],
    steps: [
      "دو مثلث با اضلاع برابر بساز.",
      "با ابزار مقایسه آن‌ها را بررسی کن.",
    ],
    notes: ["ض‌ض‌ض و زض‌ز از حالت‌های رایج هم‌نهشتی هستند."],
    example: {
      prompt: "اگر سه ضلع دو مثلث برابر باشند چه می‌گوییم؟",
      solution: "طبق حالت ض‌ض‌ض هم‌نهشت‌اند.",
    },
    exercise: {
      prompt: "دو مثلث با شرایط ض‌ض‌ض بساز و مقایسه کن.",
      hint: "طول اضلاع را یکسان بگیر.",
    },
    tools: ["polygon", "segment", "transform"],
    activity: "مثلث‌های هم‌نهشت بساز و تبدیل‌ها را امتحان کن.",
    concepts: ["هم‌نهشتی", "ض‌ض‌ض"],
  },
];

export const NON_GEOMETRY: { id: string; title: string; note: string }[] = [
  { id: "alg-8", title: "جبر پایه هشتم", note: "خارج از محدودهٔ این نسخهٔ هندسی." },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export const SOURCES = [
  { id: "official-8", label: "کتاب درسی پایه هشتم" },
  { id: "official-9", label: "کتاب درسی پایه نهم" },
];
