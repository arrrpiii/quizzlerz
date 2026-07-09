"""Repo routes: feed, create, detail, delete, like, dislike, comment, file add/del, save toggle."""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from ..db import repos, users
from ..auth import get_current_user
from ..serialize import serialize_repo
from ..models import RepoIn, CommentIn, FileIn, RepoUpdateIn
from ..tags import clean_tags

router = APIRouter(tags=["repos"])

def _enrich(post: dict, me_id: ObjectId | None) -> dict:
    out = serialize_repo(post)
    u = users().find_one({"_id": post["author_id"]}, {"username": 1})
    out["author_username"] = u["username"] if u else ""
    out["liked_by_me"]    = bool(me_id and me_id in post.get("likes", []))
    out["disliked_by_me"] = bool(me_id and me_id in post.get("dislikes", []))
    out["saved_by_me"]    = False  # overwritten below
    return out

def _attach_saved(out: dict, me_id: ObjectId | None, post: dict):
    if not me_id:
        return
    me = users().find_one({"_id": me_id}, {"saved_repos": 1})
    if me:
        out["saved_by_me"] = post["_id"] in me.get("saved_repos", [])

@router.get("/posts/repos")
def feed(
    sort: str = Query("recent", pattern="^(recent|likes)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    tags: str = Query("", description="comma-separated tags; match ANY"),
    me=Depends(get_current_user),
):
    me_id = me["_id"]
    q = {}
    if tags.strip():
        wanted = [t.strip().lower() for t in tags.split(",") if t.strip()]
        if wanted:
            q["tags"] = {"$in": wanted}
    sort_field = "created_at" if sort == "recent" else "likes_count"
    docs = list(repos().find(q).sort(sort_field, -1).skip((page - 1) * limit).limit(limit))
    out = []
    for d in docs:
        item = _enrich(d, me_id)
        _attach_saved(item, me_id, d)
        out.append(item)
    return out

@router.post("/posts/repos", status_code=201)
def create(body: RepoIn, me: dict = Depends(get_current_user)):
    doc = {
        "author_id": me["_id"],
        "title": body.title,
        "description": body.description,
        "tags": clean_tags(body.tags),
        "files": [],
        "likes": [], "dislikes": [], "comments": [],
        "likes_count": 0, "dislikes_count": 0,
        "created_at": datetime.now(timezone.utc),
    }
    res = repos().insert_one(doc)
    doc["_id"] = res.inserted_id
    return _enrich(doc, me["_id"])

@router.patch("/posts/repos/{rid}")
def update(rid: str, body: RepoUpdateIn, me: dict = Depends(get_current_user)):
    try: oid = ObjectId(rid)
    except Exception: raise HTTPException(400, "bad id")
    d = repos().find_one({"_id": oid})
    if not d: raise HTTPException(404, "not found")
    if d["author_id"] != me["_id"]: raise HTTPException(403, "not owner")
    # Only update fields that were actually sent (Pydantic leaves None for absent ones).
    update_doc = {k: v for k, v in body.model_dump().items() if v is not None}
    if "tags" in update_doc:
        update_doc["tags"] = clean_tags(update_doc["tags"])
    if update_doc:
        repos().update_one({"_id": oid}, {"$set": update_doc})
        d.update(update_doc)
    return _enrich(d, me["_id"])

@router.get("/posts/repos/{rid}")
def detail(rid: str, me=Depends(get_current_user)):
    try:
        oid = ObjectId(rid)
    except Exception:
        raise HTTPException(400, "bad id")
    d = repos().find_one({"_id": oid})
    if not d:
        raise HTTPException(404, "not found")
    out = _enrich(d, me["_id"])
    _attach_saved(out, me["_id"], d)
    return out

@router.delete("/posts/repos/{rid}")
def delete(rid: str, me: dict = Depends(get_current_user)):
    try: oid = ObjectId(rid)
    except Exception: raise HTTPException(400, "bad id")
    d = repos().find_one({"_id": oid})
    if not d: raise HTTPException(404, "not found")
    if d["author_id"] != me["_id"]: raise HTTPException(403, "not owner")
    repos().delete_one({"_id": oid})
    return {"ok": True}

@router.post("/posts/repos/{rid}/like")
def toggle_like(rid: str, me: dict = Depends(get_current_user)):
    try: oid = ObjectId(rid)
    except Exception: raise HTTPException(400, "bad id")
    me_id = me["_id"]
    d = repos().find_one({"_id": oid}, {"likes": 1, "dislikes": 1})
    if not d: raise HTTPException(404, "not found")
    if me_id in d.get("likes", []):
        repos().update_one({"_id": oid}, {"$pull": {"likes": me_id}, "$inc": {"likes_count": -1}})
        return {"liked": False, "likes_count": len(d["likes"]) - 1}
    was_disliked = me_id in d.get("dislikes", [])
    update = {"$pull": {"dislikes": me_id}, "$addToSet": {"likes": me_id}, "$inc": {"likes_count": 1}}
    if was_disliked:
        update["$inc"]["dislikes_count"] = -1
    repos().update_one({"_id": oid}, update)
    likes = repos().find_one({"_id": oid}, {"likes": 1})["likes"]
    return {"liked": True, "likes_count": len(likes)}

@router.post("/posts/repos/{rid}/dislike")
def toggle_dislike(rid: str, me: dict = Depends(get_current_user)):
    try: oid = ObjectId(rid)
    except Exception: raise HTTPException(400, "bad id")
    me_id = me["_id"]
    d = repos().find_one({"_id": oid}, {"dislikes": 1})
    if not d: raise HTTPException(404, "not found")
    if me_id in d.get("dislikes", []):
        repos().update_one({"_id": oid}, {"$pull": {"dislikes": me_id}})
        return {"disliked": False, "dislikes_count": len(d["dislikes"]) - 1}
    repos().update_one({"_id": oid}, {"$pull": {"likes": me_id}, "$addToSet": {"dislikes": me_id}})
    dislikes = repos().find_one({"_id": oid}, {"dislikes": 1})["dislikes"]
    return {"disliked": True, "dislikes_count": len(dislikes)}

@router.post("/posts/repos/{rid}/comments", status_code=201)
def add_comment(rid: str, body: CommentIn, me: dict = Depends(get_current_user)):
    try: oid = ObjectId(rid)
    except Exception: raise HTTPException(400, "bad id")
    if not repos().find_one({"_id": oid}, {"_id": 1}):
        raise HTTPException(404, "not found")
    c = {
        "_id": ObjectId(),
        "user_id": me["_id"],
        "username": me["username"],
        "text": body.text,
        "created_at": datetime.now(timezone.utc),
    }
    repos().update_one({"_id": oid}, {"$push": {"comments": c}})
    return {
        "id": str(c["_id"]),
        "user_id": str(c["user_id"]),
        "username": c["username"],
        "text": c["text"],
        "created_at": c["created_at"].isoformat(),
    }

# ---------- repo-only: file add/delete + save toggle ----------

@router.post("/posts/repos/{rid}/files", status_code=201)
def add_file(rid: str, body: FileIn, me: dict = Depends(get_current_user)):
    try: oid = ObjectId(rid)
    except Exception: raise HTTPException(400, "bad id")
    d = repos().find_one({"_id": oid})
    if not d: raise HTTPException(404, "not found")
    if d["author_id"] != me["_id"]: raise HTTPException(403, "not owner")
    if any(f["name"] == body.name for f in d.get("files", [])):
        raise HTTPException(400, "file with that name exists")
    repos().update_one({"_id": oid}, {"$push": {"files": {"name": body.name, "content": body.content}}})
    return {"ok": True, "name": body.name}

@router.delete("/posts/repos/{rid}/files/{name}")
def delete_file(rid: str, name: str, me: dict = Depends(get_current_user)):
    try: oid = ObjectId(rid)
    except Exception: raise HTTPException(400, "bad id")
    d = repos().find_one({"_id": oid})
    if not d: raise HTTPException(404, "not found")
    if d["author_id"] != me["_id"]: raise HTTPException(403, "not owner")
    repos().update_one({"_id": oid}, {"$pull": {"files": {"name": name}}})
    return {"ok": True}

@router.post("/posts/repos/{rid}/save")
def toggle_save(rid: str, me: dict = Depends(get_current_user)):
    try: oid = ObjectId(rid)
    except Exception: raise HTTPException(400, "bad id")
    if not repos().find_one({"_id": oid}, {"_id": 1}):
        raise HTTPException(404, "not found")
    me_id = me["_id"]
    saved = users().find_one({"_id": me_id}, {"saved_repos": 1}).get("saved_repos", [])
    if oid in saved:
        users().update_one({"_id": me_id}, {"$pull": {"saved_repos": oid}})
        return {"saved": False}
    users().update_one({"_id": me_id}, {"$addToSet": {"saved_repos": oid}})
    return {"saved": True}