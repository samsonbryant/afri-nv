"use client";

import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useMemberships,
  useRemoveMembership,
} from "@/features/organizations/hooks/use-organizations";

type MembersListProps = {
  organizationId: string | null;
};

export function MembersList({ organizationId }: MembersListProps) {
  const { data: members, isLoading } = useMemberships(organizationId);
  const remove = useRemoveMembership(organizationId);

  if (!organizationId) {
    return <p className="text-muted-foreground text-sm">Select a workspace to view members.</p>;
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading members…
      </div>
    );
  }

  if (!members || members.length === 0) {
    return <p className="text-muted-foreground text-sm">No members found yet.</p>;
  }

  return (
    <ul className="divide-border border-border divide-y rounded-xl border">
      {members.map((member) => (
        <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{member.fullName}</p>
            <p className="text-muted-foreground truncate text-xs">
              {member.email || member.userId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {member.role}
            </Badge>
            {member.role !== "owner" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate(member.id)}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
