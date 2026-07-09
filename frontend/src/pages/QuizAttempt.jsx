import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";
import MotionContainer from "../components/MotionContainer";
import { errorMessage } from "../errors";
import { stagger } from "../motion";

export default function QuizAttempt() {
  const { id } = useParams();
  const nav = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/posts/quizzes/${id}`).then(({ data }) => {
      if (data.is_owner || data.attempted_by_me) nav(`/quiz/${id}`);
      else setQuiz(data);
    }).catch((e) => setErr(errorMessage(e, "failed")));
  }, [id, nav]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const list = quiz.questions.map((_, i) => answers[i] ?? -1);
    if (list.some((a) => a < 0)) {
      setErr("answer every question");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/quizzes/${id}/attempt`, { answers: list });
      setResult(data);
    } catch (e) {
      setErr(errorMessage(e, "submission failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (err && !quiz) return <MotionContainer><div className="form-error">{err}</div></MotionContainer>;
  if (!quiz) return <MotionContainer><p className="muted">Loading…</p></MotionContainer>;

  if (result) {
    return (
      <MotionContainer>
        <h1>{quiz.title} — results</h1>
        <div className="stats">
          <div className="stat"><div className="num">{result.score}</div><div className="label">Score</div></div>
          <div className="stat"><div className="num">{result.total}</div><div className="label">Total</div></div>
          <div className="stat"><div className="num">{Math.round((result.score / result.total) * 100)}%</div><div className="label">Percent</div></div>
        </div>
        {result.questions.map((q, qi) => {
          const picked = result.your_answers[qi];
          const gotIt = picked === q.correct_index;
          return (
            <motion.div className="mcq" key={qi}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={stagger(qi, 0.05)}>
              <div className="question row" style={{ justifyContent: "space-between" }}>
                <span>{qi + 1}. {q.q}</span>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  {gotIt ? `+${q.marks}` : "+0"} / {q.marks} mark{q.marks === 1 ? "" : "s"}
                </span>
              </div>
              <div className="options">
                {q.options.map((opt, oi) => {
                  const isCorrect = q.correct_index === oi;
                  const wasPicked = picked === oi;
                  const classes = [
                    isCorrect && "correct",
                    wasPicked && !isCorrect && "wrong",
                    wasPicked && isCorrect && "picked-correct",
                  ].filter(Boolean).join(" ");
                  return (
                    <label key={oi} className={classes}>
                      <input type="radio" checked={wasPicked} readOnly />
                      {opt}
                      <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: "0.75rem" }}>
                        {isCorrect && "✓ correct"}
                        {wasPicked && !isCorrect && "✗ your pick"}
                        {wasPicked && isCorrect && "✓ your pick"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
        <div className="row mt-1">
          <Link to={`/quiz/${id}`}>Back to quiz</Link>
          <Link to="/library">My library</Link>
        </div>
      </MotionContainer>
    );
  }

  return (
    <MotionContainer>
      <h1>{quiz.title}</h1>
      <p className="muted">{quiz.description}</p>
      <p className="muted">Total marks: {quiz.total_marks}</p>
      <form onSubmit={submit}>
        {quiz.questions.map((q, qi) => (
          <motion.div className="mcq" key={qi}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={stagger(qi, 0.05)}>
            <div className="question row" style={{ justifyContent: "space-between" }}>
              <span>{qi + 1}. {q.q}</span>
              <span className="muted" style={{ fontSize: "0.85rem" }}>{q.marks || 1} mark{q.marks === 1 ? "" : "s"}</span>
            </div>
            <div className="options">
              {q.options.map((opt, oi) => (
                <label key={oi}>
                  <input type="radio" name={`q${qi}`} checked={answers[qi] === oi}
                         onChange={() => setAnswers({ ...answers, [qi]: oi })} />
                  {opt}
                </label>
              ))}
            </div>
          </motion.div>
        ))}
        <button type="submit" disabled={submitting}>{submitting ? "..." : "Submit"}</button>
        {err && <div className="form-error">{err}</div>}
      </form>
    </MotionContainer>
  );
}