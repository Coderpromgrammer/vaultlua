"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/shared/primitives";
import { FolderKanban, type LucideIcon } from "lucide-react";
import { useSelectedProject } from "@/lib/use-project";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { navigate } from "@/lib/router";
import { cn } from "@/lib/utils";

/**
 * Wraps a view that needs a project context. If no project is selected,
 * shows an empty state prompting the user to create or pick one.
 * The project selector is in the page header.
 */
export function ProjectAwareView({
  title,
  description,
  emptyIcon: Icon = FolderKanban,
  emptyTitle,
  emptyDescription,
  render,
  actions,
}: {
  title: string;
  description?: string;
  emptyIcon?: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  render: (projectId: string) => React.ReactNode;
  actions?: React.ReactNode;
}) {
  const { projects, selectedId, selectedProject, select } = useSelectedProject();

  if (projects.length === 0) {
    return (
      <div>
        <PageHeader title={title} description={description} actions={actions} />
        <Card className="glass-panel">
          <EmptyState
            icon={Icon}
            title={emptyTitle}
            description={emptyDescription}
            action={
              <Button
                className="bg-gradient-to-r from-violet-600 to-cyan-600 border-0"
                onClick={() => navigate("/projects?new=1")}
              >
                Create project
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Select value={selectedId ?? ""} onValueChange={select}>
              <SelectTrigger className="w-56 bg-muted/40 h-9">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span>{p.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{p.identifier}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {actions}
          </>
        }
      />
      {selectedId ? (
        render(selectedId)
      ) : (
        <Card className="glass-panel">
          <EmptyState
            icon={Icon}
            title="Select a project"
            description="Choose a project from the dropdown above to view its data."
          />
        </Card>
      )}
    </div>
  );
}
