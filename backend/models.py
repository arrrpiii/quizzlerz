"""Pydantic request/response schemas. Kept narrow — only fields the API accepts."""
from pydantic import BaseModel, Field, EmailStr

class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    email: str
    password: str = Field(min_length=6, max_length=128)

class LoginIn(BaseModel):
    login: str       # username or email
    password: str

class AuthOut(BaseModel):
    token: str
    user: dict

class CommentIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)

class BioIn(BaseModel):
    bio: str = Field(default="", max_length=500)

class FileIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    content: str = Field(max_length=200_000)

class RepoIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    tags: list[str] = Field(default_factory=list, max_length=20)

class BlogIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=50_000)

class BlogUpdateIn(BaseModel):
    # All optional for PATCH semantics — only fields present are updated.
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1, max_length=50_000)

class QuestionIn(BaseModel):
    q: str = Field(min_length=1, max_length=1000)
    options: list[str] = Field(min_length=2, max_length=6)
    correct_index: int = Field(ge=0)
    marks: int = Field(default=1, ge=1, le=100)

class QuizIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    questions: list[QuestionIn] = Field(min_length=1, max_length=100)
    tags: list[str] = Field(default_factory=list, max_length=20)

class TagsIn(BaseModel):
    tags: list[str] = Field(min_length=1, max_length=20)

class RepoUpdateIn(BaseModel):
    # All fields optional — only fields present in the body are updated.
    # Empty string is allowed for description (clears it).
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    tags: list[str] | None = Field(default=None, max_length=20)

class AttemptIn(BaseModel):
    answers: list[int]  # selected option index per question