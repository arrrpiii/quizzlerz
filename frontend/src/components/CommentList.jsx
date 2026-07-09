import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";
import { errorMessage } from "../errors";

export default function CommentList({ kind, id, comments, onAdded }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(null); // optimistic single comment

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!text.trim()) return;
    try {
      const { data } = await api.post(`/posts/${kind}/${id}/comments`, { text: text.trim() });
      setPending(data);
      setText("");
      onAdded?.(data);
      // Clear the optimistic copy once the parent has reloaded (next render).
      // We use rAF so the new comments prop has time to arrive first.
      requestAnimationFrame(() => setPending(null));
    } catch (e) {
      if (e.response?.status === 401) window.location.href = "/login";
      setErr(errorMessage(e, "failed"));
    }
  }

  // Dedupe by id so the optimistic + server-reloaded copy don't both render.
  const seen = new Set();
  const all = [];
  for (const c of [...comments, ...(pending ? [pending] : [])]) {
    const key = c.id || c._id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    all.push(c);
  }

  return (
    <div>
      <h3>Comments ({all.length})</h3>
      {all.length === 0 && <p className="muted">No comments yet.</p>}
      <AnimatePresence initial={false}>
        {all.map((c) => (
          <motion.div
            className="comment"
            key={c.id || c._id}
            initial={{ opacity: 0, x: -12, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="who">@{c.username} · {new Date(c.created_at).toLocaleString()}</div>
            <div>{c.text}</div>
          </motion.div>
        ))}
      </AnimatePresence>
      <form className="comment-form" onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="add a comment" />
        <button type="submit">Post</button>
      </form>
      {err && <div className="form-error">{err}</div>}
    </div>
  );
}