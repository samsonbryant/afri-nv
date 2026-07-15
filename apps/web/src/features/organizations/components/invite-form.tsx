"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInviteMember } from "@/features/organizations/hooks/use-organizations";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validations/auth";

type InviteFormProps = {
  organizationId: string | null;
};

export function InviteForm({ organizationId }: InviteFormProps) {
  const invite = useInviteMember(organizationId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  function onSubmit(values: InviteMemberInput) {
    invite.mutate(values, {
      onSuccess: () => reset({ email: "", role: "member" }),
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
      aria-label="Invite team member"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="colleague@company.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "invite-email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="invite-email-error" className="text-destructive text-sm" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
            {...register("role")}
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button
            type="submit"
            disabled={!organizationId || invite.isPending}
            className="w-full sm:w-auto"
          >
            {invite.isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              "Send invite"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
