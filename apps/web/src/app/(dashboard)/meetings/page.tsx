import type { Metadata } from "next";
import { MeetingsWorkspace } from "@/features/meetings/components/meetings-workspace";

export const metadata: Metadata = {
  title: "Meetings",
};

export default function MeetingsPage() {
  return <MeetingsWorkspace />;
}
