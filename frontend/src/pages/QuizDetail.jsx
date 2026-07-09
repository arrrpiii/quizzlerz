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

function QuestionsDropdown({ quiz, isOwner }) {
  const [open, setOpen] = useState(false);
  const correct = quiz.my_score ?? 0;
  const total = quiz.my_total ?? quiz.questions?.length ?? 0;

  return (
    <div className="doc-dropdown" style={{ marginTop: "1rem" }}>
      <button
        type="button"
        className="doc-dropdown-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="caret" aria-hidden>{open ? "▾" : "▸"}</span>
        <span className="doc-dropdown-name">
          View questions
          {!isOwner && quiz.attempted_by_me && <> · your score {correct}/{total}</>}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="qs"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0.5rem 1rem 1.1rem" }}>
              {quiz.questions.map((q, qi) => {
                const picked = q.your_answer;
                const gotIt = picked === q.correct_index;
                const marks = q.marks ?? 1;
                return (
                  <div className="mcq" key={qi}>
                    <div className="question row" style={{ justifyContent: "space-between" }}>
                      <span>{qi + 1}. {q.q}</span>
                      <span className="muted" style={{ fontSize: "0.85rem" }}>
                        {gotIt ? `+${marks}` : "+0"} / {marks} mark{marks === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="options">
                      {q.options.map((opt, oi) => {
                        const isCorrect = q.correct_index === oi;
                        const hasYourAnswer = picked !== undefined && picked !== null;
                        const wasPicked = hasYourAnswer && picked === oi;
                        // Always green if correct. Red if user picked wrong. Solid green if user picked right.
                        // Works even if your_answer is missing (older attempts): we just show correct in green.
                        const classes = [
                          isCorrect && (wasPicked ? "picked-correct" : "correct"),
                          hasYourAnswer && wasPicked && !isCorrect && "wrong",
                        ].filter(Boolean).join(" ");
                        return (
                          <label key={oi} className={classes}>
                            <input type="radio" checked={wasPicked} readOnly />
                            {opt}
                            <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: "0.75rem" }}>
                              {isCorrect && (wasPicked ? "✓ your pick" : "✓ correct")}
                              {wasPicked && !isCorrect && "✗ your pick"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function QuizDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [err, setErr] = useState("");
  const [editingTags, setEditingTags] = useState(false);
  const [savingTags, setSavingTags] = useState(false);
  const [tagsErr, setTagsErr] = useState("");

  async function load() {
    try {
      const { data } = await api.get(`/posts/quizzes/${id}`);
      setQuiz(data);
    } catch (e) { setErr(errorMessage(e, "not found")); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function deleteQuiz() {
    if (!confirm("Delete this quiz?")) return;
    await api.delete(`/posts/quizzes/${id}`);
    nav(`/u/${user.username}`);
  }

  async function saveTags(tags) {
    setSavingTags(true);
    setTagsErr("");
    try {
      const { data } = await api.patch(`/posts/quizzes/${id}`, { tags });
      setQuiz(data);
      setEditingTags(false);
    } catch (e) {
      setTagsErr(errorMessage(e, "failed"));
    } finally {
      setSavingTags(false);
    }
  }

  if (err) return <MotionContainer><div className="form-error">{err}</div></MotionContainer>;
  if (!quiz) return <MotionContainer><p className="muted">Loading…</p></MotionContainer>;

  const isOwner = user && user.id === quiz.author_id;
  const total = quiz.questions?.length || 0;

  return (
    <MotionContainer>
      <BackButton />
      <div className="meta">
        <Link to={`/u/${quiz.author_username}`}>@{quiz.author_username}</Link>
        {" · "}
        {new Date(quiz.created_at).toLocaleString()}
      </div>
      <h1 style={{ marginTop: "1.25rem" }}>{quiz.title}</h1>
      <p>{quiz.description}</p>

      <div className="repo-tags-row">
        {editingTags ? (
          <div className="card" style={{ marginTop: "0.5rem" }}>
            <TagPicker value={quiz.tags || []} onChange={(tags) => saveTags(tags)} />
            <div className="row mt-1">
              <button onClick={() => saveTags(quiz.tags)} disabled={savingTags}>{savingTags ? "..." : "Save tags"}</button>
              <button className="btn-ghost" onClick={() => { setEditingTags(false); load(); }}>Cancel</button>
            </div>
            {tagsErr && <div className="form-error">{tagsErr}</div>}
          </div>
        ) : (
          <>
            <TagsDisplay tags={quiz.tags || []} size="md" />
            {isOwner && (
              <button className="btn-ghost" style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }}
                      onClick={() => setEditingTags(true)}>
                Edit tags
              </button>
            )}
          </>
        )}
      </div>

      <div className="stats">
        <div className="stat"><div className="num">{quiz.attempts_count}</div><div className="label">Attempts</div></div>
        <div className="stat"><div className="num">{quiz.avg_score}</div><div className="label">Avg Score</div></div>
        <div className="stat"><div className="num">{quiz.high_score}</div><div className="label">High Score</div></div>
        <div className="stat"><div className="num">{total}</div><div className="label">Questions</div></div>
      </div>

      {(quiz.attempted_by_me || isOwner) && <QuestionsDropdown quiz={quiz} isOwner={isOwner} />}

      {/* Primary action row: Attempt quiz / Your quiz / Already attempted.
          Sits on its own line above the like/dislike row. */}
      <div className="actions-row" style={{ marginTop: "1rem" }}>
        {isOwner ? (
          <button className="btn-ghost" disabled>Your quiz</button>
        ) : quiz.attempted_by_me ? (
          <button className="btn-ghost" disabled>Already attempted</button>
        ) : (
          <button onClick={() => nav(`/quiz/${quiz.id}/attempt`)}>Attempt quiz</button>
        )}
        {isOwner && (
          <div className="actions-right">
            <button className="btn-ghost" onClick={deleteQuiz}>Delete</button>
          </div>
        )}
      </div>

      {/* Like / dislike on its own line below the primary action. */}
      <div style={{ marginTop: "0.6rem" }}>
        <LikeBar kind="quizzes" id={quiz.id} initialLiked={quiz.liked_by_me} initialDisliked={quiz.disliked_by_me}
                 likesCount={quiz.likes_count} dislikesCount={quiz.dislikes_count} />
      </div>

      <h2 className="mt-1">Comments</h2>
      <CommentList kind="quizzes" id={quiz.id} comments={quiz.comments || []} onAdded={load} />
    </MotionContainer>
  );
}