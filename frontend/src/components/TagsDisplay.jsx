export default function TagsDisplay({ tags, onTagClick, size = "sm" }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className={`tags-display size-${size}`}>
      {tags.map((t) => (
        onTagClick ? (
          <button key={t} type="button" className="tag-chip clickable static" onClick={() => onTagClick(t)}>
            {t}
          </button>
        ) : (
          <span key={t} className="tag-chip static">{t}</span>
        )
      ))}
    </div>
  );
}