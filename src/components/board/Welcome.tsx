import { BookOpen, DraftingCompass, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { faNum } from "@/lib/geometry/format";
import { LESSONS } from "@/lib/geometry/lessons";
import { useBoard } from "@/lib/geometry/store";

export function Welcome() {
  const startBlank = useBoard((s) => s.startBlank);
  const loadLesson = useBoard((s) => s.loadLesson);
  const objects = useBoard((s) => s.objects);
  const g8 = LESSONS.filter((l) => l.grade === 8);
  const g9 = LESSONS.filter((l) => l.grade === 9);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-auto bg-paper">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-10 sm:py-14">
        <header className="flex flex-col gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-fg">
            <DraftingCompass className="size-6" strokeWidth={1.6} />
          </div>
          <p className="text-sm font-medium text-accent">هندسهٔ تعاملی برای کلاس سمپاد</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">پرگار</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted">
            تخته‌ای برای تدریس هندسهٔ پایهٔ هشتم و نهم: خط و زاویه، مثلث و چهارضلعی، فیثاغورس،
            تبدیل‌ها، تالس و تشابه، و دایره. شکل آماده را باز کنید، رأس را بکشید تا ویژگی حفظ شود،
            یا روی تختهٔ خالی با پرگار و خط‌کش بسازید.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" onClick={startBlank}>
              <PenLine className="size-4" />
              تختهٔ خالی
            </Button>
            {objects.length > 0 ? (
              <Button type="button" variant="outline" onClick={() => useBoard.setState({ started: true })}>
                ادامهٔ تخته
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={() => loadLesson("g8-triangle-sum")}>
              <BookOpen className="size-4" />
              شروع با مجموع زاویه‌ها
            </Button>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-2">
          <GradeColumn grade={8} lessons={g8} onOpen={loadLesson} />
          <GradeColumn grade={9} lessons={g9} onOpen={loadLesson} />
        </section>
      </div>
    </div>
  );
}

function GradeColumn({ grade, lessons, onOpen }: { grade: 8 | 9; lessons: typeof LESSONS; onOpen: (id: string) => void }) {
  const chapters: string[] = [];
  for (const l of lessons) if (!chapters.includes(l.chapter)) chapters.push(l.chapter);
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-muted">پایهٔ {faNum(grade, 0)}</h2>
      <div className="flex flex-col gap-4">
        {chapters.map((ch) => (
          <div key={ch}>
            <p className="mb-1.5 text-xs font-medium text-subtle">{ch}</p>
            <ul className="flex flex-col gap-1.5">
              {lessons.filter((l) => l.chapter === ch).map((l) => (
                <li key={l.id}>
                  <button type="button" onClick={() => onOpen(l.id)} className="w-full rounded-xl bg-surface px-3 py-2.5 text-right shadow-[var(--shadow-border)] transition-[background-color,box-shadow] duration-[var(--motion-quick)] hover:bg-surface-2">
                    <span className="block text-sm font-medium">{l.title}</span>
                    <span className="block text-xs text-muted">{l.summary}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
