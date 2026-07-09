"""User routes: profile + follow toggle + personal library queries."""
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from ..db import users, repos, blogs, quizzes
from ..auth import get_current_user, try_current_user, public_user
from ..models import BioIn
from ..serialize import serialize_many, serialize_quiz

router = APIRouter(tags=["users"])

def _user_by_username(username: str) -> dict:
    u = users().find_one({"username": username})
    if not u:
        raise HTTPException(404, "user not found")
    return u

@router.get("/users/{username}")
def get_profile(username: str, me: dict | None = Depends(try_current_user)):
    u = _user_by_username(username)
    uid = u["_id"]
    pub = public_user(u)
    pub.update({
        "repos_count":   repos().count_documents({"author_id": uid}),
        "blogs_count":   blogs().count_documents({"author_id": uid}),
        "quizzes_count": quizzes().count_documents({"author_id": uid}),
        "is_following":  bool(me and uid in (me.get("following") or [])),
    })
    return pub

@router.get("/users/{username}/posts/{kind}")
def list_user_posts(username: str, kind: str):
    if kind not in ("repos", "blogs", "quizzes"):
        raise HTTPException(400, "invalid kind")
    u = _user_by_username(username)
    coll = {"repos": repos, "blogs": blogs, "quizzes": quizzes}[kind]()
    docs = list(coll.find({"author_id": u["_id"]}).sort("created_at", -1))
    return serialize_many(docs, kind)

@router.post("/users/{username}/follow")
def toggle_follow(username: str, me: dict = Depends(get_current_user)):
    if username == me["username"]:
        raise HTTPException(400, "cannot follow yourself")
    target = _user_by_username(username)
    me_id, them_id = me["_id"], target["_id"]

    if them_id in me.get("following", []):
        users().update_one({"_id": me_id}, {"$pull": {"following": them_id}})
        users().update_one({"_id": them_id}, {"$pull": {"followers": me_id}})
        return {"following": False}
    users().update_one({"_id": me_id}, {"$addToSet": {"following": them_id}})
    users().update_one({"_id": them_id}, {"$addToSet": {"followers": me_id}})
    return {"following": True}

# ---------- personal library ----------

@router.get("/me")
def me(me: dict = Depends(get_current_user)):
    return public_user(me)

@router.patch("/me")
def update_me(body: BioIn, me: dict = Depends(get_current_user)):
    users().update_one({"_id": me["_id"]}, {"$set": {"bio": body.bio}})
    me["bio"] = body.bio
    return public_user(me)


@router.delete("/me")
def delete_me(me: dict = Depends(get_current_user)):
    """Permanently delete the current user, their posts, comments, likes/dislikes,
    and remove them from each followed user's followers list (which lowers those
    users' followers_count by one)."""
    me_id = me["_id"]
    followed_ids = me.get("following", []) or []

    # 1. Pull me from each followed user's followers list (lowers their followers_count).
    if followed_ids:
        users().update_many(
            {"_id": {"$in": followed_ids}},
            {"$pull": {"followers": me_id}},
        )

    # 2. Clean up references to me on other users' posts.
    #    - Remove my likes/dislikes from every post.
    #    - Strip my comments from every post.
    for coll in (repos(), blogs(), quizzes()):
        coll.update_many({}, {"$pull": {"likes": me_id, "dislikes": me_id}})
        coll.update_many(
            {"comments.user_id": me_id},
            {"$pull": {"comments": {"user_id": me_id}}},
        )

    # 3. Delete my own posts.
    repos().delete_many({"author_id": me_id})
    blogs().delete_many({"author_id": me_id})
    quizzes().delete_many({"author_id": me_id})

    # 4. Delete the user doc itself.
    users().delete_one({"_id": me_id})

    return {"ok": True}

@router.get("/me/library/{section}")
def my_library(section: str, me: dict = Depends(get_current_user)):
    me_id = me["_id"]
    if section == "repos":
        ids = me.get("saved_repos", [])
        docs = list(repos().find({"_id": {"$in": ids}}))
        return serialize_many(docs, "repos")
    if section == "blogs":
        docs = list(blogs().find({"$or": [
            {"likes": me_id}, {"dislikes": me_id}
        ]}).sort("created_at", -1))
        return serialize_many(docs, "blogs")
    if section == "quizzes":
        docs = list(quizzes().find({"attempts.user_id": me_id}).sort("created_at", -1))
        if not docs:
            return []
        usernames = {
            u["_id"]: u.get("username", "")
            for u in users().find({"_id": {"$in": [d["author_id"] for d in docs]}}, {"username": 1})
        }
        result = []
        for d in docs:
            my_attempt = next((a for a in d.get("attempts", []) if a["user_id"] == me_id), None)
            summary = serialize_quiz(d, reveal_correct=False)
            summary["my_score"] = my_attempt["score"] if my_attempt else None
            summary["my_total"] = my_attempt["total"] if my_attempt else None
            summary["author_username"] = usernames.get(d["author_id"], "")
            result.append(summary)
        return result
    if section == "following":
        ids = me.get("following", [])
        users_cur = list(users().find({"_id": {"$in": ids}}))
        return [public_user(u) for u in users_cur]
    raise HTTPException(400, "invalid section")