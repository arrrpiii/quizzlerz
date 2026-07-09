import { useState } from "react";
import { PREDEFINED_TAGS, normalizeTag, cleanTags } from "../tags";

export default function TagPicker({ value = [], onChange }) {
  const [draft, setDraft] = useState("");
  const tags = cleanTags(value);
  const selected = new Set(tags);
  const suggested = PREDEFINED_TAGS.filter((t) => !selected.has(t));

  function add(raw) {
    const n = normalizeTag(raw);
    if (!n || selected.has(n) || n.length > 30) return;
    onChange([...tags, n]);
    setDraft("");
  }
  function remove(t) {
    onChange(tags.filter((x) => x !== t));
  }
  function onKey(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && tags.length) {
      remove(tags[tags.length - 1]);
    }
  }

  return (
    <div className="tag-picker">
      <div className="tag-picker-selected">
        {tags.length === 0 && <span className="muted" style={{ fontSize: "0.85rem" }}>no tags yet</span>}
        {tags.map((t) => (
          <span key={t} className="tag-chip selected">
            {t}
            <button type="button" className="tag-remove" onClick={() => remove(t)} aria-label={`Remove ${t}`}>×</button>
          </span>
        ))}
        <input
          className="tag-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder={tags.length ? "add another…" : "add tag (press enter)"}
        />
      </div>
      {suggested.length > 0 && (
        <div className="tag-suggestions">
          <span className="muted" style={{ fontSize: "0.8rem", marginRight: "0.4rem" }}>suggested:</span>
          {suggested.map((t) => (
            <button key={t} type="button" className="tag-chip clickable" onClick={() => add(t)}>
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}