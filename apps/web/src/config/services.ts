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
    id: "trial",
    name: "15-day Free Trial",
    price: "$0",
    cadence: "for 15 days",
    description:
      "Explore every core module for 15 days with up to 100 AI requests. Add a card at signup; billing starts automatically when the trial ends.",
    features: [
      "Up to 100 AI requests during trial",
      "Card required (auto-debit after trial)",
      "All core modules unlocked",
    ],
    cta: "Start free trial",
    href: ROUTES.register,
    featured: true,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    cadence: "/ month",
    description: "For growing teams after the trial — billed automatically from your card.",
    features: ["Higher AI capacity", "Workflows & automations", "Card auto-billing"],
    cta: "Choose Starter",
    href: ROUTES.register,
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$99",
    cadence: "/ month",
    description: "Full Novixa depth across CRM, support, marketing, and agents.",
    features: ["Expanded AI capacity", "CRM + Support + Agents", "Social ads & WhatsApp"],
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
