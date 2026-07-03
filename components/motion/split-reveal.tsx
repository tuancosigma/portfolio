"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

interface SplitRevealProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /** Extra delay (s) before the stagger starts once in view. */
  delay?: number;
}

/**
 * Word-level masked text reveal. Server-renders the plain string (SEO
 * intact); after mount each word is wrapped in an overflow-hidden mask and
 * slid up with a stagger the first time it scrolls into view.
 */
export function SplitReveal({ children, className, as: Tag = "span", delay = 0 }: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [split, setSplit] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setSplit(true);
  }, []);

  useEffect(() => {
    if (!split || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-word]",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.06,
          delay,
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [split, delay]);

  const words = children.split(" ");

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className}>
      {split
        ? words.map((word, i) => (
            <span key={i}>
              {/* Mask holds only the word; the space lives outside so it never collapses. */}
              <span className="inline-block overflow-hidden align-bottom">
                <span data-word className="inline-block will-change-transform">
                  {word}
                </span>
              </span>
              {i < words.length - 1 ? " " : ""}
            </span>
          ))
        : children}
    </Tag>
  );
}
