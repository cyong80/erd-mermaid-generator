import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { BookOpen, FolderOpen, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useErdStore } from "@/store/erdStore";

export default function ObsidianPanel() {
  const mermaidCode = useErdStore((s) => s.mermaidCode);
  const dbName = useErdStore((s) => s.dbName);
  const [vaultPath, setVaultPath] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [subFolder, setSubFolder] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.api.getObsidianVault().then((p) => {
      if (p) {
        setVaultPath(p);
        setIsValid(true);
        loadFolders();
      }
    });
  }, []);

  const loadFolders = async () => {
    const list = await window.api.listVaultFolders();
    setFolders(list);
  };

  const handlePickVault = async () => {
    const r = await window.api.pickObsidianVault();
    if (!r.picked) return;
    setVaultPath(r.vaultPath ?? "");
    setIsValid(r.isValid ?? false);
    if (r.isValid) {
      const list = await window.api.listVaultFolders();
      setFolders(list);
    }
    if (!r.isValid)
      toast.warning(
        ".obsidian 폴더를 찾을 수 없습니다. Vault 루트를 선택해주세요.",
      );
  };

  const handleClearVault = async () => {
    await window.api.clearObsidianVault();
    setVaultPath("");
    setIsValid(false);
    setFolders([]);
  };

  const handleSave = async () => {
    if (!mermaidCode) return;
    setSaving(true);
    try {
      const r = await window.api.saveToObsidian({
        mermaidCode,
        dbName,
        subFolder: subFolder || null,
      });
      if (r.saved && r.filePath) {
        const short = r.filePath.split("/").slice(-3).join("/");
        toast.success(`Obsidian 저장 완료: .../${short}`);
      } else {
        toast.error(r.error ?? "저장 실패");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const vaultName = vaultPath
    ? vaultPath.split("/").pop() || vaultPath.split("\\").pop()
    : "";
  const savePath = subFolder
    ? `${subFolder}/ERD/${dbName}-erd.md`
    : `ERD/${dbName}-erd.md`;

  return (
    <div className="p-3.5 px-4 flex flex-col flex-1 overflow-auto bg-muted/50">
      <div className="mb-3.5">
        <Label className="mb-1.5 block">Obsidian Vault</Label>

        {vaultPath ? (
          <div
            className={cn(
              "rounded-xl p-2 px-2.5 flex items-center gap-2 border backdrop-blur-xl",
              isValid
                ? "bg-secondary/80 border-emerald-500/40"
                : "bg-destructive/10 border-destructive/40",
            )}
          >
            <BookOpen className="size-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {vaultName}
              </div>
              <div
                className={cn(
                  "text-[10px]",
                  isValid ? "text-emerald-500" : "text-destructive",
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {isValid ? (
                    <>
                      <Check className="size-3 shrink-0" /> 유효한 Vault
                    </>
                  ) : (
                    <>
                      <X className="size-3 shrink-0" /> .obsidian 폴더 없음
                    </>
                  )}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearVault}
              className="h-7 text-xs px-2"
            >
              변경
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={handlePickVault}
            className="w-full h-10 border-dashed text-muted-foreground text-sm font-normal"
          >
            <FolderOpen className="size-4 mr-1.5" /> Vault 폴더 선택
          </Button>
        )}
      </div>

      {isValid && (
        <div className="mb-3.5">
          <Label className="mb-1.5 block">저장 위치 (선택)</Label>
          <Select value={subFolder} onValueChange={setSubFolder}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="— Vault 루트에 저장" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— Vault 루트에 저장</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-1 text-[11px] text-muted-foreground font-mono">
            저장 경로: {savePath}
          </div>
        </div>
      )}

      {isValid && (
        <Button
          onClick={handleSave}
          disabled={saving || !mermaidCode}
          className={cn(
            "w-full h-9 font-semibold text-sm flex items-center justify-center gap-1.5",
            !mermaidCode && "opacity-50",
          )}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <BookOpen className="size-4" />
          )}{" "}
          {saving ? "저장 중..." : "Obsidian에 저장"}
        </Button>
      )}

      <div className="mt-3.5 text-[11px] text-muted-foreground leading-relaxed">
        저장된 파일은 Obsidian에서 Mermaid 플러그인으로 바로 렌더링됩니다.
        <br />
        추천 플러그인: <span className="text-primary">Mermaid Tools</span>
      </div>
    </div>
  );
}
