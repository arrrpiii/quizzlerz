import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import MotionContainer from "../components/MotionContainer";
import { errorMessage } from "../errors";

export default function NewBlog() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await api.post("/posts/blogs", { title: title.trim(), content });
      nav(`/blog/${data.id}`);
    } catch (e) {
      setErr(errorMessage(e, "failed"));
    }
  }

  return (
    <MotionContainer style={{ maxWidth: 720 }}>
      <h1>New blog</h1>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="form-row">
          <label>Content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={15} />
        </div>
        <button type="submit">Publish</button>
        {err && <div className="form-error">{err}</div>}
      </form>
    </MotionContainer>
  );
}