"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function MotionReveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.14 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`${className} transition-[opacity,transform] duration-1000 ease-out motion-reduce:transform-none motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>{children}</div>;
}
