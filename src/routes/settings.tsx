import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, useDismissLayer } from "@/components/shell";
import { toggleTheme } from "@/lib/store";
import { useBoards } from "@/lib/store";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  const [ask, setAsk] = useState(false);
  const clearAll = useBoards((s) => s.clearAll);
  const close = useDismissLayer(ask, () => setAsk(false));
  return (
    <Shell title="تنظیمات" helpId="settings" backTo="/">
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-3xl font-black">تنظیمات</h1>
        <section className="mt-6 rounded-3xl border border-line bg-board p-4">
          <h2 className="font-black">ظاهر</h2>
          <button
            type="button"
            className="mt-3 h-11 rounded-xl bg-navy px-4 font-bold text-paper"
            onClick={() => setDark(toggleTheme() === "dark")}
          >
            {dark ? "حالت روشن" : "حالت تیره"}
          </button>
        </section>
        <section className="mt-4 rounded-3xl border border-line bg-board p-4">
          <h2 className="font-black">نماد برنامه</h2>
          <p className="mt-2 text-sm leading-7 text-muted">نشان پرگار بدون طراحی دوباره استفاده شده. اندازه‌های اندروید و فایل ویندوز از همان تصویر ساخته شده‌اند.</p>
          <img src="/logo-pargar.png" alt="نماد پرگار" className="mt-3 h-20 w-auto rounded-xl bg-paper p-2" />
          <ul className="mt-3 space-y-1 text-sm text-blue">
            <li><a href="/icons/android/mipmap-xxxhdpi.png">اندروید ۱۹۲</a></li>
            <li><a href="/icons/android/mipmap-xxhdpi.png">اندروید ۱۴۴</a></li>
            <li><a href="/icons/android/mipmap-xhdpi.png">اندروید ۹۶</a></li>
            <li><a href="/icons/android/mipmap-hdpi.png">اندروید ۷۲</a></li>
            <li><a href="/icons/android/mipmap-mdpi.png">اندروید ۴۸</a></li>
            <li><a href="/icons/windows/pargar.ico">ویندوز ico</a></li>
          </ul>
        </section>
        <section className="mt-4 rounded-3xl border border-line bg-board p-4">
          <h2 className="font-black">پاک کردن همهٔ تخته‌ها</h2>
          <button type="button" className="h-11 rounded-xl bg-orange px-4 font-bold text-night" onClick={() => setAsk(true)}>
            حذف دائمی
          </button>
        </section>
        {ask ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/55 p-3 sm:items-center" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-3xl bg-board p-5">
              <h2 className="text-lg font-black">همهٔ تخته‌ها پاک شوند؟</h2>
              <div className="mt-4 flex gap-2">
                <button type="button" className="h-11 flex-1 rounded-xl bg-paper font-bold" onClick={close}>
                  انصراف
                </button>
                <button
                  type="button"
                  className="h-11 flex-1 rounded-xl bg-orange font-bold text-night"
                  onClick={() => {
                    clearAll();
                    close();
                  }}
                >
                  پاک شود
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </Shell>
  );
}
