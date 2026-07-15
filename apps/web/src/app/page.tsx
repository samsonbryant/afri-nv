"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/lib/constants";

const easeOut = [0.22, 1, 0.36, 1] as const;

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: easeOut },
  };
}

export default function LandingPage() {
  return (
    <div className="bg-background relative min-h-screen overflow-hidden">
      <div className="bg-teal-glow pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="bg-grid-pattern pointer-events-none absolute inset-0 bg-[size:48px_48px] opacity-40 dark:opacity-20"
        aria-hidden
      />
      <div
        className="bg-primary/20 pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-1/4 h-80 w-80 rounded-full bg-[hsl(199_60%_40%/0.18)] blur-3xl"
        aria-hidden
      />

      <header className="relative z-10">
        <div className="container flex h-16 items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href={ROUTES.login}>Sign in</Link>
            </Button>
            <Button asChild>
              <Link href={ROUTES.register}>Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center pb-20 pt-10">
          <div className="container relative">
            <div className="mx-auto max-w-4xl text-center">
              <motion.h1
                className="font-display text-foreground text-6xl font-extrabold tracking-tight sm:text-7xl md:text-8xl"
                {...fadeUp(0)}
              >
                {siteConfig.name}
              </motion.h1>

              <motion.p
                className="font-display text-foreground/90 mx-auto mt-6 max-w-2xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl"
                {...fadeUp(0.12)}
              >
                The AI operating system for modern businesses
              </motion.p>

              <motion.p
                className="text-muted-foreground mx-auto mt-5 max-w-xl text-balance text-base sm:text-lg"
                {...fadeUp(0.24)}
              >
                Orchestrate workflows, automations, and intelligent agents from one calm command
                center.
              </motion.p>

              <motion.div
                className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
                {...fadeUp(0.36)}
              >
                <Button size="lg" asChild className="min-w-[160px]">
                  <Link href={ROUTES.register}>
                    Start free
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="bg-background/60 min-w-[160px] backdrop-blur"
                >
                  <Link href={ROUTES.login}>Sign in</Link>
                </Button>
              </motion.div>
            </div>

            <motion.div
              className="pointer-events-none relative mx-auto mt-16 h-48 max-w-5xl sm:mt-20 sm:h-64 md:h-72"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.45, ease: easeOut }}
              aria-hidden
            >
              <div className="border-primary/20 from-primary/15 absolute inset-x-[8%] top-0 h-full rounded-[2rem] border bg-gradient-to-b via-transparent to-transparent blur-[1px]" />
              <div className="border-border/60 from-background/80 via-primary/5 absolute inset-x-[16%] top-6 h-[70%] rounded-[1.5rem] border bg-gradient-to-br to-[hsl(199_50%_40%/0.12)] shadow-[0_30px_80px_-40px_hsl(174_72%_20%/0.55)] backdrop-blur-sm" />
              <motion.div
                className="bg-primary/50 absolute left-[22%] top-16 h-2 w-[28%] rounded-full"
                animate={{ opacity: [0.35, 0.8, 0.35], x: [0, 12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute right-[24%] top-28 h-2 w-[22%] rounded-full bg-[hsl(199_60%_45%/0.55)]"
                animate={{ opacity: [0.3, 0.75, 0.3], x: [0, -10, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.6,
                }}
              />
              <motion.div
                className="bg-primary/25 absolute bottom-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full blur-2xl"
                animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </section>

        <section className="border-border/60 bg-background/70 relative z-10 border-t py-24 backdrop-blur-sm">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              One system. Every operation.
            </h2>
            <p className="text-muted-foreground mt-4">
              Novixa connects people, process, and AI so your team ships work instead of chasing it.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
