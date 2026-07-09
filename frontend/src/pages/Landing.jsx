import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { fadeUp, stagger } from "../motion";

// Slide variants for the carousel. `dir` (1 forward, -1 backward) is forwarded via
// `custom` so the row enters from the right and exits to the left when going
// forward, and vice versa when going back.
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0.45 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0.45 }),
};

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
  const n = SAMPLES.length;
  const [idx, setIdx] = useState(0);
  // 1 = forward (next card enters from the right), -1 = backward.
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const t = setInterval(() => {
      setDir(1);
      setIdx((i) => (i + 1) % n);
    }, 2000);
    return () => clearInterval(t);
  }, [n]);

  function go(delta) {
    setDir(delta > 0 ? 1 : -1);
    setIdx((i) => (i + delta + n) % n);
  }
  function goTo(target) {
    // Pick the shortest rotation around the cycle.
    setDir(((target - idx + n) % n) <= n / 2 ? 1 : -1);
    setIdx(target);
  }

  return (
    <div className="carousel">
      <div className="carousel-stage">
        <button
          type="button"
          className="carousel-arrow carousel-arrow-left"
          onClick={() => go(-1)}
          aria-label="Previous sample"
        >←</button>

        <div className="carousel-viewport">
          {/* mode="wait" — only one card is in the DOM at a time, so no
              stacking concerns. Single-card slide is straightforward. */}
          <AnimatePresence custom={dir} initial={false} mode="wait">
            <motion.div
              key={idx}
              className="carousel-card"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <SampleCard s={SAMPLES[idx]} />
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="button"
          className="carousel-arrow carousel-arrow-right"
          onClick={() => go(1)}
          aria-label="Next sample"
        >→</button>
      </div>

      <div className="carousel-dots">
        {Array.from({ length: n }).map((_, i) => (
          <button
            key={i}
            type="button"
            className={"carousel-dot" + (i === idx ? " active" : "")}
            onClick={() => goTo(i)}
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