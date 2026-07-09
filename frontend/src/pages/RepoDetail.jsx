import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";
import { useAuth } from "../auth.jsx";
import LikeBar from "../components/LikeBar";
import CommentList from "../components/CommentList";
import MotionContainer from "../components/MotionContainer";
import TagPicker from "../components/TagPicker";
import TagsDisplay from "../components/TagsDisplay";
import BackButton from "../components/BackButton";
import { errorMessage } from "../errors";

function DocumentaryDropdown({ doc, isOwner, onDelete, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="doc-dropdown">
      <button type="button" className="doc-dropdown-header" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="caret" aria-hidden>{open ? "▾" : "▸"}</span>
        <span className="doc-dropdown-name">{doc.name}</span>
        {isOwner && (
          <span
            role="button"
            tabIndex={0}
            className="doc-dropdown-delete"
            onClick={(e) => { e.stopPropagation(); onDelete(doc.name); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onDelete(doc.name); } }}
          >
            Delete
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="doc-content">{doc.content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddDocumentaryDropdown({ onSubmit }) {
  const [open, setOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docContent, setDocContent] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!docName.trim()) { setErr("name required"); return; }
    try {
      await onSubmit({ name: docName.trim(), content: docContent });
      setDocName(""); setDocContent(""); setErr("");
      setOpen(false);
    } catch (e) {
      setErr(errorMessage(e, "failed"));
    }
  }

  return (
    <div className="doc-dropdown">
      <button type="button" className="doc-dropdown-header" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="caret" aria-hidden>{open ? "▾" : "▸"}</span>
        <span className="doc-dropdown-name">+ Add new documentary</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <form onSubmit={submit} className="add-doc-form">
              <div className="form-row">
                <label>Name</label>
                <input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. Chapter 1" autoFocus />
              </div>
              <div className="form-row">
                <label>Content</label>
                <textarea value={docContent} onChange={(e) => setDocContent(e.target.value)}
                          rows={10}
                          placeholder="e.g. notes, definitions, references, study material…" />
              </div>
              <div className="row">
                <button type="submit">Add documentary</button>
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              </div>
              {err && <div className="form-error">{err}</div>}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RepoDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [repo, setRepo] = useState(null);
  const [err, setErr] = useState("");
  const [editingTags, setEditingTags] = useState(false);
  const [savingTags, setSavingTags] = useState(false);
  const [tagsErr, setTagsErr] = useState("");
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailsDraft, setDetailsDraft] = useState({ title: "", description: "" });
  const [detailsErr, setDetailsErr] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  async function load() {
    try {
      const { data } = await api.get(`/posts/repos/${id}`);
      setRepo(data);
    } catch (e) { setErr(errorMessage(e, "not found")); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function addDocumentary({ name, content }) {
    await api.post(`/posts/repos/${id}/files`, { name, content });
    load();
  }

  async function deleteDocumentary(name) {
    if (!confirm(`Delete ${name}?`)) return;
    await api.delete(`/posts/repos/${id}/files/${encodeURIComponent(name)}`);
    load();
  }

  async function toggleSave() {
    await api.post(`/posts/repos/${id}/save`);
    load();
  }

  async function deleteRepo() {
    if (!confirm("Delete this repo?")) return;
    await api.delete(`/posts/repos/${id}`);
    nav(`/u/${user.username}`);
  }

  async function saveTags(tags) {
    setSavingTags(true);
    setTagsErr("");
    try {
      const { data } = await api.patch(`/posts/repos/${id}`, { tags });
      setRepo(data);
      setEditingTags(false);
    } catch (e) {
      setTagsErr(errorMessage(e, "failed"));
    } finally {
      setSavingTags(false);
    }
  }

  function startEditDetails() {
    setDetailsDraft({ title: repo.title, description: repo.description || "" });
    setDetailsErr("");
    setEditingDetails(true);
  }
  function cancelEditDetails() {
    setEditingDetails(false);
    setDetailsErr("");
  }
  async function saveDetails(e) {
    e.preventDefault();
    setDetailsErr("");
    setSavingDetails(true);
    try {
      const { data } = await api.patch(`/posts/repos/${id}`, {
        title: detailsDraft.title.trim(),
        description: detailsDraft.description,
      });
      setRepo(data);
      setEditingDetails(false);
    } catch (e) {
      setDetailsErr(errorMessage(e, "failed"));
    } finally {
      setSavingDetails(false);
    }
  }

  if (err) return <MotionContainer><div className="form-error">{err}</div></MotionContainer>;
  if (!repo) return <MotionContainer><p className="muted">Loading…</p></MotionContainer>;

  const isOwner = user && user.id === repo.author_id;

  return (
    <MotionContainer>
      <BackButton />
      <div className="meta">
        <Link to={`/u/${repo.author_username}`}>@{repo.author_username}</Link>
        {" · "}
        {new Date(repo.created_at).toLocaleString()}
      </div>
      {editingDetails ? (
        <form onSubmit={saveDetails} className="repo-edit-details" style={{ marginTop: "1.25rem" }}>
          <div className="form-row">
            <label>Title</label>
            <input
              value={detailsDraft.title}
              onChange={(e) => setDetailsDraft({ ...detailsDraft, title: e.target.value })}
              autoFocus
              maxLength={200}
            />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea
              value={detailsDraft.description}
              onChange={(e) => setDetailsDraft({ ...detailsDraft, description: e.target.value })}
              rows={3}
              maxLength={2000}
            />
          </div>
          <div className="row">
            <button type="submit" disabled={savingDetails}>{savingDetails ? "..." : "Save"}</button>
            <button type="button" className="btn-ghost" onClick={cancelEditDetails}>Cancel</button>
          </div>
          {detailsErr && <div className="form-error">{detailsErr}</div>}
        </form>
      ) : (
        <>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginTop: "1.25rem" }}>
            <h1 style={{ margin: 0 }}>{repo.title}</h1>
            {isOwner && (
              <button className="btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}
                      onClick={startEditDetails}>
                Edit details
              </button>
            )}
          </div>
          <p>{repo.description}</p>
        </>
      )}

      <div className="repo-tags-row">
        {editingTags ? (
          <div className="card" style={{ marginTop: "0.5rem" }}>
            <TagPicker value={repo.tags || []} onChange={(tags) => saveTags(tags)} />
            <div className="row mt-1">
              <button onClick={() => saveTags(repo.tags)} disabled={savingTags}>{savingTags ? "..." : "Save tags"}</button>
              <button className="btn-ghost" onClick={() => { setEditingTags(false); load(); }}>Cancel</button>
            </div>
            {tagsErr && <div className="form-error">{tagsErr}</div>}
          </div>
        ) : (
          <>
            <TagsDisplay tags={repo.tags || []} size="md" />
            {isOwner && (
              <button className="btn-ghost" style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }}
                      onClick={() => setEditingTags(true)}>
                Edit tags
              </button>
            )}
          </>
        )}
      </div>

      <h2 className="mt-1">Documentaries ({repo.files.length})</h2>
      {repo.files.length === 0 && <p className="muted">No documentaries yet.</p>}
      <div className="doc-list">
        {repo.files.map((d, i) => (
          <DocumentaryDropdown key={d.name} doc={d} isOwner={isOwner} onDelete={deleteDocumentary} defaultOpen={i === 0 && repo.files.length === 1} />
        ))}
        {isOwner && <AddDocumentaryDropdown onSubmit={addDocumentary} />}
      </div>

      <div className="repo-footer-actions actions-row">
        <div className="actions-left">
          <LikeBar kind="repos" id={repo.id} initialLiked={repo.liked_by_me} initialDisliked={repo.disliked_by_me}
                   likesCount={repo.likes_count} dislikesCount={repo.dislikes_count} />
        </div>
        <div className="actions-right">
          {user && !isOwner && (
            <button className={repo.saved_by_me ? "" : "btn-ghost"} onClick={toggleSave}>
              {repo.saved_by_me ? "★ Saved" : "☆ Save"}
            </button>
          )}
          {isOwner && (
            <button className="btn-ghost" onClick={deleteRepo}>Delete repo</button>
          )}
        </div>
      </div>

      <h2 className="mt-1">Comments</h2>
      <CommentList kind="repos" id={repo.id} comments={repo.comments || []} onAdded={load} />
    </MotionContainer>
  );
}