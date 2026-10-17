import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { FORMULA_GROUPS, FORMULAS } from "@/lib/formulas";
import { seedLesson } from "@/lib/seeds";
import { useBoards } from "@/lib/store";
import { createBoard } from "@/lib/geometry/types";

export const Route = createFileRoute("/formulas")({ component: FormulasPage });

function FormulasPage() {
  const openDoc = useBoards((s) => s.openDoc);
  const navigate = useNavigate();
  return (
    <Shell title="فرمول‌ها و اندازه‌ها" helpId="formulas" backTo="/">
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-3xl font-black">فرمول‌ها و اندازه‌ها</h1>
        <p className="mt-2 text-sm leading-7 text-muted">رابطه‌ها تألیفی و کوتاه‌اند. شرط هر فرمول را قبل از استفاده بخوانید. موردهای تکمیلی جدا مشخص شده‌اند.</p>
        {FORMULA_GROUPS.map((group) => (
          <section key={group} className="mt-8">
            <h2 className="text-xl font-black text-navy">{group}</h2>
            <div className="mt-3 space-y-3">
              {FORMULAS.filter((f) => f.group === group).map((f) => (
                <article key={f.id} className="rounded-3xl border border-line bg-board p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">{f.title}</h3>
                    {f.extra ? <span className="rounded-full bg-orange/20 px-2 py-0.5 text-xs font-bold">تکمیلی</span> : null}
                  </div>
                  <p className="mt-2 font-bold text-blue" dir="ltr">
                    {f.relation}
                  </p>
                  <p className="mt-2 text-sm leading-7">{f.symbols}</p>
                  <p className="text-sm leading-7 text-muted">شرط: {f.condition}</p>
                  <p className="text-sm leading-7">مثال: {f.example}</p>
                  <button
                    type="button"
                    className="mt-3 h-10 rounded-xl bg-navy px-3 text-sm font-bold text-paper"
                    onClick={() => {
                      openDoc(f.lessonId ? seedLesson(f.lessonId) : createBoard({ name: f.title }));
                      void navigate({ to: "/board" });
                    }}
                  >
                    تختهٔ نمونه
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
    </Shell>
  );
}
