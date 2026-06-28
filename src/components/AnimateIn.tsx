"use client";
import { useEffect, useLayoutEffect, useRef } from "react";

export function AnimateIn({ children, staggerMs = 55, className }: {
  children: React.ReactNode;
  staggerMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    Array.from(ref.current.children).forEach((el) => {
      (el as HTMLElement).style.opacity = "0";
    });
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const els = Array.from(ref.current.children) as HTMLElement[];
    if (!els.length) return;
    import("animejs").then(({ animate, stagger }) => {
      animate(els, { opacity: [0, 1], translateY: [14, 0], ease: "out(3)", duration: 360, delay: stagger(staggerMs) });
    });
  }, [staggerMs]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
