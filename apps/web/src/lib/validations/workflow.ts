import { z } from "zod";

export const workflowStatusSchema = z.enum(["draft", "active", "paused", "archived"]);

export const createWorkflowSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  status: workflowStatusSchema.default("draft"),
});

export const updateWorkflowSchema = createWorkflowSchema.partial();

export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;
export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
