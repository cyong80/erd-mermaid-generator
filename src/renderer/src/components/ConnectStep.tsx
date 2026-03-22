import React from "react";
import ConnectionForm from "./ConnectionForm";
import RecentConnections from "./RecentConnections";
import { cn } from "../lib/utils";
import { useErdStore } from "../store/erdStore";
import type { RecentConnection } from "../../../shared/types";

interface ConnectStepProps {
  onSelectRecent: (conn: RecentConnection) => void;
}

export default function ConnectStep({ onSelectRecent }: ConnectStepProps) {
  const scan = useErdStore((s) => s.scan);
  const reset = useErdStore((s) => s.reset);
  const loading = useErdStore((s) => s.loading);
  const error = useErdStore((s) => s.error);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div
        className={cn("flex flex-col min-h-0", "w-full min-w-0 p-8 py-8 px-6")}
      >
        <div
          className={cn(
            "flex flex-col flex-1 min-h-0 glass-panel rounded-none border-t-0",
            "max-w-[460px] w-full mx-auto my-4 rounded-2xl overflow-hidden",
          )}
        >
          <div className="flex-1 min-h-0 overflow-auto">
            <RecentConnections onSelect={onSelectRecent} />
            <ConnectionForm
              onScan={scan}
              loading={loading}
              error={error}
              compact={false}
              onReset={reset}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
