import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";
import MotionContainer from "../components/MotionContainer";
import TagPicker from "../components/TagPicker";
import { errorMessage } from "../errors";
import { stagger } from "../motion";

export default function NewRepo() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [docs, setDocs] = useState([{ name: "", content: "" }]);
  const [err, setErr] = useState("");

  function setDoc(i, patch) {
    setDocs(docs.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  }
  function addDocRow() { setDocs([...docs, { name: "", content: "" }]); }
  function removeDocRow(i) { setDocs(docs.filter((_, idx) => idx !== i)); }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await api.post("/posts/repos", {
        title: title.trim(),
        description,
        tags,
      });
      for (const d of docs) {
        if (!d.name.trim()) continue;
        await api.post(`/posts/repos/${data.id}/files`, { name: d.name.trim(), content: d.content });
      }
      nav(`/repo/${data.id}`);
    } catch (e) {
      setErr(errorMessage(e, "failed"));
    }
  }

  return (
    <MotionContainer style={{ maxWidth: 720 }}>
      <h1>New repo</h1>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="form-row">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="form-row">
          <label>Tags</label>
          <TagPicker value={tags} onChange={setTags} />
        </div>

        <h3>Documentaries</h3>
        <AnimatePresence initial={false}>
          {docs.map((d, i) => (
            <motion.div className="card hoverable" key={i}
              initial={{ opacity: 0, y: 8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={stagger(i)}>
              <div className="form-row">
                <label>Name</label>
                <input value={d.name} onChange={(e) => setDoc(i, { name: e.target.value })} placeholder="e.g. Chapter 1" />
              </div>
              <div className="form-row">
                <label>Content</label>
                <textarea value={d.content} onChange={(e) => setDoc(i, { content: e.target.value })}
                          rows={8}
                          placeholder="e.g. notes, definitions, references, study material…" />
              </div>
              {docs.length > 1 && <button type="button" className="btn-ghost" onClick={() => removeDocRow(i)}>Remove</button>}
            </motion.div>
          ))}
        </AnimatePresence>
        <button type="button" className="btn-ghost" onClick={addDocRow}>+ Add documentary</button>
        <div className="mt-1">
          <button type="submit">Create repo</button>
        </div>
        {err && <div className="form-error">{err}</div>}
      </form>
    </MotionContainer>
  );
}