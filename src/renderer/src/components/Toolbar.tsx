import React from "react";
import {
  LayoutGrid,
  Filter,
  Braces,
  BookOpen,
  FileDown,
  FileUp,
  Copy,
  Image,
  Download,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useErdStore } from "@/store/erdStore";

type Panel = "preview" | "filter" | "code" | "obsidian";

interface BtnProps {
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  title?: string;
}

const DB_LABEL: Record<string, string> = {
  mysql: "MySQL",
  postgres: "PostgreSQL",
};

export default function Toolbar() {
  const schema = useErdStore((s) => s.schema);
  const activePanel = useErdStore((s) => s.activePanel);
  const setActivePanel = useErdStore((s) => s.setActivePanel);
  const saveMarkdown = useErdStore((s) => s.saveMarkdown);
  const loadMarkdown = useErdStore((s) => s.loadMarkdown);
  const copyClipboard = useErdStore((s) => s.copyClipboard);
  const exportImage = useErdStore((s) => s.exportImage);
  const setConnectDialogOpen = useErdStore((s) => s.setConnectDialogOpen);
  const dbType = useErdStore((s) => s.dbType);
  const dbHost = useErdStore((s) => s.dbHost);
  const dbPort = useErdStore((s) => s.dbPort);

  const Btn = ({ onClick, children, active, title }: BtnProps) => (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      title={title}
      className={cn(
        "h-8 px-2.5 text-xs font-medium rounded-xl transition-all",
        active &&
          "bg-[oklch(0.35_0.06_250/0.5)] backdrop-blur-xl border [border-color:var(--glass-border)]",
      )}
    >
      {children}
    </Button>
  );

  const connectionLabel = dbHost
    ? `${DB_LABEL[dbType] ?? dbType} · ${dbHost}:${dbPort}`
    : null;

  return (
    <div className="h-10 glass-panel rounded-none border-x-0 border-t-0 flex items-center px-2.5 gap-1 flex-shrink-0 w-full">
      <Btn
        active={activePanel === "preview"}
        onClick={() => setActivePanel("preview")}
      >
        <LayoutGrid className="size-3.5" /> 미리보기
      </Btn>
      {schema && (
        <Btn active={activePanel === "filter"} onClick={() => setActivePanel("filter")}>
          <Filter className="size-3.5" /> 필터
        </Btn>
      )}
      <Btn active={activePanel === "code"} onClick={() => setActivePanel("code")}>
        <Braces className="size-3.5" /> 코드
      </Btn>
      <Btn
        active={activePanel === "obsidian"}
        onClick={() => setActivePanel("obsidian")}
      >
        <BookOpen className="size-3.5" /> Obsidian
      </Btn>

      <Separator orientation="vertical" className="h-4 mx-0.5" />

      <div className="flex-1" />

      {connectionLabel && (
        <>
          <span
            className="text-[11px] text-muted-foreground px-2 truncate max-w-[160px]"
            title={connectionLabel}
          >
            {connectionLabel}
          </span>
          <Btn
            onClick={() => setConnectDialogOpen(true)}
            title="다른 DB에 연결"
          >
            <Plug className="size-3.5" /> 재연결
          </Btn>
          <Separator orientation="vertical" className="h-4 mx-0.5" />
        </>
      )}

      <Btn onClick={loadMarkdown} title=".md 파일 불러오기">
        <FileUp className="size-3.5" /> 열기
      </Btn>
      <Btn onClick={saveMarkdown} title=".md 파일 저장">
        <FileDown className="size-3.5" /> 저장
      </Btn>
      <Btn onClick={copyClipboard} title="Mermaid 코드 클립보드 복사">
        <Copy className="size-3.5" /> 복사
      </Btn>
      <Btn onClick={() => exportImage("svg")} title="SVG 내보내기">
        <Download className="size-3.5" /> SVG
      </Btn>
      <Btn onClick={() => exportImage("png")} title="PNG 내보내기">
        <Image className="size-3.5" /> PNG
      </Btn>
    </div>
  );
}
