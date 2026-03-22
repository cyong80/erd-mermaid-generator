import React from "react";
import { Database, ScanLine, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ERDPreview from "./ERDPreview";
import CodePanel from "./CodePanel";
import Toolbar from "./Toolbar";
import TableFilter from "./TableFilter";
import ObsidianPanel from "./ObsidianPanel";
import { useErdStore } from "../store/erdStore";

interface PreviewStepProps {
  onOpenConnectDialog: () => void;
}

export default function PreviewStep({ onOpenConnectDialog }: PreviewStepProps) {
  const mermaidCode = useErdStore((s) => s.mermaidCode);
  const schema = useErdStore((s) => s.schema);
  const activePanel = useErdStore((s) => s.activePanel);
  const loadMarkdown = useErdStore((s) => s.loadMarkdown);

  if (!mermaidCode) {
    return (
      <div className="flex flex-1 min-h-0 overflow-hidden items-center justify-center">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center border [border-color:var(--glass-border)]">
            <Database className="size-8 text-muted-foreground/70" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              ERD 시작하기
            </h2>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              DB에 연결하거나 저장된 마크다운 파일을 불러와 ERD를 표시합니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onOpenConnectDialog}
              variant="outline"
              className="h-11 px-6 gap-2 font-semibold rounded-xl border [border-color:var(--glass-border)]"
            >
              <ScanLine className="size-4" />
              DB 연결
            </Button>
            <Button
              onClick={loadMarkdown}
              variant="outline"
              className="h-11 px-6 gap-2 font-semibold rounded-xl border [border-color:var(--glass-border)]"
            >
              <FileUp className="size-4" />
              .md 불러오기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <Toolbar />
      <div className="flex-1 overflow-hidden flex">
        {activePanel === "filter" && schema && (
          <div className="w-52 flex-shrink-0 border-r border-border/60">
            <TableFilter />
          </div>
        )}

        <div className="flex-1 overflow-hidden flex">
          {activePanel === "preview" || activePanel === "filter" ? (
            <ERDPreview />
          ) : activePanel === "code" ? (
            <>
              <div className="w-1/2 min-w-0 flex flex-col border-r border-border/60">
                <CodePanel />
              </div>
              <div className="w-1/2 min-w-0 overflow-hidden">
                <ERDPreview />
              </div>
            </>
          ) : activePanel === "obsidian" ? (
            <ObsidianPanel />
          ) : null}
        </div>
      </div>
    </div>
  );
}
