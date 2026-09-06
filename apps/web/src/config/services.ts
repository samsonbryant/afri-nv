import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bot,
  CreditCard,
  GitBranch,
  LifeBuoy,
  Megaphone,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

export type NovixaService = {
  id: string;
  title: string;
  summary: string;
  href: string;
  icon: LucideIcon;
  highlight?: string;
};

export const NOVIXA_SERVICES: NovixaService[] = [
  {
    id: "assistant",
    title: "AI Assistant",
    summary:
      "Ask questions, draft work, and get guided next steps from an assistant tuned to your workspace.",
    href: ROUTES.assistant,
    icon: Sparkles,
    highlight: "Chat",
  },
  {
    id: "workflows",
    title: "Workflow Studio",
    summary:
      "Design visual workflows with triggers, conditions, and AI actions your team can publish and run.",
    href: ROUTES.workflows,
    icon: GitBranch,
    highlight: "Automate",
  },
  {
    id: "automations",
    title: "Automations",
    summary:
      "Run scheduled and event-driven jobs so routine operations move without manual follow-up.",
    href: ROUTES.automations,
    icon: Zap,
    highlight: "Scale",
  },
  {
    id: "knowledge",
    title: "Knowledge Base",
    summary:
      "Upload docs, index institutional knowledge, and retrieve grounded answers for your team.",
    href: ROUTES.knowledge,
    icon: BookOpen,
  },
  {
    id: "crm",
    title: "CRM",
    summary:
      "Track leads, contacts, companies, and opportunities in one pipeline connected to your AI tools.",
    href: ROUTES.crm,
    icon: Users,
  },
  {
    id: "support",
    title: "Support Inbox",
    summary: "Triage customer conversations and keep response quality high as volume grows.",
    href: ROUTES.support,
    icon: LifeBuoy,
  },
  {
    id: "marketing",
    title: "Marketing Studio",
    summary: "Generate campaigns, drafts, and content assets aligned with your brand voice.",
    href: ROUTES.marketing,
    icon: Megaphone,
  },
  {
    id: "agents",
    title: "AI Agents",
    summary:
      "Deploy specialized agents for sales, ops, and research tasks that work alongside your team.",
    href: ROUTES.agents,
    icon: Bot,
  },
  {
    id: "billing",
    title: "Subscriptions & Billing",
    summary:
      "Choose a plan, pay with MTN MoMo or Orange Money, and unlock the capacity your business needs.",
    href: ROUTES.billing,
    icon: CreditCard,
    highlight: "Subscribe",
  },
];

export const NOVIXA_PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "to start",
    description: "Explore Novixa with limited AI replies and core workspace tools.",
    features: ["5 AI requests / month", "Personal workspace", "Core modules"],
    cta: "Start free",
    href: ROUTES.register,
    featured: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    cadence: "/ month",
    description: "For growing teams that need reliable AI and automations every day.",
    features: ["Higher AI limits", "Workflows & automations", "Mobile Money checkout"],
    cta: "Subscribe",
    href: ROUTES.register,
    featured: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$99",
    cadence: "/ month",
    description: "For operators who want full Novixa depth across CRM, support, and agents.",
    features: ["Expanded AI capacity", "CRM + Support + Agents", "Priority workspace tools"],
    cta: "Go Pro",
    href: ROUTES.register,
    featured: false,
  },
] as const;

export const FOUNDER = {
  name: "Samson Bryant",
  role: "Founder & CEO",
  title: "Developer & TechPreneur",
  bio: [
    "Samson Bryant is a developer and techpreneur building practical AI systems for real businesses—especially teams that need modern software without the complexity tax.",
    "With Novixa, his focus is an AI business operating system: one place to run assistants, workflows, knowledge, CRM, and customer operations with clear paths to subscribe and scale.",
    "Based in Liberia, Samson is building Novixa for African operators first—local payment rails, clear product value, and software that helps teams move faster every day.",
  ],
} as const;

/** Documented bootstrap admin for deployments (change after first login in production). */
export const ADMIN_BOOTSTRAP = {
  email: "admin@novixa.ai",
  password: "NovixaAdmin2026!",
  note: "Staff admin — change this password after first sign-in.",
} as const;
