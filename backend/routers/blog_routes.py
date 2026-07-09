"""Blog routes: feed, create, detail, delete, like, dislike, comment."""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from ..db import blogs, users
from ..auth import get_current_user
from ..serialize import serialize_blog
from ..models import BlogIn, BlogUpdateIn, CommentIn

router = APIRouter(tags=["blogs"])


def _enrich(post: dict, me_id):
    out = serialize_blog(post)
    u = users().find_one({"_id": post["author_id"]}, {"username": 1})
    out["author_username"] = u["username"] if u else ""
    out["liked_by_me"]    = bool(me_id and me_id in post.get("likes", []))
    out["disliked_by_me"] = bool(me_id and me_id in post.get("dislikes", []))
    return out


@router.get("/posts/blogs")
def feed(sort: str = Query("recent", pattern="^(recent|likes)$"),
         page: int = Query(1, ge=1),
         limit: int = Query(10, ge=1, le=50),
         me=Depends(get_current_user)):
    me_id = me["_id"]
    docs = list(blogs().find().sort(sort, -1).skip((page - 1) * limit).limit(limit))
    return [_enrich(d, me_id) for d in docs]


@router.post("/posts/blogs", status_code=201)
def create(body: BlogIn, me: dict = Depends(get_current_user)):
    doc = {
        "author_id": me["_id"],
        "title": body.title,
        "content": body.content,
        "likes": [], "dislikes": [], "comments": [],
        "created_at": datetime.now(timezone.utc),
    }
    res = blogs().insert_one(doc)
    doc["_id"] = res.inserted_id
    return _enrich(doc, me["_id"])


@router.get("/posts/blogs/{bid}")
def detail(bid: str, me=Depends(get_current_user)):
    try:
        oid = ObjectId(bid)
    except Exception:
        raise HTTPException(400, "bad id")
    d = blogs().find_one({"_id": oid})
    if not d:
        raise HTTPException(404, "not found")
    return _enrich(d, me["_id"])


@router.delete("/posts/blogs/{bid}")
def delete(bid: str, me: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(bid)
    except Exception:
        raise HTTPException(400, "bad id")
    d = blogs().find_one({"_id": oid})
    if not d:
        raise HTTPException(404, "not found")
    if d["author_id"] != me["_id"]:
        raise HTTPException(403, "not owner")
    blogs().delete_one({"_id": oid})
    return {"ok": True}

@router.patch("/posts/blogs/{bid}")
def update(bid: str, body: BlogUpdateIn, me: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(bid)
    except Exception:
        raise HTTPException(400, "bad id")
    d = blogs().find_one({"_id": oid})
    if not d:
        raise HTTPException(404, "not found")
    if d["author_id"] != me["_id"]:
        raise HTTPException(403, "not owner")
    update_doc = {k: v for k, v in body.model_dump().items() if v is not None}
    if update_doc:
        blogs().update_one({"_id": oid}, {"$set": update_doc})
        d.update(update_doc)
    return _enrich(d, me["_id"])


@router.post("/posts/blogs/{bid}/like")
def toggle_like(bid: str, me: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(bid)
    except Exception:
        raise HTTPException(400, "bad id")
    me_id = me["_id"]
    d = blogs().find_one({"_id": oid}, {"likes": 1, "dislikes": 1})
    if not d:
        raise HTTPException(404, "not found")
    if me_id in d.get("likes", []):
        blogs().update_one({"_id": oid}, {"$pull": {"likes": me_id}})
        return {"liked": False, "likes_count": len(d["likes"]) - 1}
    blogs().update_one({"_id": oid}, {"$pull": {"dislikes": me_id}, "$addToSet": {"likes": me_id}})
    likes = blogs().find_one({"_id": oid}, {"likes": 1})["likes"]
    return {"liked": True, "likes_count": len(likes)}


@router.post("/posts/blogs/{bid}/dislike")
def toggle_dislike(bid: str, me: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(bid)
    except Exception:
        raise HTTPException(400, "bad id")
    me_id = me["_id"]
    d = blogs().find_one({"_id": oid}, {"dislikes": 1})
    if not d:
        raise HTTPException(404, "not found")
    if me_id in d.get("dislikes", []):
        blogs().update_one({"_id": oid}, {"$pull": {"dislikes": me_id}})
        return {"disliked": False, "dislikes_count": len(d["dislikes"]) - 1}
    blogs().update_one({"_id": oid}, {"$pull": {"likes": me_id}, "$addToSet": {"dislikes": me_id}})
    dislikes = blogs().find_one({"_id": oid}, {"dislikes": 1})["dislikes"]
    return {"disliked": True, "dislikes_count": len(dislikes)}


@router.post("/posts/blogs/{bid}/comments", status_code=201)
def add_comment(bid: str, body: CommentIn, me: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(bid)
    except Exception:
        raise HTTPException(400, "bad id")
    if not blogs().find_one({"_id": oid}, {"_id": 1}):
        raise HTTPException(404, "not found")
    c = {
        "_id": ObjectId(),
        "user_id": me["_id"],
        "username": me["username"],
        "text": body.text,
        "created_at": datetime.now(timezone.utc),
    }
    blogs().update_one({"_id": oid}, {"$push": {"comments": c}})
    return {
        "id": str(c["_id"]),
        "user_id": str(c["user_id"]),
        "username": c["username"],
        "text": c["text"],
        "created_at": c["created_at"].isoformat(),
    }