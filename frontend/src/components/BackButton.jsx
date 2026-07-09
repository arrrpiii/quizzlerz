import { useNavigate } from "react-router-dom";

// Small "← Back" button that calls history.back() if there's a previous entry,
// otherwise falls back to going home.
export default function BackButton({ fallback = "/" }) {
  const nav = useNavigate();
  function go() {
    if (window.history.length > 1) nav(-1);
    else nav(fallback);
  }
  return (
    <button type="button" className="btn-ghost back-btn" onClick={go}>
      ← Back
    </button>
  );
}