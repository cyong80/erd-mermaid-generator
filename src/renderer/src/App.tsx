import React from "react";
import { Hexagon } from "lucide-react";
import PreviewStep from "./components/PreviewStep";
import ConnectDialog from "./components/ConnectDialog";
import UpdateBanner from "./components/UpdateBanner";
import { Toaster } from "./components/ui/sonner";
import { Badge } from "./components/ui/badge";
import { cn } from "./lib/utils";
import { useErdStore } from "./store/erdStore";

export default function App() {
  const schema = useErdStore((s) => s.schema);
  const dbName = useErdStore((s) => s.dbName);
  const includedTables = useErdStore((s) => s.includedTables);
  const connectDialogOpen = useErdStore((s) => s.connectDialogOpen);
  const setConnectDialogOpen = useErdStore((s) => s.setConnectDialogOpen);


  const filteredCount = includedTables
    ? includedTables.length
    : (schema?.tables?.length ?? 0);

  return (
    <div className="flex flex-col h-screen">
      <div
        className={cn(
          "h-12 glass-panel flex items-center justify-center flex-shrink-0 select-none pr-4 rounded-none border-x-0 border-t-0 relative",
          window.api?.platform === "darwin" ? "pl-[72px]" : "pl-4",
        )}
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5">
          <Hexagon className="size-4 text-primary" />
          <span className="font-semibold text-sm text-foreground tracking-tight">
            ERD Generator
          </span>
          {dbName && (
            <>
              <span className="text-muted-foreground/80">·</span>
              <span className="text-muted-foreground text-xs">{dbName}</span>
              {schema && (
                <Badge
                  variant="secondary"
                  className="text-[11px] py-0.5 rounded-lg"
                >
                  {filteredCount}t · {schema.relations?.length}r
                  {includedTables && (
                    <span className="text-amber-500"> (필터됨)</span>
                  )}
                </Badge>
              )}
            </>
          )}
        </div>
      </div>

      <PreviewStep onOpenConnectDialog={() => setConnectDialogOpen(true)} />

      <ConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
      />

      <Toaster />
      <UpdateBanner />
    </div>
  );
}
