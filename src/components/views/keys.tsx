"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Plus, Search, MoreHorizontal, KeyRound, Copy, Check, Ban,
  RotateCcw, Clock, Trash2, Filter, X, ChevronDown,
} from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/shared/primitives";
import { ProjectAwareView } from "@/components/shared/project-aware";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InlineKeyList } from "./inline-tabs";

export function KeysView() {
  return (
    <ProjectAwareView
      title="Keys"
      description="Generate and manage license keys across all your projects."
      emptyIcon={KeyRound}
      emptyTitle="No project selected"
      emptyDescription="Create a project first, then select it from the dropdown to manage keys."
      render={(projectId) => <InlineKeyList projectId={projectId} />}
    />
  );
}
