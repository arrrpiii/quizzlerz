import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../auth.jsx";
import api from "../api";
import TabBar from "../components/TabBar";
import PostCard from "../components/PostCard";
import MotionContainer from "../components/MotionContainer";
import { fadeUp } from "../motion";
import { PREDEFINED_TAGS } from "../tags";

const TABS = [
  { key: "repos", label: "Repos" },
  { key: "blogs", label: "Blogs" },
  { key: "quizzes", label: "Quizzes" },
];

export default function Home() {
  const { user } = useAuth();
  const [kind, setKind] = useState("repos");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const supportsTags = kind !== "blogs";

  async function load() {
    setLoading(true);
    setItems([]); // clear immediately so the previous tab's cards don't show while we fetch
    try {
      const params = { sort, page, limit: 10 };
      if (supportsTags && selectedTags.length) {
        params.tags = selectedTags.join(",");
      }
      const { data } = await api.get(`/posts/${kind}`, { params });
      setItems(data);
    } catch (e) {
      // ignore — auth flow handles 401
    } finally {
      setLoading(false);
    }
  }

  // Close filter dropdown on outside click.
  useEffect(() => {
    if (!filterOpen) return;
    function onDoc(e) { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [filterOpen]);

  useEffect(() => {
    if (kind === "blogs" && selectedTags.length) setSelectedTags([]);
    setPage(1);
    // eslint-disable-next-line
  }, [kind]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [kind, sort, page, selectedTags.join(",")]);

  function toggleTag(t) {
    setPage(1);
    setSelectedTags((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t]);
  }

  return (
    <MotionContainer>
      <motion.div className="greeting" {...fadeUp}>
        Welcome back, {user.username}!
      </motion.div>
      <TabBar tabs={TABS} active={kind} onChange={(k) => { setKind(k); setPage(1); }} />
      <div className="feed-controls">
        {supportsTags ? (
          <div className="filter-dropdown" ref={filterRef}>
            <button
              type="button"
              className={"filter-trigger" + (selectedTags.length ? " active" : "")}
              onClick={() => setFilterOpen((o) => !o)}
              aria-expanded={filterOpen}
            >
              Filter by tag {selectedTags.length > 0 ? `(${selectedTags.length})` : ""}
              <span className="caret-sm" aria-hidden>{filterOpen ? "▴" : "▾"}</span>
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  className="filter-panel"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {PREDEFINED_TAGS.map((t) => (
                    <label key={t} className={"filter-option" + (selectedTags.includes(t) ? " selected" : "")}>
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(t)}
                        onChange={() => toggleTag(t)}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                  {selectedTags.length > 0 && (
                    <button type="button" className="filter-clear" onClick={() => { setSelectedTags([]); setPage(1); }}>
                      clear all
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : <span />}
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          <option value="recent">Most recent</option>
          <option value="likes">Most liked</option>
        </select>
      </div>

      {selectedTags.length > 0 && (
        <div className="active-tags-row">
          <span className="muted" style={{ fontSize: "0.8rem" }}>filtered by:</span>
          {selectedTags.map((t) => (
            <button key={t} type="button" className="tag-chip selected" onClick={() => toggleTag(t)}>
              {t} ×
            </button>
          ))}
          <button type="button" className="clear-link" onClick={() => { setSelectedTags([]); setPage(1); }}>
            clear
          </button>
        </div>
      )}

      {loading && <p className="muted">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="muted">
          {selectedTags.length
            ? `No ${kind} match the selected tags.`
            : "Nothing here yet. Be the first."}
        </p>
      )}

      <AnimatePresence>
        {items.map((p, i) => (
          <PostCard key={`${kind}-${p.id}`} kind={kind} post={p} index={i} onTagClick={toggleTag} />
        ))}
      </AnimatePresence>

      <div className="pagination">
        {page > 1
          ? <a onClick={() => setPage(page - 1)}>← prev</a>
          : <span className="disabled">← prev</span>}
        <span>page {page}</span>
        {items.length === 10
          ? <a onClick={() => setPage(page + 1)}>next →</a>
          : <span className="disabled">next →</span>}
      </div>
    </MotionContainer>
  );
}