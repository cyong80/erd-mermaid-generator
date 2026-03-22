import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
  { value: "system", label: "시스템", icon: Monitor },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = theme ?? "system";

  const IconComponent =
    resolvedTheme === "dark"
      ? Moon
      : resolvedTheme === "light"
        ? Sun
        : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-lg"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          aria-label="테마 변경"
        >
          <IconComponent className="size-4 text-muted-foreground transition-transform group-hover:text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8.5rem]">
        <DropdownMenuRadioGroup
          value={currentTheme}
          onValueChange={(v) => setTheme(v)}
        >
          {themes.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon
                className={cn(
                  "size-4",
                  currentTheme === value ? "text-primary" : "text-muted-foreground",
                )}
              />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
