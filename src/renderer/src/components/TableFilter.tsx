import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useErdStore } from "@/store/erdStore";
import type { SchemaTable, SchemaRelation } from "../../../shared/types";

export default function TableFilter() {
  const schema = useErdStore((s) => s.schema);
  const applyFilter = useErdStore((s) => s.applyFilter);

  const allNames = useMemo(
    () => (schema?.tables ?? []).map((t: SchemaTable) => t.name),
    [schema],
  );
  const [checked, setChecked] = useState<Set<string>>(new Set(allNames));
  const [search, setSearch] = useState("");

  useEffect(() => {
    setChecked(new Set(allNames));
  }, [schema, allNames]);

  const filtered = allNames.filter((n: string) =>
    n.toLowerCase().includes(search.toLowerCase()),
  );
  const allChecked = filtered.every((n: string) => checked.has(n));

  const toggle = (name: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleAll = () => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (allChecked) filtered.forEach((n: string) => next.delete(n));
      else filtered.forEach((n: string) => next.add(n));
      return next;
    });
  };

  const selectWithRelated = (name: string) => {
    if (!schema) return;
    const related = new Set([name]);
    for (const rel of schema.relations) {
      if (rel.from.table === name) related.add(rel.to.table);
      if (rel.to.table === name) related.add(rel.from.table);
    }
    setChecked((prev) => new Set([...prev, ...related]));
  };

  const handleApply = () => {
    applyFilter(checked.size === allNames.length ? null : [...checked]);
  };

  const handleReset = () => {
    setChecked(new Set(allNames));
    applyFilter(null);
  };

  const checkedCount = [...checked].filter((n) => allNames.includes(n)).length;

  if (!schema) return null;

  return (
    <div className="flex flex-col h-full glass-panel rounded-none border-0">
      <div className="p-2.5 px-3 border-b border-border/60 flex-shrink-0">
        <div className="flex items-center mb-2">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            테이블 필터
          </span>
          <span
            className={cn(
              "ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
              checkedCount < allNames.length
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {checkedCount}/{allNames.length}
          </span>
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="테이블 검색..."
          className="h-8 text-xs"
        />
      </div>

      <div className="flex items-center gap-1.5 p-1.5 px-3 border-b border-border/60 flex-shrink-0">
        <Checkbox
          checked={allChecked}
          onCheckedChange={toggleAll}
          className="rounded"
        />
        <span className="text-xs text-muted-foreground flex-1">전체 선택</span>
      </div>

      <div className="flex-1 overflow-auto py-1">
        {filtered.map((name: string) => {
          const table = schema.tables.find((t: SchemaTable) => t.name === name);
          const relCount = schema.relations.filter(
            (r: SchemaRelation) => r.from.table === name || r.to.table === name,
          ).length;

          return (
            <div
              key={name}
              className={cn(
                "flex items-center gap-2 py-1 px-3 transition-opacity",
                !checked.has(name) && "opacity-45",
              )}
            >
              <Checkbox
                checked={checked.has(name)}
                onCheckedChange={() => toggle(name)}
                className="rounded flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {name}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {table?.columns.length}컬럼
                  {relCount > 0 && ` · ${relCount}관계`}
                </div>
              </div>
              {relCount > 0 && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => selectWithRelated(name)}
                  title="연관 테이블 함께 선택"
                  className="h-5 text-[10px] px-1.5 flex-shrink-0"
                >
                  +관련
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-2.5 border-t border-border/60 flex-shrink-0">
        <Button onClick={handleApply} className="w-full h-9 font-semibold text-sm">
          ERD 업데이트
        </Button>
        {checkedCount < allNames.length && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="w-full h-8 mt-1 text-xs"
          >
            전체 초기화
          </Button>
        )}
      </div>
    </div>
  );
}
