import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";
import { useAuth } from "../auth.jsx";
import TabBar from "../components/TabBar";
import PostCard from "../components/PostCard";
import FollowButton from "../components/FollowButton";
import MotionContainer from "../components/MotionContainer";
import { errorMessage } from "../errors";

const TABS = [
  { key: "repos", label: "Repos" },
  { key: "blogs", label: "Blogs" },
  { key: "quizzes", label: "Quizzes" },
];

export default function Profile() {
  const { username } = useParams();
  const { user: me, logout } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("repos");
  const [items, setItems] = useState([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [err, setErr] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [bioErr, setBioErr] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");
  const [deleting, setDeleting] = useState(false);
  const abortRef = useRef(null); // cancels stale fetches when the tab changes

  async function loadProfile() {
    try {
      const { data } = await api.get(`/users/${username}`);
      setProfile(data);
    } catch (e) { setErr(errorMessage(e, "not found")); }
  }

  async function loadPosts() {
    setItems([]); // clear immediately so the previous tab's cards don't linger
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const { data } = await api.get(`/users/${username}/posts/${tab}`, { signal: ac.signal });
      setItems(data);
    } catch (e) {
      if (e.name === "CanceledError" || e.code === "ERR_CANCELED") return;
      setItems([]);
    } finally {
      if (abortRef.current === ac) setPostsLoaded(true);
    }
  }

  useEffect(() => { loadProfile(); /* eslint-disable-next-line */ }, [username]);
  useEffect(() => { if (profile) loadPosts(); /* eslint-disable-next-line */ }, [tab, profile]);
  // Cancel any in-flight fetch when leaving the profile.
  useEffect(() => () => abortRef.current?.abort(), []);

  function startEditBio() {
    setBioDraft(profile.bio || "");
    setBioErr("");
    setEditingBio(true);
  }
  async function saveBio(e) {
    e?.preventDefault?.();
    try {
      const { data } = await api.patch("/me", { bio: bioDraft });
      // Update local user cache so Header shows the new bio too.
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      if (stored.id === data.id) {
        stored.bio = data.bio;
        localStorage.setItem("user", JSON.stringify(stored));
      }
      setProfile((p) => ({ ...p, bio: data.bio }));
      setEditingBio(false);
    } catch (e) {
      setBioErr(errorMessage(e, "failed"));
    }
  }

  async function deleteAccount() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    setDeleteErr("");
    try {
      await api.delete("/me");
      logout();           // clears token + user from localStorage + sets user=null
      nav("/", { replace: true });
    } catch (e) {
      setDeleteErr(errorMessage(e, "failed"));
      setDeleting(false);
    }
  }

  if (err) return <MotionContainer><div className="form-error">{err}</div></MotionContainer>;
  if (!profile) return <MotionContainer><p className="muted">Loading…</p></MotionContainer>;

  const isMe = me && me.username === profile.username;

  return (
    <MotionContainer>
      <div className="between">
        <h1>{profile.username}</h1>
        <div className="row">
          {isMe ? (
            <button
              className={confirmDelete ? "danger-btn" : "btn-ghost danger-ghost"}
              onClick={deleteAccount}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : confirmDelete ? "Confirm delete" : "Delete account"}
            </button>
          ) : (
            <FollowButton username={profile.username} initiallyFollowing={profile.is_following} onChange={loadProfile} />
          )}
        </div>
      </div>

      {isMe && confirmDelete && (
        <div className="card mt-1" style={{ borderColor: "var(--accent)" }}>
          <p>
            This will <strong>permanently</strong> delete your account, all your posts,
            comments, and likes. Users you follow will lose you from their followers list.
            This cannot be undone.
          </p>
          <div className="row mt-1">
            <button className="danger-btn" onClick={deleteAccount} disabled={deleting}>
              {deleting ? "Deleting…" : "Yes, delete my account"}
            </button>
            <button className="btn-ghost" onClick={() => { setConfirmDelete(false); setDeleteErr(""); }}>
              Cancel
            </button>
          </div>
          {deleteErr && <div className="form-error">{deleteErr}</div>}
        </div>
      )}

      <div className="bio-block">
        {editingBio ? (
          <form onSubmit={saveBio} className="bio-edit">
            <textarea
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Tell people about yourself"
              autoFocus
            />
            <div className="row mt-1">
              <button type="submit">Save</button>
              <button type="button" className="btn-ghost" onClick={() => setEditingBio(false)}>Cancel</button>
              <span className="muted" style={{ marginLeft: "auto" }}>{bioDraft.length}/500</span>
            </div>
            {bioErr && <div className="form-error">{bioErr}</div>}
          </form>
        ) : (
          <div className="bio-display">
            <p className={profile.bio ? "bio-text" : "muted"}>{profile.bio || "no bio yet"}</p>
            {isMe && (
              <button className="btn-ghost bio-edit-btn" onClick={startEditBio}>
                Edit bio
              </button>
            )}
          </div>
        )}
      </div>

      <div className="stats">
        <div className="stat"><div className="num">{profile.repos_count}</div><div className="label">Repos</div></div>
        <div className="stat"><div className="num">{profile.blogs_count}</div><div className="label">Blogs</div></div>
        <div className="stat"><div className="num">{profile.quizzes_count}</div><div className="label">Quizzes</div></div>
        <div className="stat"><div className="num">{profile.followers_count}</div><div className="label">Followers</div></div>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {!postsLoaded && <p className="muted">Loading…</p>}
      {postsLoaded && items.length === 0 && <p className="muted">Nothing yet.</p>}
      <AnimatePresence>
        {items.map((p, i) => <PostCard key={`${tab}-${p.id}`} kind={tab} post={p} index={i} />)}
      </AnimatePresence>
    </MotionContainer>
  );
}