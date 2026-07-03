"use client";

import { useState, useRef } from "react";
import { SplitReveal } from "@/components/motion/split-reveal";
import { ArrowRight, Check, Zap } from "lucide-react";
import { useSectionReveal } from "@/components/motion/use-section-reveal";

const plans = [
  {
    name: "Networking & Blue Team",
    description: "Cisco Networking Academy",
    price: { monthly: 3, annual: 3 },
    features: [
      "CCNA: Switching, Routing, Wireless Essentials — 2023",
      "CyberOps Associate — 2023",
      "Ethical Hacker — 2025",
      "Issued via Cisco Networking Academy",
      "Verifiable on Credly",
    ],
    cta: "Verify badges",
    verify: "https://www.credly.com/badges/8cb76dcc-7549-4039-a191-1c54d51c2650/public_url",
    highlight: false,
  },
  {
    name: "ISC2 SSCP",
    description: "Systems Security Certified Practitioner",
    price: { monthly: 1, annual: 1 },
    features: [
      "ID: A569L1FT9TZH",
      "Issued by ISC2 — Mar 2025",
      "Access control, risk ID, incident response",
      "Specialization via Coursera",
      "Verifiable credential",
      "Applied security fundamentals",
      "Systems security practice",
    ],
    cta: "Verify credential",
    verify: "https://www.coursera.org/account/accomplishments/specialization/A569L1FT9TZH",
    highlight: true,
  },
  {
    name: "Specializations",
    description: "Coursera credentials",
    price: { monthly: 2, annual: 2 },
    features: [
      "Applied Cryptography — Univ. of Colorado, 2024",
      "Core Java — LearnQuest, 2025",
      "Verifiable on Coursera",
      "Continuous learning track",
      "Cross-discipline foundations",
      "ID: RT4PZTRQAUC3 / 89A5SN83TDYA",
      "Self-paced completion",
      "Applied to security tooling",
    ],
    cta: "View credentials",
    verify: "https://www.coursera.org/account/accomplishments/specialization/RT4PZTRQAUC3",
    highlight: false,
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  useSectionReveal(sectionRef);

  return (
    <section id="pricing" ref={sectionRef} className="relative py-32 lg:py-40">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header - Dramatic offset */}
        <div className="grid lg:grid-cols-12 gap-8 mb-20">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-8">
              <span className="w-12 h-px bg-foreground/30" />
              Certifications
            </span>
            <h2 className="text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9]">
              <SplitReveal>Verified</SplitReveal>
              <br />
              <SplitReveal className="text-stroke" delay={0.1}>credentials.</SplitReveal>
            </h2>
          </div>
          
          <div className="lg:col-span-5 relative p-0 h-96 lg:h-auto">
            {/* Whale image */}
            <div data-reveal className="absolute inset-0 pointer-events-none">
              <img
                src="/images/whale.png"
                alt="Organic whale"
                className="w-full h-full object-contain object-center"
              />
            </div>

          </div>
        </div>

        {/* Pricing cards - Horizontal layout with overlap */}
        <div className="relative">
          <div className="grid lg:grid-cols-3 gap-4 lg:gap-0">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                data-reveal
                className={`relative bg-background border ${
                  plan.highlight
                    ? "border-foreground lg:-mx-2 lg:z-10 lg:scale-105"
                    : "border-foreground/10 lg:first:-mr-2 lg:last:-ml-2"
                }`}
              >
                {/* Popular badge */}
                {plan.highlight && (
                  <div className="absolute -top-4 left-8 right-8 flex justify-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-mono uppercase tracking-widest">
                      <Zap className="w-3 h-3" />
                      Flagship
                    </span>
                  </div>
                )}

                <div className="p-8 lg:p-10">
                  {/* Plan header */}
                  <div className="mb-8 pb-8 border-b border-foreground/10">
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-2xl lg:text-3xl font-display mt-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </div>

                  {/* Credential count */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl lg:text-6xl font-display">
                        {isAnnual ? plan.price.annual : plan.price.monthly}
                      </span>
                      <span className="text-muted-foreground text-sm">credential{plan.price.monthly > 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      verifiable badges
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-10">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#eca8d6] mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <a
                    href={plan.verify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                      plan.highlight
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note with icons */}
        <div data-reveal className="mt-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pt-12 border-t border-foreground/10">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Credly verified
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Coursera verified
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Continuously learning
            </span>
          </div>
          <a href="https://www.coursera.org/account/accomplishments/specialization/A569L1FT9TZH" target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-4 hover:text-foreground transition-colors">
            Compare all credentials
          </a>
        </div>
      </div>

      <style jsx>{`
        .text-stroke {
          -webkit-text-stroke: 1.5px currentColor;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </section>
  );
}
