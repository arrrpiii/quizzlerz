# Quizzlerz

A quizzer-focused social site — build knowledge repos, write about your competitions, take each other's MCQ quizzes. Three post kinds (repo / blog / quiz), follows, a personal library, and per-question scoring with revealed answers after a single attempt.

## Ideation

Quizzlerz is for people who compete. Most quiz platforms only let you take tests; Quizzlerz also lets you **write the test, share your knowledge, and document what you learned**.

Three post kinds:
- **Repos** — curated text documentaries of knowledge in a domain. Add / remove files, like, save to your library.
- **Blogs** — long-form: a competition you gave, a strategy that worked, a question that broke you.
- **Quizzes** — MCQ tests on any topic. One attempt per user; correct answers are revealed after submit. Average and high score tracked across all attempts.

Around those, profiles are public with post counts and followers; the personal library tab aggregates saved repos, liked/disliked blogs, attempted quizzes, and followed users.

The visual language is intentionally manuscript-styled — parchment, sepia ink, illuminated-red accents, gold rule dividers — to lean into the "scholarly quizzer" tone.

## Tech stack

- **Frontend** — React 18 + Vite + plain CSS + `react-router-dom` + `axios` + `framer-motion`
- **Backend** — FastAPI + `pymongo` (sync) + `PyJWT` + `bcrypt`
- **Database** — MongoDB
- **Auth** — JWT (HS256, 7-day expiry)
- **Transport** — Vite dev-server proxies `/api/*` → FastAPI on port 8000

No CSS framework, no UI library, no auth-as-a-service — just the listed dependencies. The whole frontend is plain CSS in one file.

## Project layout

```
backend/
  main.py             FastAPI app + CORS + lifespan
  db.py               Mongo connection + collection getters + index init
  auth.py             JWT issue/verify, bcrypt, get_current_user dependency
  models.py           Pydantic request schemas
  serialize.py        Shared post -> JSON serializer (hides quiz correct_index)
  tags.py             Predefined tag list + tag normalization
  routers/
    auth_routes.py        /auth/register, /auth/login
    user_routes.py        /users/:u, /users/:u/posts/:kind, follow, /me, /me, /me/library/:s, DELETE /me
    repo_routes.py        /posts/repos* + file add/delete + save toggle + PATCH tags
    blog_routes.py        /posts/blogs* + PATCH for editing
    quiz_routes.py        /posts/quizzes* + attempt + PATCH tags
  requirements.txt
frontend/
  index.html, vite.config.js, package.json
  src/
    main.jsx
    App.jsx              Routes + auth gate
    api.js               axios instance with auth interceptor
    auth.jsx             AuthContext + login/register/logout
    motion.js            Shared framer-motion variants
    errors.js            axios error -> human-readable string(s)
    tags.js              PREDEFINED_TAGS + tag helpers
    components/          Header, PostCard, LikeBar, CommentList, FollowButton,
                         TabBar, TagPicker, TagsDisplay, BackButton, MotionContainer
    pages/               Landing, Home, Login, Register, Profile, Library,
                         RepoDetail, BlogDetail, QuizDetail, QuizAttempt,
                         NewRepo, NewBlog, NewQuiz
    styles/global.css    Single CSS file, manuscript theme
```

## Run locally

```bash
# 1. MongoDB on default port 27017

# 2. Backend
python -m pip install -r backend/requirements.txt
uvicorn backend.main:app --port 8000 --reload

# 3. Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://127.0.0.1:8000`.