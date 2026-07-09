import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";
import TabBar from "../components/TabBar";
import PostCard from "../components/PostCard";
import MotionContainer from "../components/MotionContainer";
import { stagger } from "../motion";

const TABS = [
  { key: "repos", label: "Repos" },
  { key: "blogs", label: "Blogs" },
  { key: "quizzes", label: "Quizzes" },
  { key: "following", label: "Following" },
];

export default function Library() {
  const [tab, setTab] = useState("repos");
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const abortRef = useRef(null); // cancels stale fetches when the tab changes

  async function load() {
    // Clear immediately so the previous tab's content doesn't linger while fetching.
    setItems([]);
    setUsers([]);
    // Abort any in-flight fetch from a previous tab so its response can't
    // race past the new one and flash the wrong tab's cards.
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const { data } = await api.get(`/me/library/${tab}`, { signal: ac.signal });
      if (tab === "following") {
        setUsers(data);
      } else {
        setItems(data);
      }
    } catch (e) {
      if (e.name === "CanceledError" || e.code === "ERR_CANCELED") return;
      /* leave cleared */
    } finally {
      // Only mark loaded when this fetch was the most recent one.
      if (abortRef.current === ac) setLoaded(true);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  // Cancel any in-flight fetch when leaving Library.
  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <MotionContainer>
      <h1>My Library</h1>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <AnimatePresence mode="wait" initial={false}>
        {tab === "following" ? (
          <motion.div key="following"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}>
            {!loaded && <p className="muted">Loading…</p>}
            {loaded && users.length === 0 && <p className="muted">You aren't following anyone yet.</p>}
            {loaded && users.length > 0 && users.map((u, i) => (
              <motion.div className="card hoverable" key={u.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={stagger(i)}
                whileHover={{ y: -2 }}>
                <div className="between">
                  <Link to={`/u/${u.username}`} style={{ borderBottom: "none" }}>
                    <strong>@{u.username}</strong>
                  </Link>
                  <span className="muted">{u.followers_count} followers · {u.following_count} following</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}>
            {!loaded && <p className="muted">Loading…</p>}
            {loaded && items.length === 0 && <p className="muted">Nothing here yet.</p>}
            {items.map((p, i) => <PostCard key={p.id} kind={tab} post={p} index={i} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionContainer>
  );
}