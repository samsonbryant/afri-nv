import type { Metadata } from "next";
import { PublicBookingPage } from "@/features/meetings/components/public-booking-page";

export const metadata: Metadata = {
  title: "Book a meeting",
  description: "Schedule time with us",
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BookPage({ params }: PageProps) {
  const { slug } = await params;
  return <PublicBookingPage slug={slug} />;
}
