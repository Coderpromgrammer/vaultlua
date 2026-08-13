"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";

/**
 * Hook that returns the user's projects and the currently selected project ID.
 * The selected project is persisted in localStorage so navigation between
 * dashboard pages preserves the context.
 */
export function useSelectedProject() {
  const [explicitId, setExplicitId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("vaultlua:selected-project");
  });

  const { data: projects } = useQuery({
    queryKey: ["all-projects-for-selector"],
    queryFn: async () => {
      const r = await fetch("/api/projects?pageSize=100");
      const j = await r.json();
      return j?.data ?? [];
    },
  });

  // Resolve the effective selected ID. If the explicit selection is missing
  // or stale (no longer in the list), fall back to the first project.
  const selectedId = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    if (explicitId && projects.some((p: any) => p.id === explicitId)) {
      return explicitId;
    }
    return projects[0].id;
  }, [projects, explicitId]);

  // Keep localStorage in sync when the effective id changes (no cascading render)
  useEffect(() => {
    if (selectedId) {
      localStorage.setItem("vaultlua:selected-project", selectedId);
    }
  }, [selectedId]);

  const select = (id: string) => {
    setExplicitId(id);
    localStorage.setItem("vaultlua:selected-project", id);
  };

  const selectedProject = projects?.find((p: any) => p.id === selectedId) ?? null;

  return {
    projects: projects ?? [],
    selectedId,
    selectedProject,
    select,
  };
}
