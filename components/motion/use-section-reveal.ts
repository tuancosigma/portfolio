"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Unified scroll-in reveal: every child carrying [data-reveal] inside the
 * container fades and rises with a stagger the first time the section
 * enters the viewport. Elements keep their final (static) Tailwind styles;
 * GSAP owns the transition, so no conditional classes are needed.
 */
export function useSectionReveal(
  ref: RefObject<HTMLElement | null>,
  options?: { stagger?: number; y?: number; start?: string }
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = el.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { y: options?.y ?? 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: options?.stagger ?? 0.08,
          scrollTrigger: {
            trigger: el,
            start: options?.start ?? "top 80%",
            once: true,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [ref, options?.stagger, options?.y, options?.start]);
}
