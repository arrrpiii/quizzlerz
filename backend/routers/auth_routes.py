"""Auth router: register + login."""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError

from ..db import users
from ..models import RegisterIn, LoginIn
from ..auth import hash_password, verify_password, make_token, public_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=201)
def register(body: RegisterIn):
    doc = {
        "username": body.username,
        "email": body.email,
        "password_hash": hash_password(body.password),
        "bio": "",
        "followers": [],
        "following": [],
        "saved_repos": [],
        "created_at": datetime.now(timezone.utc),
    }
    try:
        res = users().insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(400, "username or email already taken")
    doc["_id"] = res.inserted_id
    return {"token": make_token(str(res.inserted_id)), "user": public_user(doc)}


@router.post("/login")
def login(body: LoginIn):
    user = users().find_one({"$or": [{"username": body.login}, {"email": body.login}]})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid credentials")
    return {"token": make_token(str(user["_id"])), "user": public_user(user)}