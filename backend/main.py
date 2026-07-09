"""FastAPI entrypoint."""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_indexes, backfill_counts
from .routers import (
    auth_router,
    user_router,
    repo_router,
    blog_router,
    quiz_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure indexes exist; backfill denormalized counts on older docs.
    init_indexes()
    backfill_counts()
    yield


app = FastAPI(title="Quizzlerz", lifespan=lifespan)

# CORS: comma-separated origins in FRONTEND_ORIGINS, plus the Vite dev origins.
# Examples:
#   FRONTEND_ORIGINS="https://quizzlerz.vercel.app,https://quizzlerz-staging.vercel.app"
_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
_allowed = [
    o.strip()
    for o in os.environ.get("FRONTEND_ORIGINS", _default_origins).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(repo_router)
app.include_router(blog_router)
app.include_router(quiz_router)


@app.get("/")
def root():
    return {"app": "quizzlerz", "ok": True}