"use client";

import { Users as UsersIcon } from "lucide-react";
import { ProjectAwareView } from "@/components/shared/project-aware";
import { InlineUserList } from "./inline-tabs";

export function UsersView() {
  return (
    <ProjectAwareView
      title="Users"
      description="View and manage end users who have claimed your license keys."
      emptyIcon={UsersIcon}
      emptyTitle="No project selected"
      emptyDescription="Create a project first, then select it from the dropdown to manage users."
      render={(projectId) => <InlineUserList projectId={projectId} />}
    />
  );
}
