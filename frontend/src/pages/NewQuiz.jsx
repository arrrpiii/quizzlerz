import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";
import MotionContainer from "../components/MotionContainer";
import TagPicker from "../components/TagPicker";
import { errorMessage } from "../errors";
import { stagger } from "../motion";

function blankQ() {
  return { q: "", options: ["", "", "", ""], correct_index: 0, marks: 1 };
}

export default function NewQuiz() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [questions, setQuestions] = useState([blankQ()]);
  const [err, setErr] = useState("");

  function setQ(i, patch) {
    setQuestions(questions.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  }
  function setOpt(qi, oi, value) {
    const q = questions[qi];
    const options = q.options.map((o, idx) => idx === oi ? value : o);
    setQ(qi, { options });
  }
  function addQ() { setQuestions([...questions, blankQ()]); }
  function removeQ(i) { setQuestions(questions.filter((_, idx) => idx !== i)); }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const payload = {
        title: title.trim(),
        description,
        tags,
        questions: questions.map((q) => ({
          q: q.q.trim(),
          options: q.options.map((o) => o.trim()).filter((o) => o),
          correct_index: q.correct_index,
          marks: Math.max(1, parseInt(q.marks, 10) || 1),
        })),
      };
      const { data } = await api.post("/posts/quizzes", payload);
      nav(`/quiz/${data.id}`);
    } catch (e) {
      setErr(errorMessage(e, "failed"));
    }
  }

  return (
    <MotionContainer style={{ maxWidth: 720 }}>
      <h1>New quiz</h1>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="form-row">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="form-row">
          <label>Tags</label>
          <TagPicker value={tags} onChange={setTags} />
        </div>

        <h3>Questions</h3>
        <AnimatePresence initial={false}>
          {questions.map((q, qi) => (
            <motion.div className="card hoverable" key={qi}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={stagger(qi)}
              layout>
              <div className="form-row row" style={{ alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label>Question {qi + 1}</label>
                  <input value={q.q} onChange={(e) => setQ(qi, { q: e.target.value })} />
                </div>
                <div style={{ width: 110 }}>
                  <label>Marks</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={q.marks}
                    onChange={(e) => setQ(qi, { marks: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  />
                </div>
              </div>
              {q.options.map((opt, oi) => (
                <div className="form-row row" key={oi}>
                  <input
                    value={opt}
                    onChange={(e) => setOpt(qi, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                  />
                  <label className="row" style={{ width: "auto", whiteSpace: "nowrap" }}>
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correct_index === oi}
                      onChange={() => setQ(qi, { correct_index: oi })}
                      style={{ width: "auto" }}
                    />
                    correct
                  </label>
                </div>
              ))}
              {questions.length > 1 && (
                <button type="button" className="btn-ghost" onClick={() => removeQ(qi)}>Remove question</button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="row" style={{ justifyContent: "space-between", marginTop: "0.5rem" }}>
          <button type="button" className="btn-ghost" onClick={addQ}>+ Add question</button>
          <span className="muted">
            Total marks: {questions.reduce((s, q) => s + (parseInt(q.marks, 10) || 1), 0)}
          </span>
        </div>
        <div className="mt-1">
          <button type="submit">Publish quiz</button>
        </div>
        {err && <div className="form-error">{err}</div>}
      </form>
    </MotionContainer>
  );
}