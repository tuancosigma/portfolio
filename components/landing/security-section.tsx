"use client";

import { useEffect, useState, useRef } from "react";
import { Shield, Lock, Eye, FileCheck } from "lucide-react";
import { useSectionReveal } from "@/components/motion/use-section-reveal";

const securityFeatures = [
  {
    icon: Lock,
    title: "Brute-force login triage",
    description: "Repeated failed authentication or unusual source pattern.",
    image: "/images/isolated.jpg",
  },
  {
    icon: Shield,
    title: "WAF web attack review",
    description: "XSS, SQLi, upload bypass, or high-frequency suspicious requests.",
    image: "/images/encrypted.jpg",
  },
  {
    icon: Eye,
    title: "Firewall log investigation",
    description: "Denied traffic spikes, unusual port access, exposed services.",
    image: "/images/audit.jpg",
  },
  {
    icon: FileCheck,
    title: "Monitoring gap review",
    description: "Dashboard blind spots, missing alert context, noisy rules.",
    image: "/images/permissions.jpg",
  },
];

const certifications = ["CCNA", "CyberOps", "SSCP", "Ethical Hacker"];

export function SecuritySection() {
  const [activeFeature, setActiveFeature] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  useSectionReveal(sectionRef);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % securityFeatures.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="security" ref={sectionRef} className="relative py-32 lg:py-40 overflow-hidden">
      {/* Background accent removed */}
      
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-20">
          <span data-reveal className="inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8">
            <span className="w-12 h-px bg-foreground/20" />
            Playbooks
          </span>

          {/* Title — full width */}
          <h2 data-reveal className="text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] mb-12">
            Signal,
            <br />
            <span className="text-muted-foreground">not noise.</span>
          </h2>

          {/* Description — below title */}
          <div data-reveal>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Repeatable playbooks turn raw alerts into evidence-backed decisions — tested in lab environments before they matter in production.
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Large visual card */}
          <div data-reveal className="lg:col-span-7 relative p-8 lg:p-12 border border-foreground/10 min-h-[400px] overflow-hidden">
            {/* Static shield emblem behind the rotating feature images */}
            <img
              src="/images/shield.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute -right-10 -bottom-10 w-2/3 max-w-[420px] object-contain opacity-[0.07] pointer-events-none select-none"
            />
            {/* Dynamic feature image with cross-fade — desktop only */}
            <div className="absolute inset-0 pointer-events-none items-center justify-end hidden lg:flex">
              {securityFeatures.map((feature, index) => (
                <img
                  key={feature.image}
                  src={feature.image}
                  alt={feature.title}
                  className="absolute h-3/4 w-3/4 object-contain object-right transition-opacity duration-500"
                  style={{ opacity: activeFeature === index ? 0.85 : 0 }}
                />
              ))}
            </div>
            
            <div className="relative z-10">
              <span className="font-mono text-sm text-muted-foreground">Analyst workflow</span>
              <div className="mt-8">
                <span className="text-7xl lg:text-8xl font-display">4</span>
                <span className="block text-muted-foreground mt-2">Playbooks documented</span>
              </div>
            </div>
            
            {/* Certification badges */}
            <div className="absolute bottom-8 left-8 right-8 flex flex-wrap gap-2">
              {certifications.map((cert, index) => (
                <span
                  key={cert}
                  data-reveal
                  className="px-3 py-1 border border-foreground/10 text-xs font-mono text-muted-foreground"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* Feature cards stack */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {securityFeatures.map((feature, index) => (
              <div
                key={feature.title}
                data-reveal
                className={`p-6 border transition-colors duration-500 cursor-default ${
                  activeFeature === index
                    ? "border-foreground/30 bg-foreground/[0.04]"
                    : "border-foreground/10"
                }`}
                onClick={() => setActiveFeature(index)}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 w-10 h-10 flex items-center justify-center border transition-colors ${
                    activeFeature === index 
                      ? "border-foreground bg-foreground text-background" 
                      : "border-foreground/20"
                  }`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
