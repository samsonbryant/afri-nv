"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/site-header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { NOVIXA_PLANS, NOVIXA_SERVICES } from "@/config/services";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="bg-background min-h-screen">
      {/* Hero — one composition, brand-first, edge-to-edge ink plane */}
      <section className="bg-ink-mesh relative min-h-[100svh] overflow-hidden text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
          }}
          aria-hidden
        />
        {!reduceMotion ? (
          <motion.div
            className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#9000F0]/40 blur-3xl"
            animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.12, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        ) : null}

        <MarketingHeader variant="overlay" />

        <div className="relative z-10 flex min-h-[100svh] flex-col justify-center pb-20 pt-24">
          <div className="container">
            <div className="mx-auto max-w-4xl text-center">
              <motion.p
                className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: easeOut }}
              >
                {siteConfig.name}
              </motion.p>

              <motion.h1
                className="mx-auto mt-5 max-w-3xl text-balance text-xl font-medium text-white/90 sm:text-2xl md:text-3xl"
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
              >
                The AI business operating system for teams that ship
              </motion.h1>

              <motion.p
                className="mx-auto mt-5 max-w-xl text-balance text-base text-white/65 sm:text-lg"
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: easeOut }}
              >
                Assistants, workflows, knowledge, CRM, and customer ops—one platform with plans you
                can subscribe to as you grow.
              </motion.p>

              <motion.div
                className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: easeOut }}
              >
                <Button size="lg" asChild className="min-w-[168px] shadow-lg shadow-[#9000F0]/30">
                  <Link href={ROUTES.register}>
                    Start free
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="min-w-[168px] border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/#services">Explore services</Link>
                </Button>
              </motion.div>
            </div>
          </div>

          {!reduceMotion ? (
            <motion.div
              className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              aria-hidden
            />
          ) : (
            <div
              className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent"
              aria-hidden
            />
          )}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="relative scroll-mt-20 py-20 sm:py-28">
        <div
          className="bg-brand-glow pointer-events-none absolute inset-0 opacity-70"
          aria-hidden
        />
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything Novixa offers
            </h2>
            <p className="text-muted-foreground mt-3 text-balance text-base sm:text-lg">
              Subscribe once, then unlock the modules your business needs—from AI chat to CRM and
              automations.
            </p>
          </div>

          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NOVIXA_SERVICES.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.li
                  key={service.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: index * 0.04, ease: easeOut }}
                >
                  <Link
                    href={ROUTES.register}
                    className="border-border/80 bg-card/80 hover:border-primary/40 hover:shadow-primary/10 focus-visible:ring-ring group relative flex h-full flex-col rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="bg-primary/10 text-primary inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      {service.highlight ? (
                        <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
                          {service.highlight}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="font-display mt-5 text-lg font-semibold tracking-tight">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
                      {service.summary}
                    </p>
                    <span className="text-primary mt-5 inline-flex items-center gap-1 text-sm font-medium">
                      Subscribe to use
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Pricing / subscribe */}
      <section
        id="pricing"
        className="border-border/60 bg-muted/40 scroll-mt-20 border-y py-20 sm:py-28"
      >
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Plans that grow with you
            </h2>
            <p className="text-muted-foreground mt-3 text-balance">
              Start free, then upgrade with MTN MoMo or Orange Money when you need more AI capacity.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-3">
            {NOVIXA_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "bg-card relative flex flex-col rounded-2xl border p-6",
                  plan.featured
                    ? "border-primary shadow-primary/15 ring-primary/20 shadow-xl ring-1"
                    : "border-border/80",
                )}
              >
                {plan.featured ? (
                  <span className="bg-primary text-primary-foreground absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-semibold">
                    Popular
                  </span>
                ) : null}
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                <p className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">{plan.cadence}</span>
                </p>
                <p className="text-muted-foreground mt-3 text-sm">{plan.description}</p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  variant={plan.featured ? "default" : "outline"}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="container">
          <div className="from-primary/15 via-background to-primary/5 border-primary/20 relative overflow-hidden rounded-3xl border bg-gradient-to-br px-6 py-14 text-center sm:px-12">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to operate with AI?
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-balance">
              Create your workspace in minutes. Meet the founder story on our About page, then
              choose a plan that fits.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href={ROUTES.register}>Create account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={ROUTES.about}>About Novixa</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
