"""FastAPI entrypoint."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_indexes
from .routers import (
    auth_router,
    user_router,
    repo_router,
    blog_router,
    quiz_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_indexes()
    yield


app = FastAPI(title="Quizzlerz", lifespan=lifespan)

# CORS for the Vite dev server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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