import { ArrowUpRight, Github, Link as LinkIcon, Mail, MapPin, MessageCircle } from "lucide-react";
import type { PortfolioContent } from "@/types";
import { ContactForm } from "./ContactForm";
import "./Contact.css";
import {
  Linkedin,
  Instagram,
  Twitter,
} from "lucide-react";

export function Contact({ content }: { content: PortfolioContent }) {
  const mailLink = content.contact.email ? `mailto:${content.contact.email}` : "#contact";
  return (
    <section className="contact section-shell section-block" id="contact">
      <div className="section-kicker reveal"><span></span><span>GET IN TOUCH</span><i /></div>
      <div className="contact-layout">

        <div className="contact-left">

          {/* Heading OUTSIDE the card */}
          <div className="contact-copy reveal">
            <p className="eyebrow">HAVE SOMETHING IN MIND?</p>

            <h2>
              Let’s make<br />
              something <span className="gradient-text">great.</span>
            </h2>

            <p className="contact-intro">
              Have an idea, a question, or just want to say hello? My inbox is always open.
            </p>
          </div>

          {/* Contact information INSIDE the card */}
          <div className="contact-info-card reveal">
            <div className="contact-details">

              <a
                href={mailLink}
                className="contact-detail"
              >
                <span className="contact-detail-icon">
                  <Mail size={16} />
                </span>

                <span>
                  <small>EMAIL</small>
                  <strong>{content.contact.email}</strong>
                </span>
              </a>

              <div className="contact-detail">
                <span className="contact-detail-icon">
                  <MapPin size={16} />
                </span>

                <span>
                  <small>LOCATION</small>
                  <strong>{content.contact.location}</strong>
                </span>
              </div>
              <div className="connect-social">
                <span className="connect-title">CONNECT WITH ME</span>

                <div className="social-links">
                  <a
                    href={content.contact.github.startsWith("http") ? content.contact.github : "#"}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub"
                  >
                    <Github size={14} />
                  </a>

                  <a
                    href={content.contact.linkedin.startsWith("http") ? content.contact.linkedin : "#"}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={14} />
                  </a>

                  {content.contact.instagram && (
                    <a
                      href={content.contact.instagram}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                    >
                      <Instagram size={14} />
                    </a>
                  )}

                  {content.contact.x && (
                      <a
                        href={content.contact.x}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="X"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.964 6.817H1.584l7.73-8.835L1.157 2.25H7.98l4.713 6.231 5.551-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
                        </svg>
                      </a>
                    )}
                </div>
              </div>
            </div>
          </div>

        </div>
        <div className="contact-form-card reveal">
          
          <ContactForm />
        </div>

      </div>
      <footer className="site-footer"><a className="footer-brand" href="#home"><span className="brand-mark">V</span> {content.name}</a><span>DESIGNED WITH CURIOSITY <span aria-hidden="true">♡</span></span><span>© {new Date().getFullYear()} — ALL RIGHTS RESERVED</span></footer>
    </section>
  );
}
