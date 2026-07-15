import type { User, Organization } from "@/types/api";

export type AuthUser = User;
export type AuthOrganization = Organization;

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  fullName: string;
  email: string;
  organizationName: string;
  password: string;
};
