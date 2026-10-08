export function SectionIntro({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="content-section-intro">
      <span>{step}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
