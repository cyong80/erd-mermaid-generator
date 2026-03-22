import React, { useEffect, useState } from "react";
import { Database, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RecentConnection } from "../../../shared/types";
const DB_LABEL: Record<string, string> = {
  mysql: "MySQL",
  postgres: "PostgreSQL",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}일 전`;
  if (h > 0) return `${h}시간 전`;
  if (m > 0) return `${m}분 전`;
  return "방금";
}

interface RecentConnectionsProps {
  onSelect: (conn: RecentConnection) => void;
}

export default function RecentConnections({
  onSelect,
}: RecentConnectionsProps) {
  const [list, setList] = useState<RecentConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api.getRecentConnections().then((r) => {
      setList(r);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = await window.api.deleteRecentConnection(id);
    setList(next);
  };

  const handleClearAll = async () => {
    await window.api.clearRecentConnections();
    setList([]);
  };

  if (loading) return null;
  if (list.length === 0)
    return (
      <div className="py-3 text-muted-foreground text-xs text-center">
        최근 연결 기록 없음
      </div>
    );

  return (
    <div className="mb-8 px-5 pt-5">
      <div className="flex items-center mb-3">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          최근 연결
        </span>
        <Button
          variant="outline"
          size="xs"
          onClick={handleClearAll}
          className="ml-auto h-6 px-1.5 text-[11px] bg-white dark:bg-transparent border-border"
        >
          전체 삭제
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {list.map((conn) => (
          <div
            key={conn.id}
            onClick={() => onSelect(conn)}
            className={cn(
              "flex items-center gap-3 p-2.5 px-3 rounded-xl cursor-pointer transition-all duration-200",
              "bg-white dark:bg-secondary/70 backdrop-blur-xl border border-border",
              "hover:bg-accent hover:border-border",
            )}
          >
            <Database className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground truncate">
                {conn.database}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {DB_LABEL[conn.dbType]} · {conn.host}:{conn.port} · {conn.user}
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              {timeAgo(conn.savedAt)}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e: React.MouseEvent<Element, MouseEvent>) =>
                handleDelete(e, conn.id)
              }
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="삭제"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
