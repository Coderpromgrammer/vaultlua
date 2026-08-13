"use client";

import { Radio } from "lucide-react";
import { ProjectAwareView } from "@/components/shared/project-aware";
import { InlineSessionList } from "./inline-tabs";

export function SessionsView() {
  return (
    <ProjectAwareView
      title="Sessions"
      description="Real-time view of active script execution sessions. Auto-refreshing every 10 seconds."
      emptyIcon={Radio}
      emptyTitle="No project selected"
      emptyDescription="Create a project first, then select it from the dropdown to view sessions."
      render={(projectId) => <InlineSessionList projectId={projectId} />}
    />
  );
}
