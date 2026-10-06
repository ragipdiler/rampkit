"use client";
import { useEffect, useRef, type ReactNode } from "react";

export function StickyHeader({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let compact = false;
    let pending = 0;
    const update = () => {
      pending = 0;
      const next = compact ? window.scrollY > 24 : window.scrollY > 48;
      if (next !== compact) {
        compact = next;
        if (frame.current) frame.current.dataset.compact = String(compact);
      }
    };
    const onScroll = () => {
      if (!pending) pending = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(pending);
    };
  }, []);
  return (
    <div className="site-header-frame" data-compact="false" ref={frame}>
      {children}
    </div>
  );
}
