"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// useSyncExternalStore is the React-blessed way to subscribe to an external
// signal without triggering cascading renders. We use it to track "has this
// component mounted on the client yet" so we can render a stable placeholder
// during SSR and avoid hydration mismatches.
const emptySubscribe = () => () => {};
function getMountedSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getMountedSnapshot,
    getServerSnapshot
  );

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Sun className="w-4 h-4" />
      </Button>
    );
  }

  const current = theme ?? "system";
  const isDark = resolvedTheme === "dark";

  if (compact) {
    // Single-button toggle: just flips between light and dark
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 relative"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <Sun
          className={cn(
            "w-4 h-4 absolute transition-all duration-300",
            isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
          )}
        />
        <Moon
          className={cn(
            "w-4 h-4 absolute transition-all duration-300",
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
          )}
        />
      </Button>
    );
  }

  // Dropdown variant with system option
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Sun
            className={cn(
              "w-4 h-4 absolute transition-all duration-300",
              isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
            )}
          />
          <Moon
            className={cn(
              "w-4 h-4 absolute transition-all duration-300",
              isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
            )}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn("gap-2 cursor-pointer", current === "light" && "bg-accent")}
        >
          <Sun className="w-3.5 h-3.5" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn("gap-2 cursor-pointer", current === "dark" && "bg-accent")}
        >
          <Moon className="w-3.5 h-3.5" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn("gap-2 cursor-pointer", current === "system" && "bg-accent")}
        >
          <Monitor className="w-3.5 h-3.5" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
