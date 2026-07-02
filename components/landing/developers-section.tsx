"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const features = [
  {
    title: "SWS — SOC & Security Research",
    description: "Triaged SIEM alerts and configured Barracuda/pfSense labs (Sep–Dec 2024).",
  },
  {
    title: "Cosigma — System Administrator",
    description: "Reverse proxy, Docker, Proxmox, Grafana/Loki monitoring (Feb 2026–Present).",
  },
  {
    title: "Barracuda WAF Security Lab",
    description: "DVWA behind WAF, simulated attacks, and Python SMTP alerting.",
    href: "/projects/barracuda",
  },
  {
    title: "AI Threat Detection (Capstone)",
    description: "Unsupervised ML detecting brute-force & SQLi with Wazuh + pfSense telemetry.",
    href: "/projects/ai-threat-detection",
  },
];

export function DevelopersSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="developers" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">

      {/* Image — absolute, bottom-right, behind all content */}
      <div
        className={`absolute bottom-0 right-0 w-[55%] h-[85%] pointer-events-none transition-all duration-1000 delay-300 opacity-20 ${
          isVisible ? "lg:opacity-100" : "lg:opacity-0"
        }`}
      >
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Upscaled%20Image%20%2813%29-OQ2DiR3ElVsUg8kTvTL1kC5A3Q6maM.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-left-top"
        />
        {/* Fade left edge */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        {/* Fade top edge */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-transparent" />
      </div>

      {/* All text content sits on top */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header — Full width */}
        <div
          className={`mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Experience &amp; Projects
          </span>
          <h2 className="text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9]">
            Hands-on in the SOC.
            <br />
            <span className="text-muted-foreground">And in the lab.</span>
          </h2>
        </div>

        {/* Description + Features — left half only */}
        <div
          className={`max-w-full lg:max-w-[50%] transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-md">
            I can support Tier 1 monitoring, first-pass alert validation, firewall/WAF evidence review, clear incident notes, and small Python scripts that make repetitive checks easier to repeat.
          </p>
          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const content = (
                <>
                  <h3 className="font-medium mb-1 inline-flex items-center gap-1.5">
                    {feature.title}
                    {feature.href && (
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </>
              );

              const className = `group transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              } ${feature.href ? "hover:opacity-70" : ""}`;
              const style = { transitionDelay: `${index * 50 + 200}ms` };

              return feature.href ? (
                <Link key={feature.title} href={feature.href} className={className} style={style}>
                  {content}
                </Link>
              ) : (
                <div key={feature.title} className={className} style={style}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
