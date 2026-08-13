"use client";

import { Gift } from "lucide-react";
import { ProjectAwareView } from "@/components/shared/project-aware";
import { InlineRewardsConfig } from "./inline-tabs";

export function RewardsView() {
  return (
    <ProjectAwareView
      title="Rewards"
      description="Configure ad-gated reward links with checkpoint progression. All validation is server-authoritative."
      emptyIcon={Gift}
      emptyTitle="No project selected"
      emptyDescription="Create a project first, then select it to configure reward links."
      render={(projectId) => <InlineRewardsConfig projectId={projectId} />}
    />
  );
}
