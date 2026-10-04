import { TEMPLATES, TOOLS } from "@/lib/geometry/tools";
import { useBoard } from "@/lib/geometry/store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Shapes } from "lucide-react";
import { useState } from "react";

export function Toolbar() {
  const tool = useBoard((s) => s.tool);
  const setTool = useBoard((s) => s.setTool);
  const insertTemplate = useBoard((s) => s.insertTemplate);
  const [openTpl, setOpenTpl] = useState(false);
  let lastGroup = "";

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-2 py-2">
      {TOOLS.map((t) => {
        const showSep = t.group !== lastGroup;
        lastGroup = t.group;
        const Icon = t.icon;
        return (
          <span key={t.id} className="flex items-center gap-1">
            {showSep && t.id !== "select" ? (
              <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant={tool === t.id ? "default" : "ghost"}
                  aria-label={t.label}
                  aria-pressed={tool === t.id}
                  className={cn("size-10 shrink-0", tool === t.id && "shadow-[var(--shadow-border)]")}
                  onClick={() => setTool(t.id)}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="font-medium">{t.label}</span>
                <span className="mt-0.5 block text-[11px] opacity-80">
                  {t.hint}
                  {t.shortcut ? ` · ${t.shortcut}` : ""}
                </span>
              </TooltipContent>
            </Tooltip>
          </span>
        );
      })}
      <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
      <div className="relative shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant={openTpl ? "secondary" : "ghost"}
              aria-label="شکل آماده"
              className="size-10"
              onClick={() => setOpenTpl((v) => !v)}
            >
              <Shapes className="size-4" strokeWidth={1.75} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">شکل آماده برای تخته</TooltipContent>
        </Tooltip>
        {openTpl ? (
          <div className="absolute top-full z-20 mt-1 w-44 rounded-xl bg-surface p-1 shadow-[var(--shadow-border)]">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="w-full rounded-lg px-3 py-2 text-right text-sm hover:bg-surface-2"
                onClick={() => {
                  insertTemplate(t.id);
                  setOpenTpl(false);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
