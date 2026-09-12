"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Code2, Rocket } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/site-header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { FOUNDER, NOVIXA_SERVICES } from "@/config/services";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/lib/constants";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function AboutPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="bg-background min-h-screen">
      <MarketingHeader />

      <main>
        <section className="bg-ink-mesh relative overflow-hidden text-white">
          <div className="container relative z-10 py-20 sm:py-28">
            <motion.p
              className="text-sm font-medium uppercase tracking-[0.2em] text-white/55"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: easeOut }}
            >
              About
            </motion.p>
            <motion.h1
              className="font-display mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08, ease: easeOut }}
            >
              {siteConfig.name}
            </motion.h1>
            <motion.p
              className="mt-5 max-w-2xl text-lg text-white/70"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.16, ease: easeOut }}
            >
              An AI client-management platform built for freelancers, agencies, and service
              businesses that want to win, serve, and retain more customers.
            </motion.p>
          </div>
        </section>

        <section className="container py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight">What we build</h2>
              <p className="text-muted-foreground mt-4 text-base leading-relaxed">
                Novixa brings the customer journey into one practical workspace. Teams can capture
                leads, create proposals and emails, schedule follow-ups, answer questions from
                business knowledge, support customers, and track invoices and payments.
              </p>
              <p className="text-muted-foreground mt-4 text-base leading-relaxed">
                Payment for paid plans is built for local markets with MTN Mobile Money and Orange
                Money approval flows, so customers can upgrade without waiting on card processors.
              </p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {NOVIXA_SERVICES.slice(0, 6).map((service) => (
                  <li
                    key={service.id}
                    className="border-border/70 bg-card/60 rounded-xl border px-4 py-3 text-sm font-medium"
                  >
                    {service.title}
                  </li>
                ))}
              </ul>
            </div>

            <aside className="border-border/80 from-primary/10 via-card to-card relative overflow-hidden rounded-3xl border bg-gradient-to-br p-8">
              <div
                className="bg-primary/20 absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
                aria-hidden
              />
              <p className="text-primary text-xs font-semibold uppercase tracking-[0.18em]">
                Leadership
              </p>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight">
                {FOUNDER.name}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm font-medium">
                {FOUNDER.role} · {FOUNDER.title}
              </p>
              <div className="mt-6 space-y-4 text-sm leading-relaxed">
                {FOUNDER.bio.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)} className="text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="bg-background/80 border-border inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
                  <Code2 className="text-primary h-3.5 w-3.5" aria-hidden />
                  Developer
                </span>
                <span className="bg-background/80 border-border inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
                  <Rocket className="text-primary h-3.5 w-3.5" aria-hidden />
                  TechPreneur
                </span>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-border/60 bg-muted/35 border-y py-16 sm:py-20">
          <div className="container flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Build with Novixa
              </h2>
              <p className="text-muted-foreground mt-3">
                Create a free workspace, explore the product, and subscribe when you are ready for
                more AI capacity.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href={ROUTES.register}>
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={ROUTES.login}>Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
