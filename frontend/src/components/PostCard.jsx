import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import TagsDisplay from "./TagsDisplay";
import { fadeUp, cardHover, stagger } from "../motion";

const PATHS = { repos: "repo", blogs: "blog", quizzes: "quiz" };
const KIND_LABEL = { repos: "REPO", blogs: "BLOG", quizzes: "QUIZ" };
const KIND_CLASS = { repos: "badge-repo", blogs: "badge-blog", quizzes: "badge-quiz" };

export default function PostCard({ kind, post, index = 0, onTagClick }) {
  if (!post) return null;
  const path = PATHS[kind];
  const counts = [];
  if (kind === "repos") counts.push(`${post.files?.length || 0} documentaries`);
  if (kind === "quizzes") counts.push(`${post.questions?.length || 0} Q`, `avg ${post.avg_score ?? 0}/${post.questions?.length || 0}`);
  counts.push(`♥ ${post.likes_count ?? 0}`, `💬 ${post.comments_count ?? 0}`);

  return (
    <motion.div
      className="card hoverable"
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      transition={stagger(index)}
      whileHover={cardHover.whileHover}
      whileTap={cardHover.whileTap}
    >
      <div className="meta">
        <span className={`badge ${KIND_CLASS[kind]}`}>{KIND_LABEL[kind]}</span>
        {" · "}
        <Link to={`/u/${post.author_username}`}>@{post.author_username}</Link>
        {" · "}
        {new Date(post.created_at).toLocaleDateString()}
      </div>
      <Link to={`/${path}/${post.id}`} style={{ borderBottom: "none" }}>
        <div className="title">{post.title}</div>
      </Link>
      {kind === "blogs" && (
        <p style={{ margin: "0.4rem 0", whiteSpace: "pre-wrap" }}>
          {(post.content || "").slice(0, 240)}
          {(post.content || "").length > 240 ? "…" : ""}
        </p>
      )}
      {kind === "repos" && <p className="muted" style={{ margin: "0.3rem 0" }}>{post.description}</p>}
      {kind === "quizzes" && <p className="muted" style={{ margin: "0.3rem 0" }}>{post.description}</p>}
      {post.tags && post.tags.length > 0 && (
        <TagsDisplay tags={post.tags} onTagClick={onTagClick} size="sm" />
      )}
      <div className="muted">{counts.join(" · ")}</div>
    </motion.div>
  );
}