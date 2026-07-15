import type { Organization } from "@/types/api";

export type OrganizationMember = {
  id: string;
  email: string;
  fullName: string;
  role: "owner" | "admin" | "member";
};

export type OrganizationDetail = Organization & {
  members?: OrganizationMember[];
};
