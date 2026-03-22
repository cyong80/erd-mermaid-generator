import { create } from "zustand";
import { toast } from "sonner";
import type {
  Schema,
  DBConfig,
  RecentConnection,
} from "../../../../shared/types";

export type PanelType = "preview" | "filter" | "code" | "obsidian";

interface ErdState {
  step: "connect" | "preview";
  schema: Schema | null;
  mermaidCode: string;
  dbName: string;
  dbType: "mysql" | "postgres";
  dbHost: string;
  dbPort: string;
  loading: boolean;
  error: string;
  activePanel: PanelType;
  includedTables: string[] | null;
  connectDialogOpen: boolean;
}

interface ErdActions {
  setMermaidCode: (code: string) => void;
  setActivePanel: (panel: PanelType) => void;
  setConnectDialogOpen: (open: boolean) => void;
  reset: () => void;
  scan: (config: DBConfig) => Promise<boolean>;
  applyFilter: (tables: string[] | null) => Promise<void>;
  saveMarkdown: () => Promise<void>;
  loadMarkdown: () => Promise<void>;
  copyClipboard: () => Promise<void>;
  exportImage: (format: "svg" | "png") => Promise<void>;
}

const initialState: ErdState = {
  step: "preview",
  schema: null,
  mermaidCode: "",
  dbName: "",
  dbType: "mysql",
  dbHost: "",
  dbPort: "",
  loading: false,
  error: "",
  activePanel: "preview",
  includedTables: null,
  connectDialogOpen: false,
};

export const useErdStore = create<ErdState & ErdActions>((set, get) => ({
  ...initialState,

  setMermaidCode: (code) => set({ mermaidCode: code }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setConnectDialogOpen: (open) => set({ connectDialogOpen: open }),

  reset: () => set(initialState),

  scan: async (config) => {
    set({ loading: true, error: "" });
    try {
      const result = await window.api.scanDB(config);
      const code = await window.api.generateMermaid({
        schema: result,
        dbName: config.database,
        includedTables: null,
      });
      set({
        schema: result,
        mermaidCode: code,
        dbName: config.database,
        dbType: config.dbType,
        dbHost: config.host,
        dbPort: config.port,
        includedTables: null,
        step: "preview",
        activePanel: "preview",
        loading: false,
        error: "",
      });
      return true;
    } catch (e) {
      set({
        loading: false,
        error: (e as Error).message || "연결 실패",
      });
      return false;
    }
  },

  applyFilter: async (tables) => {
    const { schema, dbName } = get();
    if (!schema) return;
    try {
      const code = await window.api.generateMermaid({
        schema,
        dbName,
        includedTables: tables,
      });
      set({ mermaidCode: code, includedTables: tables, activePanel: "preview" });
      toast.success(
        tables ? `${tables.length}개 테이블로 필터링` : "전체 테이블 표시",
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  },

  saveMarkdown: async () => {
    const { mermaidCode, dbName } = get();
    const r = await window.api.saveMarkdown({ mermaidCode, dbName });
    if (r.saved && r.filePath) {
      toast.success(`저장: ${r.filePath.split("/").pop()}`);
    }
  },

  loadMarkdown: async () => {
    const r = await window.api.loadMarkdown();
    if (!r.loaded || !r.mermaidCode) {
      if (r.error) toast.error(r.error);
      return;
    }
    set({
      mermaidCode: r.mermaidCode,
      dbName: r.dbName ?? "unknown",
      schema: null,
      dbHost: "",
      dbPort: "",
      includedTables: null,
      activePanel: "preview",
    });
    toast.success(`불러옴: ${r.filePath?.split("/").pop() ?? r.dbName}`);
  },

  copyClipboard: async () => {
    const { mermaidCode } = get();
    await window.api.copyClipboard(mermaidCode);
    toast.success("클립보드에 복사됨");
  },

  exportImage: async (format) => {
    const svg = document.querySelector(
      "#erd-output svg",
    ) as SVGSVGElement | null;
    if (!svg) {
      toast.warning("ERD를 먼저 생성하세요");
      return;
    }
    const { dbName } = get();

    if (format === "svg") {
      const b64 = btoa(
        unescape(
          encodeURIComponent(new XMLSerializer().serializeToString(svg)),
        ),
      );
      const r = await window.api.exportImage({
        dataUrl: `data:image/svg+xml;base64,${b64}`,
        format: "svg",
        dbName,
      });
      if (r.saved) toast.success("SVG 내보내기 완료");
    } else {
      const url = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(svg)], {
          type: "image/svg+xml",
        }),
      );
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = svg.viewBox.baseVal.width || svg.clientWidth || 1200;
        canvas.height = svg.viewBox.baseVal.height || svg.clientHeight || 800;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const r = await window.api.exportImage({
          dataUrl: canvas.toDataURL("image/png"),
          format: "png",
          dbName,
        });
        if (r.saved) toast.success("PNG 내보내기 완료");
      };
      img.src = url;
    }
  },
}));
