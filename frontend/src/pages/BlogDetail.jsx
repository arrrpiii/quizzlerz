import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth.jsx";
import LikeBar from "../components/LikeBar";
import CommentList from "../components/CommentList";
import MotionContainer from "../components/MotionContainer";
import BackButton from "../components/BackButton";
import { errorMessage } from "../errors";

export default function BlogDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [blog, setBlog] = useState(null);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [editErr, setEditErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { data } = await api.get(`/posts/blogs/${id}`);
      setBlog(data);
    } catch (e) { setErr(errorMessage(e, "not found")); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function deleteBlog() {
    if (!confirm("Delete this blog?")) return;
    await api.delete(`/posts/blogs/${id}`);
    nav(`/u/${user.username}`);
  }

  function startEdit() {
    setDraft({ title: blog.title, content: blog.content });
    setEditErr("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditErr("");
    setDraft({ title: "", content: "" });
  }

  async function saveEdit(e) {
    e.preventDefault();
    setEditErr("");
    setSaving(true);
    try {
      const { data } = await api.patch(`/posts/blogs/${id}`, {
        title: draft.title.trim(),
        content: draft.content,
      });
      setBlog(data);
      setEditing(false);
    } catch (e) {
      setEditErr(errorMessage(e, "failed"));
    } finally {
      setSaving(false);
    }
  }

  if (err) return <MotionContainer><div className="form-error">{err}</div></MotionContainer>;
  if (!blog) return <MotionContainer><p className="muted">Loading…</p></MotionContainer>;

  const isOwner = user && user.id === blog.author_id;

  return (
    <MotionContainer>
      <BackButton />
      <div className="meta">
        <Link to={`/u/${blog.author_username}`}>@{blog.author_username}</Link>
        {" · "}
        {new Date(blog.created_at).toLocaleString()}
      </div>

      {editing ? (
        <form onSubmit={saveEdit} className="blog-edit-form">
          <h1 style={{ marginTop: "1.25rem" }}>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Title"
              autoFocus
              style={{ font: "inherit", fontWeight: 700, width: "100%" }}
            />
          </h1>
          <textarea
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            rows={15}
            placeholder="Write your blog..."
            style={{ whiteSpace: "pre-wrap", minHeight: "20rem" }}
          />
          <div className="row mt-1">
            <button type="submit" disabled={saving}>{saving ? "..." : "Save"}</button>
            <button type="button" className="btn-ghost" onClick={cancelEdit}>Cancel</button>
          </div>
          {editErr && <div className="form-error">{editErr}</div>}
        </form>
      ) : (
        <>
          <h1 style={{ marginTop: "1.25rem" }}>{blog.title}</h1>
          <p style={{ whiteSpace: "pre-wrap" }}>{blog.content}</p>
        </>
      )}

      <div className="actions-row">
        <div className="actions-left">
          <LikeBar kind="blogs" id={blog.id} initialLiked={blog.liked_by_me} initialDisliked={blog.disliked_by_me}
                   likesCount={blog.likes_count} dislikesCount={blog.dislikes_count} />
        </div>
        {isOwner && !editing && (
          <div className="actions-right">
            <button className="btn-ghost" onClick={startEdit}>Edit</button>
            <button className="btn-ghost" onClick={deleteBlog}>Delete</button>
          </div>
        )}
      </div>

      <h2 className="mt-1">Comments</h2>
      <CommentList kind="blogs" id={blog.id} comments={blog.comments || []} onAdded={load} />
    </MotionContainer>
  );
}