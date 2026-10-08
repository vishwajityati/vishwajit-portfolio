"use client";

import { useEffect, useState } from "react";
import { navigationItems } from "@/data/navigation";

export function useActiveSection() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-38% 0px -45% 0px", threshold: [0.05, 0.2, 0.5] });

    navigationItems.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  return active;
}
