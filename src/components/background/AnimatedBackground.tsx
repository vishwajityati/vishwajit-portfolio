export function AnimatedBackground() {
  return (
    <div className="site-backdrop" aria-hidden="true">
      <div className="backdrop-grid" />
      <div className="backdrop-glow glow-one" />
      <div className="backdrop-glow glow-two" />
      <div className="backdrop-glow glow-three" />
      <div className="backdrop-orbit orbit-one"><span /></div>
      <div className="backdrop-orbit orbit-two"><span /></div>
    </div>
  );
}
