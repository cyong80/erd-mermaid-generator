import React from "react";
import { useErdStore } from "@/store/erdStore";

export default function CodePanel() {
  const mermaidCode = useErdStore((s) => s.mermaidCode);
  const setMermaidCode = useErdStore((s) => s.setMermaidCode);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 glass-panel rounded-none border-x-0 border-t-0 border-b border-border/60 text-[11px] text-muted-foreground font-mono flex items-center gap-2">
        <span className="text-primary font-semibold">erDiagram</span>
        <span>
          · Mermaid 코드 직접 편집 가능 · 수정하면 오른쪽 미리보기에
          실시간 반영됨
        </span>
      </div>
      <textarea
        value={mermaidCode}
        onChange={(e) => setMermaidCode(e.target.value)}
        spellCheck={false}
        className={[
          "flex-1 text-foreground font-mono text-sm leading-relaxed p-4 py-4 px-5",
          "border-none resize-none outline-none w-full",
          "bg-[oklch(0.16_0.03_250/0.3)] backdrop-blur-sm [tab-size:2]",
        ].join(" ")}
      />
    </div>
  );
}
