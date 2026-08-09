"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function MotionReveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root,
        start: "top 84%",
        once: true,
        onEnter: () => {
          const stages = root.querySelectorAll<HTMLElement>("[data-motion-stage]");
          const controls = root.querySelectorAll<HTMLElement>("[data-motion-control]");
          const routes = root.querySelectorAll<HTMLElement>("[data-motion-route]");
          const lines = root.querySelectorAll<HTMLElement>("[data-motion-line]");
          const timeline = gsap.timeline({ delay: delay / 1000, defaults: { ease: "power3.out" } });

          timeline.fromTo(root, { y: 14, opacity: 0.72 }, { y: 0, opacity: 1, duration: 0.9 });
          if (stages.length) timeline.fromTo(stages, { y: 18, opacity: 0.58 }, { y: 0, opacity: 1, duration: 0.85, stagger: 0.13 }, "-=0.55");
          if (controls.length) timeline.fromTo(controls, { scale: 0.985, opacity: 0.72 }, { scale: 1, opacity: 1, duration: 1 }, "-=0.65");
          if (lines.length) timeline.fromTo(lines, { scaleX: 0.2, transformOrigin: "left center", opacity: 0.45 }, { scaleX: 1, opacity: 1, duration: 0.95, stagger: 0.12 }, "-=0.75");
          if (routes.length) timeline.fromTo(routes, { x: -14, opacity: 0.62 }, { x: 0, opacity: 1, duration: 0.8, stagger: 0.16 }, "-=0.7");
        },
      });
    }, root);

    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      window.cancelAnimationFrame(refreshFrame);
      context.revert();
    };
  }, [delay]);

  return <div ref={ref} className={className}>{children}</div>;
}
