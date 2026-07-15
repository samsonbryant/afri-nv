import type { Metadata } from "next";
import { InviteAcceptPanel } from "@/features/auth/components/invite-accept-panel";

export const metadata: Metadata = {
  title: "Accept invite",
  description: "Join a Novixa workspace",
};

type InvitePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Join a workspace</h1>
        <p className="text-muted-foreground text-sm">
          Accept your invitation to collaborate on Novixa
        </p>
      </div>
      <InviteAcceptPanel token={token} />
    </div>
  );
}
