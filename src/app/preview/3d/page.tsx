import { HeroOrb } from "@/features/portfolio/hero/HeroOrb";

export const dynamic = "force-dynamic";

export default function ThreeDPreviewPage() {
  return (
    <main className="three-d-preview">
      <header className="three-d-preview-header">
        <a href="/">Back to portfolio</a>
        <span>LOCAL DESIGN PREVIEW / 3D HERO</span>
      </header>

      <section className="three-d-preview-intro">
        <p className="eyebrow">INTERACTIVE CONCEPT / 01</p>
        <h1>Orbital <span>V</span></h1>
        <p>Lightweight CSS 3D animation for the portfolio hero. No WebGL or extra dependency.</p>
      </section>

      <section className="three-d-preview-stage" aria-label="Live 3D animation preview">
        <HeroOrb />
      </section>

      <section className="three-d-preview-reference">
        <div>
          <p className="eyebrow">STATIC REFERENCE</p>
          <h2>Generated visual direction</h2>
        </div>
        <img src="/images/hero-3d-orbit-concept.svg" alt="Glowing orbital V monogram concept" />
      </section>
    </main>
  );
}
