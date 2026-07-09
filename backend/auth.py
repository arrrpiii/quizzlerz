"""Password hashing + JWT issuance/verification + auth dependency."""
import os
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from fastapi import Header, HTTPException, status
from bson import ObjectId
from .db import users

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
JWT_TTL_DAYS = 7

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_TTL_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token")

def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """FastAPI dependency. Reads Authorization: Bearer <token>."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing token")
    uid = decode_token(authorization[7:])
    user = users().find_one({"_id": ObjectId(uid)})
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user not found")
    return user

def try_current_user(authorization: str | None = Header(default=None)) -> dict | None:
    """Optional variant — returns the user dict or None for unauthenticated/invalid tokens.
    Use on endpoints that should behave differently when logged in but stay public otherwise."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        uid = decode_token(authorization[7:])
    except HTTPException:
        return None
    return users().find_one({"_id": ObjectId(uid)})

def public_user(user: dict) -> dict:
    """Strip sensitive fields before sending to client."""
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user.get("email", ""),
        "bio": user.get("bio", ""),
        "followers_count": len(user.get("followers", [])),
        "following_count": len(user.get("following", [])),
        "saved_repos_count": len(user.get("saved_repos", [])),
    }