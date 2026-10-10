
import { useEffect, useRef } from "react";
import "./AnimatedBackground.css";

export function AnimatedBackground() {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = backdropRef.current;
    if (!element) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) return;

    let frame = 0;
    let x = 50;
    let y = 40;
    let targetX = 50;
    let targetY = 40;

    const onMove = (event: MouseEvent) => {
      targetX = (event.clientX / window.innerWidth) * 100;
      targetY = (event.clientY / window.innerHeight) * 100;

      if (!frame) frame = requestAnimationFrame(update);
    };

    const update = () => {
      x += (targetX - x) * 0.045;
      y += (targetY - y) * 0.045;

      element.style.setProperty("--mx", `${x}%`);
      element.style.setProperty("--my", `${y}%`);

      if (
        Math.abs(targetX - x) > 0.05 ||
        Math.abs(targetY - y) > 0.05
      ) {
        frame = requestAnimationFrame(update);
      } else {
        frame = 0;
      }
    };

    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

    if (supportsFinePointer) {
      window.addEventListener("mousemove", onMove, {
        passive: true,
      });
    }

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={backdropRef}
      className="portfolio-backdrop"
      aria-hidden="true"
    >
      <div className="ambient ambient-teal" />
      <div className="ambient ambient-purple" />
      <div className="ambient ambient-blue" />

      <div className="light-streak light-streak-top" />
      <div className="light-streak light-streak-bottom" />

      <div className="mouse-light" />

      <div className="space-particles">
        {Array.from({ length: 24 }, (_, i) => (
          <span
            key={i}
            className={`space-particle particle-${i % 3}`}
            style={{
              left: `${(i * 41 + 12) % 100}%`,
              top: `${(i * 59 + 8) % 100}%`,
              animationDelay: `${-(i % 7) * 0.8}s`,
            }}
          />
        ))}
      </div>
      <div className="backdrop-vignette" />
    </div>
  );
}
