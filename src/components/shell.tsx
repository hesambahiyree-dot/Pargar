import { Link, useRouter } from "@tanstack/react-router";
import { ChevronRight, CircleHelp, Moon, Sun, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { dropLayer, pushLayer } from "@/lib/back-stack";
import { HELP } from "@/lib/help";
import type { PageId } from "@/lib/page-meta";
import { toggleTheme } from "@/lib/store";

export function useDismissLayer(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  const explicit = useRef(false);
  useEffect(() => {
    if (!open) return;
    explicit.current = false;
    const id = pushLayer(() => closeRef.current());
    return () => dropLayer(id, explicit.current);
  }, [open]);
  return () => {
    explicit.current = true;
    close();
  };
}

export function Shell({
  title,
  helpId,
  backTo,
  children,
}: {
  title: string;
  helpId: PageId;
  backTo: string | null | "exit";
  children: ReactNode;
}) {
  const router = useRouter();
  const [help, setHelp] = useState(false);
  const [exitAsk, setExitAsk] = useState(false);
  const [dark, setDark] = useState(false);
  const closeHelp = useDismissLayer(help, () => setHelp(false));
  const closeExit = useDismissLayer(exitAsk, () => setExitAsk(false));

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (backTo !== "exit") return;
    const id = pushLayer(() => setExitAsk(true));
    return () => dropLayer(id, false);
  }, [backTo, exitAsk]);

  function goBack() {
    if (help) {
      closeHelp();
      return;
    }
    if (exitAsk) {
      closeExit();
      return;
    }
    if (backTo === "exit") {
      setExitAsk(true);
      return;
    }
    if (backTo) {
      void router.navigate({ to: backTo });
      return;
    }
    if (window.history.length > 1) router.history.back();
    else void router.navigate({ to: "/" });
  }

  const doc = HELP[helpId];

  return (
    <div className="flex min-h-dvh flex-col text-ink" dir="rtl">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-white/10 bg-navy px-2 text-paper sm:px-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-paper hover:bg-white/10"
        >
          <ChevronRight className="size-5" aria-hidden />
          بازگشت
        </button>
        <Link to="/" className="mx-auto flex items-center rounded-lg bg-paper px-2 py-1" aria-label="پرگار، صفحهٔ اصلی">
          <img src="/logo-pargar.png" alt="" className="h-8 w-auto" />
        </Link>
        <p className="sr-only">{title}</p>
        <button
          type="button"
          aria-label="تغییر حالت روشن و تیره"
          onClick={() => setDark(toggleTheme() === "dark")}
          className="inline-flex size-11 items-center justify-center rounded-xl text-paper hover:bg-white/10"
        >
          {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
        <button
          type="button"
          onClick={() => setHelp(true)}
          className="inline-flex h-11 items-center gap-1 rounded-xl bg-orange px-3 text-sm font-bold text-night"
        >
          <CircleHelp className="size-5" aria-hidden />
          راهنما
        </button>
      </header>
      <div className="flex-1">{children}</div>
      {help ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/55 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <div className="max-h-[80dvh] w-full max-w-lg overflow-auto rounded-3xl bg-board p-5 text-ink shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 id="help-title" className="text-xl font-black">
                {doc.title}
              </h2>
              <button type="button" onClick={closeHelp} className="inline-flex size-11 items-center justify-center rounded-xl bg-paper" aria-label="بستن راهنما">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm leading-7 text-ink">
              {doc.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {exitAsk ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/55 p-3 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl bg-board p-5 text-ink shadow-2xl">
            <h2 className="text-xl font-black">خروج از پرگار</h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              تخته‌ها روی همین دستگاه ذخیره شده‌اند. با بستن زبانه چیزی از رسم‌ها پاک نمی‌شود. این پنجره فقط برنامه را ترک نمی‌کند؛ برای بستن، زبانه را ببندید.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={closeExit} className="h-11 flex-1 rounded-xl bg-navy font-bold text-paper">
                ماندم
              </button>
              <Link to="/boards" className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-paper font-bold text-ink" onClick={closeExit}>
                تخته‌ها
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
