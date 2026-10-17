import { Link, createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { useBoards } from "@/lib/store";
import { createBoard } from "@/lib/geometry/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const openDoc = useBoards((s) => s.openDoc);
  return (
    <Shell title="پرگار" helpId="home" backTo="exit">
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section>
          <p className="text-sm font-bold text-orange">پایهٔ هشتم و نهم · رسمی و تکمیلی</p>
          <h1 className="mt-2 max-w-xl text-4xl font-black leading-tight sm:text-5xl">هندسه را بکش، جابه‌جا کن، ببین چه می‌ماند.</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-muted">
            پرگار تختهٔ رسم برای چندضلعی، توازی، بردار، مثلث، دایره، اثبات و تشابه است. چهار ابزار اصلی، اندازه‌های واقعی، و درس‌هایی که عنوانشان از کتاب درسی آمده.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/board"
              className="inline-flex h-12 items-center rounded-2xl bg-orange px-5 font-black text-night"
              onClick={() => openDoc(createBoard({ name: "تختهٔ تازه" }))}
            >
              تختهٔ تازه
            </Link>
            <Link to="/lessons" className="inline-flex h-12 items-center rounded-2xl bg-navy px-5 font-bold text-paper">
              شروع از درس
            </Link>
          </div>
        </section>
        <HeroFigure />
        <nav className="grid gap-3 lg:col-span-2 sm:grid-cols-3" aria-label="بخش‌های اصلی">
          <Band to="/lessons" kicker="۰۸ / ۰۹" title="درس‌ها" text="فصل‌های هندسی کتاب، با هدف و تمرین." />
          <Band to="/formulas" kicker="رابطه" title="فرمول‌ها و اندازه‌ها" text="شرط درستی هر رابطه، کنار یک مثال." />
          <Band to="/boards" kicker="ذخیره" title="تخته‌های من" text="ادامه، کپی، خروجی و بازیابی." />
        </nav>
        <p className="lg:col-span-2">
          <Link to="/settings" className="text-sm font-bold text-blue">
            تنظیمات و نماد برنامه
          </Link>
        </p>
      </main>
    </Shell>
  );
}

function Band({ to, kicker, title, text }: { to: "/lessons" | "/formulas" | "/boards"; kicker: string; title: string; text: string }) {
  return (
    <Link to={to} className="block rounded-3xl border border-line bg-board p-4 transition hover:-translate-y-0.5">
      <span className="text-xs font-bold text-teal">{kicker}</span>
      <span className="mt-1 block text-lg font-black">{title}</span>
      <span className="mt-1 block text-sm leading-7 text-muted">{text}</span>
    </Link>
  );
}

function HeroFigure() {
  return (
    <svg viewBox="0 0 360 280" className="w-full rounded-3xl border border-line bg-board p-2" role="img" aria-label="مثلث ۳ ۴ ۵ با مربع روی ضلع‌ها">
      <rect width="360" height="280" fill="var(--board)" />
      <g stroke="var(--grid)" strokeWidth="1">
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`v${i}`} x1={20 + i * 28} y1={16} x2={20 + i * 28} y2={264} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1={16} y1={20 + i * 28} x2={344} y2={20 + i * 28} />
        ))}
      </g>
      <polygon points="70,200 210,200 70,90" fill="color-mix(in srgb, var(--blue) 16%, transparent)" stroke="var(--blue)" strokeWidth="3" />
      <rect x="70" y="200" width="48" height="48" fill="none" stroke="var(--orange)" strokeWidth="2" />
      <rect x="22" y="142" width="48" height="48" transform="rotate(-90 46 166)" fill="none" stroke="var(--teal)" strokeWidth="2" />
      <circle cx="70" cy="200" r="5" fill="var(--navy)" />
      <circle cx="210" cy="200" r="5" fill="var(--navy)" />
      <circle cx="70" cy="90" r="5" fill="var(--navy)" />
      <text x="130" y="222" fill="var(--muted)" fontSize="14" fontFamily="Vazirmatn, sans-serif">
        ۳
      </text>
      <text x="42" y="156" fill="var(--muted)" fontSize="14" fontFamily="Vazirmatn, sans-serif">
        ۴
      </text>
      <text x="150" y="140" fill="var(--ink)" fontSize="14" fontFamily="Vazirmatn, sans-serif">
        ۵
      </text>
    </svg>
  );
}
