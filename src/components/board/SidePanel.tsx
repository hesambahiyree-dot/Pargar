import { BookOpen, ChevronLeft, ChevronRight, Ruler, Sigma } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { collectMeasures, constraintLabel, getPoint, kindLabel } from "@/lib/geometry/engine";
import { FORMULAS } from "@/lib/geometry/formulas";
import { faNum } from "@/lib/geometry/format";
import { LESSONS, getLesson } from "@/lib/geometry/lessons";
import { useBoard } from "@/lib/geometry/store";
import { cn } from "@/lib/utils";

type Tab = "lessons" | "measures" | "formulas";

export function SidePanel({ className }: { className?: string }) {
  const [tab, setTab] = useState<Tab>("lessons");
  const [grade, setGrade] = useState<8 | 9 | "all">("all");
  const lessonId = useBoard((s) => s.lessonId);
  const lessonStep = useBoard((s) => s.lessonStep);
  const objects = useBoard((s) => s.objects);
  const selected = useBoard((s) => s.selected);
  const loadLesson = useBoard((s) => s.loadLesson);
  const setLessonStep = useBoard((s) => s.setLessonStep);
  const toggleMeasure = useBoard((s) => s.toggleMeasure);
  const renameSelected = useBoard((s) => s.renameSelected);

  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const filtered = useMemo(() => (grade === "all" ? LESSONS : LESSONS.filter((l) => l.grade === grade)), [grade]);
  const measures = useMemo(() => collectMeasures(objects), [objects]);
  const angleSum = measures.filter((m) => m.kind === "angle").reduce((s, m) => s + m.value, 0);
  const selectedObj = objects.find((o) => o.id === selected[0]);
  const selectedPoint = selected[0] ? getPoint(objects, selected[0]) : null;
  const chapters: string[] = [];
  for (const l of filtered) if (!chapters.includes(l.chapter)) chapters.push(l.chapter);

  return (
    <aside className={cn("flex h-full min-h-0 flex-col bg-surface", className)}>
      <div className="flex gap-1 p-2">
        {([ ["lessons", BookOpen, "درس‌ها"], ["measures", Ruler, "اندازه‌ها"], ["formulas", Sigma, "فرمول"] ] as const).map(([id, Icon, label]) => (
          <Button key={id} type="button" size="sm" variant={tab === id ? "default" : "ghost"} className="flex-1" onClick={() => setTab(id)}>
            <Icon className="size-3.5" />{label}
          </Button>
        ))}
      </div>

      {tab === "lessons" ? (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-3 p-3 pt-0">
            {lesson ? (
              <div className="rounded-xl bg-paper p-3 shadow-[var(--shadow-border)]">
                <p className="text-xs text-muted">پایهٔ {faNum(lesson.grade, 0)} · {lesson.chapter}</p>
                <h2 className="mt-1 text-base font-semibold leading-snug">{lesson.title}</h2>
                <p className="mt-1.5 text-sm text-muted">{lesson.summary}</p>
                <ul className="mt-2 space-y-1 text-sm">{lesson.goals.map((g) => <li key={g} className="ps-3 text-ink/80">{g}</li>)}</ul>
                <div className="mt-3 rounded-lg bg-surface-2 p-3">
                  <p className="text-xs font-medium text-muted">گام {faNum(lessonStep + 1, 0)} از {faNum(lesson.steps.length, 0)}</p>
                  <p className="mt-1 font-medium">{lesson.steps[lessonStep]?.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{lesson.steps[lessonStep]?.body}</p>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" size="sm" variant="outline" disabled={lessonStep <= 0} onClick={() => setLessonStep(Math.max(0, lessonStep - 1))}><ChevronRight className="size-3.5" />قبلی</Button>
                    <Button type="button" size="sm" disabled={lessonStep >= lesson.steps.length - 1} onClick={() => setLessonStep(Math.min(lesson.steps.length - 1, lessonStep + 1))}>بعدی<ChevronLeft className="size-3.5" /></Button>
                  </div>
                </div>
              </div>
            ) : <p className="text-sm text-muted">یک درس را باز کنید تا شکل آماده و راهنمای تدریس بیاید.</p>}
            <div className="flex gap-1">
              {(["all", 8, 9] as const).map((g) => <Button key={String(g)} type="button" size="sm" variant={grade === g ? "secondary" : "ghost"} onClick={() => setGrade(g)}>{g === "all" ? "همه" : `پایه ${faNum(g, 0)}`}</Button>)}
            </div>
            {chapters.map((ch) => (
              <div key={ch} className="flex flex-col gap-1.5">
                <p className="px-1 text-xs font-medium text-subtle">{ch}</p>
                {filtered.filter((l) => l.chapter === ch).map((l) => (
                  <button key={l.id} type="button" onClick={() => loadLesson(l.id)} className={cn("rounded-xl px-3 py-2.5 text-right transition-colors duration-[var(--motion-quick)]", lessonId === l.id ? "bg-accent text-accent-fg" : "bg-paper hover:bg-surface-2")}>
                    <span className="block text-[11px] opacity-70">پایهٔ {faNum(l.grade, 0)}</span><span className="block text-sm font-medium">{l.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : null}

      {tab === "measures" ? (
        <ScrollArea className="min-h-0 flex-1"><div className="flex flex-col gap-2 p-3 pt-0">
          {selectedObj ? <div className="rounded-xl bg-paper p-3 shadow-[var(--shadow-border)]"><p className="text-xs text-muted">{kindLabel(selectedObj.kind)}</p>{selectedPoint ? <><label className="mt-2 block text-xs text-muted" htmlFor="pt-name">نام نقطه</label><Input id="pt-name" value={selectedPoint.name} onChange={(e) => renameSelected(e.target.value)} className="mt-1 h-9"/><p className="mt-2 text-sm tabular-nums">({faNum(selectedPoint.x, 2)}٬ {faNum(selectedPoint.y, 2)})</p><p className="mt-1 text-xs text-subtle">{constraintLabel(selectedPoint.constraint)}</p></> : <p className="mt-1 text-sm font-medium">{selectedObj.id}</p>}</div> : null}
          {measures.length === 0 ? <p className="text-sm text-muted">هنوز اندازه‌ای نیست. پاره‌خط، زاویه یا چندضلعی بکشید؛ عددها همین‌جا زنده به‌روز می‌شوند.</p> : measures.map((m) => <button key={m.id + m.kind} type="button" onClick={() => toggleMeasure(m.id)} className="flex items-baseline justify-between rounded-lg bg-paper px-3 py-2 text-right hover:bg-surface-2"><span className="text-sm text-muted">{m.label}</span><span className="font-medium tabular-nums">{faNum(m.value, m.kind === "angle" ? 0 : 1)}{m.kind === "angle" ? "°" : m.kind === "area" ? "²" : ""}</span></button>)}
          {angleSum > 0 ? <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">جمع زاویه‌های نمایش‌داده‌شده: <span className="font-semibold tabular-nums">{faNum(angleSum, 0)}°</span></p> : null}
          <p className="text-xs text-subtle">روی هر مورد بزنید تا برچسب روی تخته روشن یا خاموش شود.</p>
        </div></ScrollArea>
      ) : null}

      {tab === "formulas" ? <ScrollArea className="min-h-0 flex-1"><div className="flex flex-col gap-2 p-3 pt-0">{FORMULAS.map((f) => <div key={f.title} className="rounded-xl bg-paper p-3 shadow-[var(--shadow-border)]"><p className="text-xs text-subtle">{f.chapter}</p><p className="mt-0.5 text-sm font-medium">{f.title}</p><p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p></div>)}</div></ScrollArea> : null}
    </aside>
  );
}
