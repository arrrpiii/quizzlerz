import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "../motion";

// Ten realistic-looking sample cards across the three post kinds.
const SAMPLES = [
  { kind: "repo",   title: "Indian History — Modern Era",        meta: "@curator",     desc: "4 files · tagged education, geography",    likes: 24,  comments: 5 },
  { kind: "blog",   title: "What I learned at Quiz Nationals",   meta: "@arpit",       desc: "Three days, eight rounds, one trophy. The buzzer rounds were tighter than we'd trained for, but the GK paper was where we made our move...", likes: 142, comments: 18 },
  { kind: "quiz",   title: "World Capitals Speed Round",         meta: "@trivia-bot",  desc: "10 questions · avg score 7.4",            likes: 89,  comments: 7 },
  { kind: "repo",   title: "Quantum Physics Primer",             meta: "@phys_ed",     desc: "6 files · tagged science, education",      likes: 56,  comments: 9 },
  { kind: "quiz",   title: "AI Concepts 101",                    meta: "@ml_geek",     desc: "12 questions · avg score 8.1",            likes: 73,  comments: 11 },
  { kind: "blog",   title: "How I prepared for the IIT quiz",    meta: "@kavya",       desc: "A six-week sprint, two friends, three mock tests a week. Here's what actually moved the needle for me...", likes: 201, comments: 34 },
  { kind: "repo",   title: "European Capitals — A Field Guide",  meta: "@geo_buff",    desc: "3 files · tagged geography, education",   likes: 41,  comments: 6 },
  { kind: "quiz",   title: "Famous Painters & Their Periods",    meta: "@art_history", desc: "8 questions · avg score 5.6",             likes: 38,  comments: 4 },
  { kind: "blog",   title: "Late night quiz prep — what works",  meta: "@nightowl",    desc: "Sleep is a competitive advantage. So is one good cup of chai at 2 AM. Here's the routine that got me to state finals...", likes: 87, comments: 12 },
  { kind: "quiz",   title: "Indian Polity Crash Test",            meta: "@civics_fan",  desc: "15 questions · avg score 9.2",            likes: 64,  comments: 8 },
];

const KIND_LABEL = { repo: "REPO", blog: "BLOG", quiz: "QUIZ" };
const KIND_CLASS = { repo: "badge-repo", blog: "badge-blog", quiz: "badge-quiz" };

const STEPS = [
  {
    n: "01",
    h: "Build your library",
    p: "Curate text documentaries of knowledge — world history, current affairs, niche domains. Save the ones others share into your library.",
  },
  {
    n: "02",
    h: "Share what you learn",
    p: "Write a blog post about a competition, a strategy that worked, or a question that broke you. Help the next person skip the same mistakes.",
  },
  {
    n: "03",
    h: "Test each other",
    p: "Set quizzes on any topic. One attempt per user, your correct answers revealed after submit. Watch the average climb.",
  },
];

function SampleCard({ s }) {
  return (
    <div className="card sample-card">
      <div className="meta">
        <span className={`badge ${KIND_CLASS[s.kind]}`}>{KIND_LABEL[s.kind]}</span>
        {" · "}<span className="muted">{s.meta}</span>
      </div>
      <div className="title">{s.title}</div>
      <p style={{ margin: "0.4rem 0", whiteSpace: "pre-wrap" }}>{s.desc}</p>
      <div className="muted">♥ {s.likes} · 💬 {s.comments}</div>
    </div>
  );
}

function Carousel() {
  const VISIBLE = 3;
  // Duplicate the first VISIBLE slides at the end so the wrap-around is seamless.
  // When idx reaches the last (duplicate) position, the visible window looks identical
  // to position 0, so we can snap translateX back without a visible jump.
  const slides = [...SAMPLES, ...SAMPLES.slice(0, VISIBLE)];
  const UNIQUE_POS = SAMPLES.length - VISIBLE; // 7 distinct starting positions
  const stepPct = 100 / VISIBLE; // each step shifts by exactly one card width
  const [idx, setIdx] = useState(0);
  const [animMs, setAnimMs] = useState(450);

  function wrap() {
    // Instant snap back to start so the loop is invisible.
    setAnimMs(0);
    setTimeout(() => setAnimMs(450), 80);
    return 0;
  }

  function advance() {
    setIdx((i) => {
      const next = i + 1;
      if (next >= slides.length) return wrap();
      return next;
    });
  }

  function go(delta) {
    setIdx((i) => {
      let next = i + delta;
      if (next < 0) {
        // Stepping back past the start: snap to the last duplicate window.
        setAnimMs(0);
        setTimeout(() => setAnimMs(450), 80);
        return slides.length - 1;
      }
      if (next >= slides.length) return wrap();
      return next;
    });
  }

  useEffect(() => {
    const t = setInterval(advance, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  // For the dot row we expose only the 8 unique logical positions (0..UNIQUE_POS).
  const dotIdx = idx % (UNIQUE_POS + 1);

  return (
    <div className="carousel">
      <button
        type="button"
        className="carousel-arrow carousel-arrow-left"
        onClick={() => go(-1)}
        aria-label="Previous sample"
      >
        ←
      </button>

      <div className="carousel-viewport">
        <motion.div
          className="carousel-track"
          animate={{ x: `-${idx * stepPct}%` }}
          transition={{ duration: animMs / 1000, ease: "easeInOut" }}
        >
          {slides.map((s, i) => (
            <div className="carousel-slide" key={i}>
              <SampleCard s={s} />
            </div>
          ))}
        </motion.div>
      </div>

      <button
        type="button"
        className="carousel-arrow carousel-arrow-right"
        onClick={() => go(1)}
        aria-label="Next sample"
      >
        →
      </button>

      <div className="carousel-dots">
        {Array.from({ length: UNIQUE_POS + 1 }).map((_, i) => (
          <button
            key={i}
            type="button"
            className={"carousel-dot" + (i === dotIdx ? " active" : "")}
            onClick={() => { setIdx(i); setAnimMs(450); }}
            aria-label={`Go to sample ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div>
      {/* ─── Hero ─── */}
      <motion.section className="landing-hero"
        initial={fadeUp.initial} animate={fadeUp.animate} transition={fadeUp.transition}>
        <motion.h1
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}>
          Quizzlerz
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}>
          A home for people who compete. Build knowledge repos, write about your competitions, and test each other with MCQs.
        </motion.p>
        <motion.div className="row" style={{ justifyContent: "center" }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}>
          <Link to="/register" className="btn" style={{ borderBottom: "none" }}>Register</Link>
          <Link to="/login" className="btn btn-ghost" style={{ borderBottom: "none" }}>Login</Link>
        </motion.div>
      </motion.section>

      {/* ─── Three features ─── */}
      <div className="container">
        <h2 className="section-title">Three things you can post here</h2>
        <div className="landing-features">
          {[
            { h: "Repos", p: "Curate text documentaries of knowledge in a domain. Share, save to your library, get feedback from the community." },
            { h: "Blogs", p: "Write about a competition you gave, a strategy that worked, a question that broke you. Share the experience." },
            { h: "Quizzes", p: "Set MCQ tests. Track average and highest score across everyone who attempted. Get it right, learn from the wrong ones." },
          ].map((f, i) => (
            <motion.div className="landing-feature" key={f.h}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={stagger(i, 0.1)}
              whileHover={{ y: -3 }}>
              <div className="feature-num">{String(i + 1).padStart(2, "0")}</div>
              <h3>{f.h}</h3>
              <p>{f.p}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Sample preview carousel ─── */}
      <div className="container">
        <h2 className="section-title">What it looks like</h2>
        <Carousel />
      </div>

      {/* ─── How it works (3 steps) ─── */}
      <div className="container">
        <h2 className="section-title">How it works</h2>
        <div className="landing-steps">
          {STEPS.map((s, i) => (
            <motion.div className="step-card" key={s.n}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={stagger(i, 0.12)}
              whileHover={{ y: -3 }}>
              <div className="step-num">{s.n}</div>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Personal library callout ─── */}
      <div className="container">
        <motion.div className="landing-callout"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}>
          <div>
            <h3>Your personal library</h3>
            <p>Save repos, like/dislike blogs, follow quizzlers, track quizzes you've attempted. Everything in one place, on the My Library tab.</p>
          </div>
          <Link to="/register" className="btn" style={{ borderBottom: "none" }}>Get started</Link>
        </motion.div>
      </div>

      {/* ─── Final CTA ─── */}
      <motion.section className="landing-cta"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <h2>Ready to get sharper?</h2>
        <p>Join other quizzlers. Build a personal library. Get sharper.</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link to="/register" className="btn" style={{ borderBottom: "none" }}>Register</Link>
          <Link to="/login" className="btn btn-ghost" style={{ borderBottom: "none" }}>Login</Link>
        </div>
      </motion.section>
    </div>
  );
}