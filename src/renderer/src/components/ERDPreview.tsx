import React, { useEffect, useRef, useState } from "react";
import { Plus, Minus, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useErdStore } from "@/store/erdStore";

export default function ERDPreview() {
  const mermaidCode = useErdStore((s) => s.mermaidCode);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isPanning, setPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    if (!mermaidCode) return;
    setRenderError("");

    let cancelled = false;
    const render = async () => {
      if (!window.mermaid) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script");
          s.src =
            "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
          s.onload = () => res();
          s.onerror = rej;
          document.head.appendChild(s);
        });
      }

      window.mermaid!.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          darkMode: true,
          background: "transparent",
          primaryColor: "#1e293b",
          primaryBorderColor: "#475569",
          primaryTextColor: "#e2e8f0",
          lineColor: "#64748b",
          secondaryColor: "#0f172a",
          tertiaryColor: "#1e293b",
          edgeLabelBackground: "#1e293b",
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: "12px",
        },
        er: {
          diagramPadding: 30,
          layoutDirection: "TB",
          minEntityWidth: 100,
          minEntityHeight: 75,
          entityPadding: 15,
          useMaxWidth: false,
        },
      });

      try {
        const id = "erd-" + Date.now();
        const { svg } = await window.mermaid!.render(id, mermaidCode);
        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "none";
            svgEl.style.height = "auto";
          }
          setRenderError("");
        }
      } catch (e) {
        if (!cancelled) setRenderError((e as Error).message);
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [mermaidCode]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(Math.max(s * delta, 0.2), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setPanning(true);
    panStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !panStart.current) return;
    setPos({
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    });
  };

  const handleMouseUp = () => setPanning(false);

  const resetView = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  };

  return (
    <div
      className={cn(
        "w-full h-full overflow-hidden relative",
        "glass-panel rounded-none border-0",
        isPanning ? "cursor-grabbing" : "cursor-grab",
      )}
      style={{
        backgroundImage: `
          radial-gradient(oklch(0.3 0.04 250 / 0.4) 1px, transparent 1px),
          radial-gradient(ellipse 100% 100% at 50% 50%, oklch(0.2 0.03 250 / 0.2), transparent)
        `,
        backgroundSize: "24px 24px, 100% 100%",
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {renderError && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-destructive/10 backdrop-blur-xl border border-destructive/30 text-destructive p-5 rounded-2xl font-mono text-sm max-w-[480px]">
            {renderError}
          </div>
        </div>
      )}
      <div
        className="absolute top-1/2 left-1/2 transition-transform"
        style={{
          transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${scale})`,
          transformOrigin: "center center",
          transitionDuration: isPanning ? "0s" : ".05s",
        }}
      >
        <div id="erd-output" ref={containerRef} className="min-w-0" />
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-0.5">
        {[
          { icon: Plus, action: () => setScale((s) => Math.min(s * 1.2, 5)) },
          {
            icon: Minus,
            action: () => setScale((s) => Math.max(s * 0.83, 0.2)),
          },
          { icon: Maximize2, action: resetView },
        ].map(({ icon: Icon, action }, i) => (
          <Button
            key={i}
            variant="outline"
            size="icon"
            onClick={action}
            className="h-8 w-8"
          >
            <Icon className="size-4" />
          </Button>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 text-[11px] text-muted-foreground font-mono">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
