import { useState, type ReactNode } from "react";
import { boardSvg } from "@/lib/geometry/svg";
import type { BoardDoc } from "@/lib/geometry/types";

export function IconBtn({ children, label, onClick, disabled }: { children: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-paper px-2 text-sm font-bold disabled:opacity-40">
      {children}
    </button>
  );
}

export function Toggle({ on, label, onClick, children }: { on: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`inline-flex h-10 items-center gap-1 rounded-xl px-2 text-sm font-bold ${on ? "bg-teal/20 text-ink" : "bg-paper text-muted"}`}>
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

export function NumberDialog({
  title,
  label,
  onClose,
  onOk,
  allowNegative,
}: {
  title: string;
  label: string;
  onClose: () => void;
  onOk: (n: number) => void;
  allowNegative?: boolean;
}) {
  const [value, setValue] = useState(allowNegative ? "2" : "2");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/55 p-3 sm:items-center" role="dialog" aria-modal="true">
      <form
        className="w-full max-w-md rounded-3xl bg-board p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(value.replace("٫", ".").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))));
          if (!Number.isFinite(n) || (!allowNegative && n <= 0)) return;
          onOk(n);
        }}
      >
        <h2 className="text-lg font-black">{title}</h2>
        <p className="mt-1 text-sm leading-7 text-muted">{label}</p>
        <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} className="mt-3 h-11 w-full rounded-xl border border-line bg-paper px-3" inputMode="decimal" />
        <div className="mt-4 flex gap-2">
          <button type="button" className="h-11 flex-1 rounded-xl bg-paper font-bold" onClick={onClose}>
            انصراف
          </button>
          <button type="submit" className="h-11 flex-1 rounded-xl bg-navy font-bold text-paper">
            ساخت
          </button>
        </div>
      </form>
    </div>
  );
}

export function RotateDialog({ onClose, onOk }: { onClose: () => void; onOk: (deg: number) => void }) {
  const [value, setValue] = useState("90");
  return (
    <NumberDialog title="زاویهٔ دوران" label="زاویه را به درجه وارد کنید." onClose={onClose} onOk={onOk} allowNegative />
  );
}

export function ComponentDialog({ onClose, onOk }: { onClose: () => void; onOk: (x: number, y: number) => void }) {
  const [dx, setDx] = useState("1");
  const [dy, setDy] = useState("0");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/55 p-3 sm:items-center" role="dialog" aria-modal="true">
      <form
        className="w-full max-w-md rounded-3xl bg-board p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const x = Number(dx);
          const y = Number(dy);
          if (!Number.isFinite(x) || !Number.isFinite(y)) return;
          onOk(x, y);
        }}
      >
        <h2 className="text-lg font-black">مؤلفه‌های انتقال</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-sm">
            Δx
            <input value={dx} onChange={(e) => setDx(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-paper px-3" />
          </label>
          <label className="text-sm">
            Δy
            <input value={dy} onChange={(e) => setDy(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-paper px-3" />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" className="h-11 flex-1 rounded-xl bg-paper font-bold" onClick={onClose}>
            انصراف
          </button>
          <button type="submit" className="h-11 flex-1 rounded-xl bg-navy font-bold text-paper">
            انتقال
          </button>
        </div>
      </form>
    </div>
  );
}

export function safe(name: string): string {
  return name.replace(/[^\w\u0600-\u06FF-]+/g, "-").slice(0, 40) || "pargar";
}

export function downloadText(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function exportPng(doc: BoardDoc) {
  const svg = boardSvg(doc, 1600, 1000);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("png"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1600, 1000);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!png) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(png);
  a.download = `${safe(doc.name)}.png`;
  a.click();
}
