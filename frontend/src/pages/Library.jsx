import { useEffect, useState } from "react";
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

  async function load() {
    try {
      const { data } = await api.get(`/me/library/${tab}`);
      if (tab === "following") {
        setUsers(data);
        setItems([]);
      } else {
        setItems(data);
        setUsers([]);
      }
    } catch { setItems([]); setUsers([]); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  return (
    <MotionContainer>
      <h1>My Library</h1>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <AnimatePresence mode="wait">
        {tab === "following" ? (
          <motion.div key="following"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}>
            {users.length === 0
              ? <p className="muted">You aren't following anyone yet.</p>
              : users.map((u, i) => (
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
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}>
            {items.length === 0 && <p className="muted">Nothing here yet.</p>}
            {items.map((p, i) => <PostCard key={p.id} kind={tab} post={p} index={i} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionContainer>
  );
}