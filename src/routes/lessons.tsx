import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { LESSONS, NON_GEOMETRY, SOURCES, type BookKind } from "@/lib/curriculum";

export const Route = createFileRoute("/lessons")({ component: LessonsPage });

function LessonsPage() {
  const [grade, setGrade] = useState<"all" | 8 | 9>("all");
  const [book, setBook] = useState<"all" | BookKind>("all");
  const rows = useMemo(
    () => LESSONS.filter((l) => (grade === "all" || l.grade === grade) && (book === "all" || l.book === book)),
    [grade, book],
  );
  return (
    <Shell title="درس‌ها" helpId="lessons" backTo="/">
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-3xl font-black">درس‌های هندسه</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
          ترتیب و عنوان فصل‌ها عوض نشده است. فقط بخش‌هایی آمده‌اند که رسم، اندازه‌گیری، استدلال یا حجم می‌خواهند.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip on={grade === "all"} onClick={() => setGrade("all")}>هر دو پایه</Chip>
          <Chip on={grade === 8} onClick={() => setGrade(8)}>هشتم</Chip>
          <Chip on={grade === 9} onClick={() => setGrade(9)}>نهم</Chip>
          <Chip on={book === "all"} onClick={() => setBook("all")}>هر دو کتاب</Chip>
          <Chip on={book === "official"} onClick={() => setBook("official")}>رسمی</Chip>
          <Chip on={book === "supplementary"} onClick={() => setBook("supplementary")}>تکمیلی</Chip>
        </div>
        <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-board">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead className="bg-navy text-paper">
              <tr>
                <th className="px-3 py-3 font-bold">درس</th>
                <th className="px-3 py-3 font-bold">پایه</th>
                <th className="px-3 py-3 font-bold">کتاب</th>
                <th className="px-3 py-3 font-bold">صفحه</th>
                <th className="px-3 py-3 font-bold">فعالیت</th>
                <th className="px-3 py-3 font-bold">ابزار</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="px-3 py-3">
                    <Link to="/lessons/$lessonId" params={{ lessonId: l.id }} className="font-bold text-blue">
                      {l.title}
                    </Link>
                    <div className="text-xs text-muted">{l.chapter}</div>
                  </td>
                  <td className="px-3 py-3">{l.grade === 8 ? "هشتم" : "نهم"}</td>
                  <td className="px-3 py-3">{l.book === "official" ? "رسمی" : "تکمیلی"}</td>
                  <td className="px-3 py-3">{l.page}</td>
                  <td className="px-3 py-3">{l.activity}</td>
                  <td className="px-3 py-3 text-muted">{l.tools.join("، ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="mt-8">
          <h2 className="text-xl font-black">فصل‌هایی که ابزار هندسی ندارند</h2>
          <ul className="mt-3 space-y-2 text-sm leading-7">
            {NON_GEOMETRY.map((n) => (
              <li key={n.chapter + n.grade} className="rounded-2xl border border-line bg-board px-3 py-2">
                <b>{n.grade === 8 ? "هشتم" : "نهم"} · {n.book === "official" ? "رسمی" : "تکمیلی"} · {n.chapter}.</b> {n.reason}
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-black">منابع</h2>
          <ul className="mt-3 space-y-3 text-sm leading-7">
            {SOURCES.map((s) => (
              <li key={s.id} className="rounded-2xl border border-line bg-board p-3">
                <b>{s.title}</b>
                <p className="text-muted">{s.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </Shell>
  );
}

function Chip({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`h-10 rounded-full px-3 text-sm font-bold ${on ? "bg-navy text-paper" : "bg-board text-ink"}`}>
      {children}
    </button>
  );
}
