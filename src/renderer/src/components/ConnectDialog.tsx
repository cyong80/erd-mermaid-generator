import React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConnectionForm from "./ConnectionForm";
import RecentConnections from "./RecentConnections";
import { useErdStore } from "@/store/erdStore";
import type { RecentConnection } from "../../../shared/types";

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ConnectDialog({
  open,
  onOpenChange,
}: ConnectDialogProps) {
  const scan = useErdStore((s) => s.scan);
  const reset = useErdStore((s) => s.reset);
  const loading = useErdStore((s) => s.loading);
  const error = useErdStore((s) => s.error);
  const setConnectDialogOpen = useErdStore((s) => s.setConnectDialogOpen);

  const handleSelectRecent = (conn: RecentConnection) => {
    window.__fillForm?.(conn);
    toast.success(`${conn.database} 연결 정보 불러옴`);
  };

  const handleScan = async (config: Parameters<typeof scan>[0]) => {
    const success = await scan(config);
    if (success) setConnectDialogOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto glass-panel-elevated border [border-color:var(--glass-border)]">
        <DialogHeader>
          <DialogTitle>DB 연결</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-0 -mx-1">
          <RecentConnections onSelect={handleSelectRecent} />
          <ConnectionForm
            onScan={handleScan}
            loading={loading}
            error={error}
            compact={false}
            showTitle={false}
            onReset={() => {
              reset();
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
