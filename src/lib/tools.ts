export type Group = "select" | "eraser" | "ruler" | "circle" | "transform";

export type Sub =
  | "point"
  | "pointOn"
  | "line"
  | "ray"
  | "segment"
  | "vector"
  | "polygon"
  | "regular"
  | "midpoint"
  | "parallel"
  | "perpendicular"
  | "perpBisector"
  | "bisector"
  | "intersection"
  | "angle"
  | "centerPoint"
  | "centerRadius"
  | "three"
  | "compass"
  | "arc"
  | "translate"
  | "rotate"
  | "reflect"
  | "pointSym"
  | "scale";

export const GROUPS: { id: Exclude<Group, "select">; label: string }[] = [
  { id: "eraser", label: "پاک‌کن" },
  { id: "ruler", label: "خط‌کش" },
  { id: "circle", label: "دایره" },
  { id: "transform", label: "تبدیل" },
];

export const SUBS: Record<Exclude<Group, "select">, { id: Sub; label: string }[]> = {
  eraser: [
    { id: "point", label: "حذف با لمس" },
  ],
  ruler: [
    { id: "point", label: "نقطه" },
    { id: "pointOn", label: "نقطه روی شکل" },
    { id: "line", label: "خط" },
    { id: "ray", label: "نیم‌خط" },
    { id: "segment", label: "پاره‌خط" },
    { id: "vector", label: "بردار" },
    { id: "polygon", label: "چندضلعی" },
    { id: "regular", label: "منتظم" },
    { id: "midpoint", label: "نقطهٔ وسط" },
    { id: "parallel", label: "موازی" },
    { id: "perpendicular", label: "عمود" },
    { id: "perpBisector", label: "عمودمنصف" },
    { id: "bisector", label: "نیمساز" },
    { id: "intersection", label: "تقاطع" },
    { id: "angle", label: "زاویه" },
  ],
  circle: [
    { id: "centerPoint", label: "مرکز و نقطه" },
    { id: "centerRadius", label: "مرکز و شعاع" },
    { id: "three", label: "سه نقطه" },
    { id: "compass", label: "پرگار" },
    { id: "arc", label: "کمان" },
  ],
  transform: [
    { id: "translate", label: "انتقال" },
    { id: "rotate", label: "دوران" },
    { id: "reflect", label: "تقارن" },
    { id: "pointSym", label: "تقارن مرکزی" },
    { id: "scale", label: "تجانس" },
  ],
};

export const HINTS: Record<Sub, string> = {
  point: "روی تخته بزنید تا نقطهٔ آزاد ساخته شود.",
  pointOn: "روی خط، پاره‌خط، نیم‌خط یا محیط دایره بزنید. نقطه به همان شکل وابسته می‌ماند.",
  line: "دو نقطه را انتخاب کنید. اگر جای خالی بزنید، همان‌جا نقطه ساخته می‌شود. خط از هر دو سو ادامه دارد.",
  ray: "اول مبدأ نیم‌خط، بعد نقطه‌ای در جهت آن. نیم‌خط فقط از مبدأ به آن سو می‌رود.",
  segment: "دو سر پاره‌خط را انتخاب کنید. پاره‌خط فقط بین همان دو نقطه است.",
  vector: "ابتدا و انتهای بردار را انتخاب کنید. مؤلفه‌ها در پنل ویژگی دیده می‌شود.",
  polygon: "رأس‌ها را به ترتیب بزنید. برای بستن، دوباره روی رأس اول بزنید یا دکمهٔ بستن را بزنید.",
  regular: "اول مرکز، بعد یک رأس. تعداد ضلع را از کنار ابزار تنظیم کنید.",
  midpoint: "یک پاره‌خط، یا دو نقطه را انتخاب کنید.",
  parallel: "اول یک خط، بعد نقطه‌ای که خط موازی باید از آن بگذرد.",
  perpendicular: "اول یک خط، بعد نقطه‌ای که عمود باید از آن بگذرد.",
  perpBisector: "یک پاره‌خط را انتخاب کنید، یا دو سر آن را بزنید.",
  bisector: "سه نقطه: ضلع، رأس، ضلع. یا یک زاویهٔ موجود را انتخاب کنید.",
  intersection: "دو خط یا خط و دایره یا دو دایره را انتخاب کنید.",
  angle: "سه نقطه را به ترتیب ضلع، رأس، ضلع انتخاب کنید.",
  centerPoint: "اول مرکز، بعد نقطه‌ای روی محیط. دایره دقیقاً از آن نقطه می‌گذرد.",
  centerRadius: "مرکز را انتخاب کنید و شعاع را وارد کنید.",
  three: "سه نقطهٔ غیرهم‌خط را انتخاب کنید.",
  compass: "اول پاره‌خطی که طولش منتقل می‌شود، بعد مرکز دایرهٔ جدید.",
  arc: "اول دایره، بعد دو نقطه. اگر روی محیط بزنید نقطه روی دایره می‌ماند.",
  translate: "شکل را انتخاب کنید. سپس دو نقطه برای بردار، یا از دکمهٔ مؤلفه‌ها استفاده کنید.",
  rotate: "شکل را انتخاب کنید، بعد مرکز دوران. زاویه را در پنجرهٔ بعد تعیین کنید.",
  reflect: "شکل را انتخاب کنید، بعد محور (یک خط) یا دو نقطه برای ساخت محور.",
  pointSym: "شکل را انتخاب کنید و سپس مرکز تقارن را بزنید. تصویر با دوران ۱۸۰ درجه ساخته می‌شود.",
  scale: "شکل را انتخاب کنید، بعد مرکز تجانس. ضریب را وارد کنید.",
};

export type Session = {
  group: Group;
  sub: Sub | null;
  pending: string[];
  hint: string;
  error: string | null;
  polyN: number;
  translateBy: "points" | "components";
  multi: boolean;
};

export const initialSession = (): Session => ({
  group: "select",
  sub: null,
  pending: [],
  hint: "برای جابه‌جایی، نقطه را بکشید. برای ابزار، یکی از چهار گروه را انتخاب کنید.",
  error: null,
  polyN: 6,
  translateBy: "points",
  multi: false,
});
