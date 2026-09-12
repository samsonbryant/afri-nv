import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  BookOpen,
  FileText,
  LifeBuoy,
  MessageCircle,
  Receipt,
  Users,
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
    id: "crm",
    title: "Lead & Customer CRM",
    summary: "Keep every prospect, contact, deal, and client conversation in one clear pipeline.",
    href: ROUTES.crm,
    icon: Users,
    highlight: "Sell",
  },
  {
    id: "proposals",
    title: "AI Proposals & Emails",
    summary:
      "Turn client details into polished quotations, proposals, and follow-up emails faster.",
    href: ROUTES.marketing,
    icon: FileText,
    highlight: "Create",
  },
  {
    id: "follow-up",
    title: "Automated Follow-ups",
    summary: "Schedule reminders and next actions so qualified leads never go cold.",
    href: ROUTES.automations,
    icon: BellRing,
    highlight: "Follow up",
  },
  {
    id: "knowledge",
    title: "Business Knowledge Assistant",
    summary:
      "Get grounded answers from your services, policies, documents, and client information.",
    href: ROUTES.knowledge,
    icon: BookOpen,
  },
  {
    id: "support",
    title: "Customer Support Inbox",
    summary: "Manage customer questions and use AI to draft fast, consistent responses.",
    href: ROUTES.support,
    icon: LifeBuoy,
  },
  {
    id: "whatsapp",
    title: "WhatsApp Integration",
    summary:
      "Connect conversations and client follow-ups to the channel your customers already use.",
    href: ROUTES.support,
    icon: MessageCircle,
  },
  {
    id: "invoices",
    title: "Invoices & Payment Tracking",
    summary: "Create a clear path from accepted proposal to invoice and recorded payment.",
    href: ROUTES.billing,
    icon: Receipt,
    highlight: "Get paid",
  },
];

export const NOVIXA_PLANS = [
  {
    id: "trial",
    name: "14-day Free Trial",
    price: "$0",
    cadence: "for 14 days",
    description:
      "Explore every core module for 14 days with up to 100 AI requests. Add a card at signup; billing starts automatically when the trial ends.",
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
    name: "Solo",
    price: "$19",
    cadence: "/ month",
    description: "For freelancers and independent consultants managing their own client pipeline.",
    features: ["1 user", "CRM + proposals", "Follow-up reminders"],
    cta: "Choose Solo",
    href: ROUTES.register,
    featured: false,
  },
  {
    id: "pro",
    name: "Business",
    price: "$49",
    cadence: "/ month",
    description: "For small service teams that need shared sales, support, and automation tools.",
    features: ["Up to 5 users", "Support + knowledge assistant", "WhatsApp workflows"],
    cta: "Choose Business",
    href: ROUTES.register,
    featured: false,
  },
  {
    id: "agency",
    name: "Agency",
    price: "$99",
    cadence: "/ month",
    description: "For agencies managing more clients, teammates, campaigns, and follow-ups.",
    features: ["Up to 15 users", "Higher AI capacity", "Priority support"],
    cta: "Choose Agency",
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
