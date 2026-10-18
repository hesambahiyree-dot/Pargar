import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { SolidView } from "@/components/solid-view";
import { answerMatches } from "@/lib/answer";
import { lessonById } from "@/lib/curriculum";
import { seedLesson } from "@/lib/seeds";
import { useBoards } from "@/lib/store";

export const Route = createFileRoute("/lessons/$lessonId")({ component: LessonPage });

function LessonPage() {
  const { lessonId } = Route.useParams();
  const lesson = lessonById(lessonId);
  const navigate = useNavigate();
  const openDoc = useBoards((s) => s.openDoc);
  const [answer, setAnswer] = useState("");
  const [verdict, setVerdict] = useState<string | null>(null);
  if (!lesson) {
    return (
      <Shell title="درس" helpId="lesson" backTo="/lessons">
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p>این درس در فهرست تأییدشده نیست.</p>
          <Link to="/lessons" className="mt-4 inline-flex h-11 items-center font-bold text-blue">
            بازگشت به فهرست درس‌ها
          </Link>
        </main>
      </Shell>
    );
  }
  const solid =
    lesson.id === "g9-sphere"
      ? "sphere"
      : lesson.id === "g9-cone"
        ? "cone"
        : lesson.id === "g9-solid"
          ? "cylinder"
          : lesson.id === "s9-poly"
            ? "cube"
            : null;
  return (
    <Shell title={lesson.title} helpId="lesson" backTo="/lessons">
      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-sm text-muted">{lesson.chapter}</p>
        <h1 className="mt-1 text-3xl font-black">{lesson.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {lesson.tags.map((t) => (
            <span key={t} className="rounded-full bg-navy px-3 py-1 text-xs font-bold text-paper">
              {t}
            </span>
          ))}
          <span className="rounded-full bg-orange/20 px-3 py-1 text-xs font-bold">صفحهٔ {lesson.page}</span>
        </div>
        <p className="mt-3 text-sm leading-7 text-muted">{lesson.pageNote}</p>
        <section className="mt-6">
          <h2 className="text-lg font-black">هدف</h2>
          <p className="mt-1 leading-8">{lesson.goal}</p>
        </section>
        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-black">تعریف‌ها</h2>
          {lesson.definitions.map((d) => (
            <p key={d.term} className="rounded-2xl border border-line bg-board p-3 leading-8">
              <b>{d.term}. </b>
              {d.text}
            </p>
          ))}
        </section>
        {solid ? (
          <section className="mt-6">
            <h2 className="mb-2 text-lg font-black">مدل</h2>
            <SolidView kind={solid} />
            {lesson.id === "g9-cone" ? (
              <div className="mt-3">
                <h3 className="mb-2 text-sm font-bold">هرم با قاعدهٔ مربع</h3>
                <SolidView kind="pyramid" />
              </div>
            ) : null}
            {lesson.id === "s9-poly" ? (
              <div className="mt-3">
                <h3 className="mb-2 text-sm font-bold">هرم مربع‌القاعده برای شمردن رأس و وجه</h3>
                <SolidView kind="pyramid" />
              </div>
            ) : null}
          </section>
        ) : null}
        <section className="mt-6">
          <h2 className="text-lg font-black">گام‌ها</h2>
          <ol className="mt-2 list-decimal space-y-2 pr-5 leading-8">
            {lesson.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <button
            type="button"
            className="mt-4 h-12 rounded-2xl bg-orange px-5 font-black text-night"
            onClick={() => {
              openDoc(seedLesson(lesson.id));
              void navigate({ to: "/board" });
            }}
          >
            تختهٔ این درس
          </button>
        </section>
        <section className="mt-6">
          <h2 className="text-lg font-black">نکته‌ها</h2>
          <ul className="mt-2 space-y-2 leading-8">
            {lesson.notes.map((n) => (
              <li key={n} className="border-r-4 border-teal pr-3">
                {n}
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-6 rounded-3xl bg-navy p-4 text-paper">
          <h2 className="text-lg font-black">مثال</h2>
          <p className="mt-2 leading-8">{lesson.example.prompt}</p>
          <p className="mt-2 leading-8 text-orange">{lesson.example.solution}</p>
        </section>
        <section className="mt-6">
          <h2 className="text-lg font-black">تمرین</h2>
          <p className="mt-1 leading-8">{lesson.exercise.prompt}</p>
          <p className="text-sm text-muted">راهنما: {lesson.exercise.hint}</p>
          {lesson.exercise.answer ? (
            <form
              className="mt-3 flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setVerdict(answerMatches(answer, lesson.exercise.answer!) ? "درست است." : "هنوز نه. راهنما را دوباره بخوان.");
              }}
            >
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="h-11 min-w-40 flex-1 rounded-xl border border-line bg-board px-3" aria-label="پاسخ تمرین" />
              <button type="submit" className="h-11 rounded-xl bg-navy px-4 font-bold text-paper">
                بررسی
              </button>
            </form>
          ) : (
            <p className="mt-2 text-sm">این تمرین را روی تخته بررسی کن.</p>
          )}
          {verdict ? <p className="mt-2 font-bold text-blue">{verdict}</p> : null}
        </section>
        {lesson.challenge ? (
          <section className="mt-6 rounded-3xl border border-orange bg-orange/10 p-4">
            <h2 className="font-black">سؤال ترکیبی</h2>
            <p className="mt-2 leading-8">{lesson.challenge}</p>
          </section>
        ) : null}
        <Link to="/lessons" className="mt-8 inline-flex h-11 items-center font-bold text-blue">
          بازگشت به فهرست درس‌ها
        </Link>
      </main>
    </Shell>
  );
}
