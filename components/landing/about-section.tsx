"use client";

import { useRef } from "react";
import { GraduationCap } from "lucide-react";
import { SplitReveal } from "@/components/motion/split-reveal";
import { useSectionReveal } from "@/components/motion/use-section-reveal";

const coursework = [
  "Network Security",
  "System Hardening",
  "Operating System Security",
  "Web Security",
  "Digital Forensics",
  "Database Security",
  "Vulnerability Assessment",
];

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  useSectionReveal(sectionRef);

  return (
    <section id="about" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          {/* Left: objective */}
          <div className="lg:col-span-7">
            <span data-reveal className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-12 h-px bg-foreground/30" />
              About
            </span>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[0.95] mb-8">
              <SplitReveal>Career</SplitReveal>
              <br />
              <SplitReveal className="text-muted-foreground" delay={0.1}>objective.</SplitReveal>
            </h2>

            <p data-reveal className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              SOC/Blue Team candidate with hands-on experience in SIEM monitoring, alert triage,
              firewall/WAF configuration, and log-driven investigation. I am seeking a SOC Tier 1
              role where I can reduce alert noise, document evidence clearly, and support incident
              response workflows.
            </p>
          </div>

          {/* Right: education card */}
          <div data-reveal className="lg:col-span-5">
            <div className="p-8 lg:p-10 border border-foreground/10 bg-foreground/[0.02]">
              <div className="flex items-start gap-4 mb-8">
                <div className="shrink-0 w-12 h-12 flex items-center justify-center border border-foreground/20">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display">FPT University</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Information Assurance · 2021–2025
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-4">
                Core coursework
              </span>
              <div className="flex flex-wrap gap-2">
                {coursework.map((course) => (
                  <span
                    key={course}
                    data-reveal
                    className="px-3 py-1.5 border border-foreground/10 text-sm text-muted-foreground"
                  >
                    {course}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
