import { BookOpen, Download, DraftingCompass, Grid3x3, HelpCircle, Redo2, Trash2, Undo2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SHORTCUTS, TOOLS } from "@/lib/geometry/tools";
import { useBoard } from "@/lib/geometry/store";
import { GeometryCanvas } from "./GeometryCanvas";
import { SidePanel } from "./SidePanel";
import { Toolbar } from "./Toolbar";
import { Welcome } from "./Welcome";

function IconToggle({ pressed, label, onClick, children }: { pressed: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return <Tooltip><TooltipTrigger asChild><Button type="button" size="icon-sm" variant={pressed ? "secondary" : "ghost"} aria-label={label} aria-pressed={pressed} onClick={onClick}>{children}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}

export function AppShell() {
  const hydrated = useBoard((s) => s.hydrated), started = useBoard((s) => s.started), hydrate = useBoard((s) => s.hydrate), settings = useBoard((s) => s.settings), toggleSetting = useBoard((s) => s.toggleSetting), undo = useBoard((s) => s.undo), redo = useBoard((s) => s.redo), newBoard = useBoard((s) => s.newBoard), removeSelected = useBoard((s) => s.removeSelected), finishPending = useBoard((s) => s.finishPending), cancelPending = useBoard((s) => s.cancelPending), setTool = useBoard((s) => s.setTool), status = useBoard((s) => s.status), objects = useBoard((s) => s.objects);
  const [help, setHelp] = useState(false), [mobileLessons, setMobileLessons] = useState(false);
  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyZ") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyY") { e.preventDefault(); redo(); return; }
      if (e.code === "Escape") { cancelPending(); setTool("select"); return; }
      if (e.code === "Enter") { finishPending(); return; }
      if (e.code === "Delete" || e.code === "Backspace") { e.preventDefault(); removeSelected(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tool = SHORTCUTS[e.code]; if (tool) { e.preventDefault(); setTool(tool); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, cancelPending, setTool, finishPending, removeSelected]);
  const exportPng = () => { const canvas = document.querySelector("canvas"); if (!(canvas instanceof HTMLCanvasElement)) return; const a = document.createElement("a"); a.href = canvas.toDataURL("image/png"); a.download = "pargar.png"; a.click(); };
  if (!hydrated) return <div className="flex h-dvh items-center justify-center bg-paper text-ink"><div className="flex flex-col items-center gap-3"><span className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-fg"><DraftingCompass className="size-6" /></span><p className="text-sm text-muted">پرگار</p></div></div>;
  if (!started) return <TooltipProvider delayDuration={250}><Welcome /></TooltipProvider>;
  return <TooltipProvider delayDuration={250}>
    <div className="flex h-dvh flex-col overflow-hidden bg-paper text-ink">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-3">
        <button type="button" className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-surface-2" onClick={() => useBoard.setState({ started: false })}><span className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-fg"><DraftingCompass className="size-4" /></span><span className="hidden font-semibold sm:inline">پرگار</span></button>
        <div className="ms-auto flex items-center gap-0.5 overflow-x-auto">
          <IconToggle pressed={settings.grid} label="شبکه" onClick={() => toggleSetting("grid")}><Grid3x3 className="size-4" /></IconToggle>
          <IconToggle pressed={settings.axes} label="محورها" onClick={() => toggleSetting("axes")}><span className="text-xs font-semibold">xy</span></IconToggle>
          <IconToggle pressed={settings.snap} label="چسبیدن به شبکه" onClick={() => toggleSetting("snap")}><span className="text-xs font-medium">چسب</span></IconToggle>
          <IconToggle pressed={settings.labels} label="نام نقاط" onClick={() => toggleSetting("labels")}><span className="text-xs font-medium">نام</span></IconToggle>
          <IconToggle pressed={settings.measurements} label="اندازه‌ها روی تخته" onClick={() => toggleSetting("measurements")}><span className="text-xs font-medium">عدد</span></IconToggle>
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <Tooltip><TooltipTrigger asChild><Button type="button" size="icon-sm" variant="ghost" onClick={undo} aria-label="بازگردانی"><Undo2 className="size-4" /></Button></TooltipTrigger><TooltipContent>بازگردانی</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="icon-sm" variant="ghost" onClick={redo} aria-label="جلو"><Redo2 className="size-4" /></Button></TooltipTrigger><TooltipContent>انجام دوباره</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="icon-sm" variant="ghost" onClick={newBoard} aria-label="تخته تازه"><Trash2 className="size-4" /></Button></TooltipTrigger><TooltipContent>تختهٔ تازه</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="icon-sm" variant="ghost" onClick={exportPng} aria-label="دانلود تصویر"><Download className="size-4" /></Button></TooltipTrigger><TooltipContent>دانلود تصویر</TooltipContent></Tooltip>
          <Button type="button" size="icon-sm" variant="ghost" className="lg:hidden" onClick={() => setMobileLessons(true)} aria-label="درس‌ها"><BookOpen className="size-4" /></Button>
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => setHelp(true)} aria-label="راهنما"><HelpCircle className="size-4" /></Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1"><div className="flex min-w-0 flex-1 flex-col"><div className="border-b border-border bg-surface"><Toolbar /></div><div className="relative min-h-0 flex-1 bg-canvas"><GeometryCanvas /><div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-2 text-xs text-muted"><span>{status}</span><span className="tabular-nums">{faObjects(objects.length)}</span></div></div></div><SidePanel className="hidden w-80 shrink-0 border-s border-border lg:flex" /></div>
    </div>
    <Sheet open={mobileLessons} onOpenChange={setMobileLessons}><SheetContent side="bottom" className="h-[80dvh] p-0"><SheetHeader className="px-4 pt-4"><SheetTitle>درس‌ها و اندازه‌ها</SheetTitle></SheetHeader><div className="h-[calc(80dvh-3.5rem)]"><SidePanel className="h-full" /></div></SheetContent></Sheet>
    <Dialog open={help} onOpenChange={setHelp}><DialogContent><DialogHeader><DialogTitle>چطور تدریس کنیم؟</DialogTitle><DialogDescription>از درس‌های آماده شروع کنید، رأس را بکشید تا ویژگی حفظ شود، یا روی تختهٔ خالی شکل بسازید.</DialogDescription></DialogHeader><ul className="space-y-2 text-sm text-muted"><li>کشیدن نقطه با ابزار انتخاب · چرخ ماوس برای بزرگ‌نمایی · فاصله + کشیدن برای جابه‌جایی صفحه</li><li>برای عمود یا موازی، اول خط را بزنید بعد نقطه</li><li>زاویه با سه نقطه؛ دومی رأس زاویه است</li><li>پرگار: دو نقطه برای شعاع، سپس مرکز — یا اول یک پاره‌خط</li><li>چندضلعی را با کلیک روی رأس اول یا کلید Enter ببندید</li></ul><div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">{TOOLS.map((t) => <div key={t.id} className="flex justify-between gap-2"><span>{t.label}</span><span className="text-subtle">{t.shortcut}</span></div>)}</div></DialogContent></Dialog>
  </TooltipProvider>;
}
function faObjects(n: number) { if (n === 0) return "تخته خالی است"; return `${n} شیء`.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!); }
