"use client";

import { useState, type MouseEvent } from "react";
import {
  BriefcaseBusiness,
  FolderKanban,
  GraduationCap,
  House,
  Layers,
  Mail,
  UserRound,
} from "lucide-react";

import { navigationItems } from "@/data/navigation";
import "./BottomNav.css";

const navigationIcons: Record<
  (typeof navigationItems)[number]["id"],
  typeof House
> = {
  home: House,
  about: UserRound,
  skills: Layers,
  education: GraduationCap,
  projects: FolderKanban,
  experience: BriefcaseBusiness,
  contact: Mail,
};

export function BottomNav({ active }: { active: string }) {
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const sectionItems = navigationItems.filter(
    ({ id }) => id !== "home" && id !== "contact"
  );

  const navigateToSection =
    (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      setSectionsOpen(false);

      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

  const sectionsActive = sectionItems.some(
    ({ id }) => active === id
  );

  return (
    <nav className="bottom-nav" aria-label="Main navigation">

      {/* =====================================================
          DESKTOP NAVIGATION
          ===================================================== */}

      <div className="desktop-navigation">

        {navigationItems.map(({ id, label }, index) => {
          const Icon = navigationIcons[id];

          return (
            <a
              key={id}
              className={`nav-link ${
                active === id ? "active" : ""
              }`}
              href="/"
              onClick={navigateToSection(id)}
              aria-label={label}
              aria-current={
                active === id ? "location" : undefined
              }
            >
              <span className="nav-index">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="nav-icon" aria-hidden="true">
                <Icon size={16} strokeWidth={1.8} />
              </span>

              <span className="nav-label">
                {label}
              </span>
            </a>
          );
        })}

      </div>


      {/* =====================================================
          MOBILE NAVIGATION
          ===================================================== */}

      <div className="mobile-navigation">

        {/* HOME */}

        <a
          className={`mobile-nav-button ${
            active === "home" ? "active" : ""
          }`}
          href="/"
          onClick={navigateToSection("home")}
          aria-label="Home"
          aria-current={
            active === "home" ? "location" : undefined
          }
        >
          <House
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>Home</span>
        </a>


        {/* SECTIONS */}

        <button
          className={`mobile-nav-button ${
            sectionsOpen || sectionsActive ? "active" : ""
          }`}
          type="button"
          aria-expanded={sectionsOpen}
          aria-controls="mobile-section-links"
          onClick={() => setSectionsOpen((open) => !open)}
        >
          <FolderKanban
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>Sections</span>
        </button>


        {/* CONTACT */}

        <a
          className={`mobile-nav-button ${
            active === "contact" ? "active" : ""
          }`}
          href="/"
          onClick={navigateToSection("contact")}
          aria-label="Contact"
          aria-current={
            active === "contact" ? "location" : undefined
          }
        >
          <Mail
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>Contact</span>
        </a>

      </div>


      {/* =====================================================
          MOBILE SECTIONS POPUP
          ===================================================== */}

      {sectionsOpen && (
        <div
          className="mobile-section-links"
          id="mobile-section-links"
          aria-label="Portfolio sections"
        >
          {sectionItems.map(({ id, label }) => {
            const Icon = navigationIcons[id];

            return (
              <a
                key={id}
                href="/"
                className={
                  active === id ? "active" : ""
                }
                aria-current={
                  active === id ? "location" : undefined
                }
                onClick={navigateToSection(id)}
              >
                <Icon
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <span>{label}</span>
              </a>
            );
          })}
        </div>
      )}

    </nav>
  );
}
