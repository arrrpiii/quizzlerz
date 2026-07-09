export default function Loading({ text = "Loading…" }) {
  return (
    <div className="loading-state">
      <span className="loading-text">{text}</span>
    </div>
  );
}
