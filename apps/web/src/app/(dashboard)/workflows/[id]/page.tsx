import { redirect } from "next/navigation";

type WorkflowDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Legacy `/workflows/:id` links redirect to the builder route. */
export default async function WorkflowDetailPage({ params }: WorkflowDetailPageProps) {
  const { id } = await params;
  redirect(`/workflows/${id}/builder`);
}
