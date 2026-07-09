"""Quiz routes: feed, create, detail (with hidden correct answers), delete, like/dislike/comment, attempt."""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from ..db import quizzes, users
from ..auth import get_current_user
from ..serialize import serialize_quiz
from ..models import QuizIn, CommentIn, AttemptIn, TagsIn
from ..tags import clean_tags

router = APIRouter(tags=["quizzes"])


def _enrich(post, me_id):
    attempts = post.get("attempts", [])
    my_attempt = next((a for a in attempts if me_id and a["user_id"] == me_id), None)
    is_owner = bool(me_id and me_id == post.get("author_id"))
    # Author always sees the correct answers. Attempters see their saved answers too.
    out = serialize_quiz(post, reveal_correct=is_owner,
                         your_answers=my_attempt.get("answers") if my_attempt else None)
    u = users().find_one({"_id": post["author_id"]}, {"username": 1})
    out["author_username"] = u["username"] if u else ""
    out["liked_by_me"]    = bool(me_id and me_id in post.get("likes", []))
    out["disliked_by_me"] = bool(me_id and me_id in post.get("dislikes", []))
    out["attempted_by_me"] = bool(my_attempt)
    out["is_owner"] = is_owner
    if my_attempt:
        out["my_score"] = my_attempt["score"]
        out["my_total"] = my_attempt["total"]
    return out


@router.get("/posts/quizzes")
def feed(sort: str = Query("recent", pattern="^(recent|likes)$"),
         page: int = Query(1, ge=1),
         limit: int = Query(10, ge=1, le=50),
         tags: str = Query("", description="comma-separated tags; match ANY"),
         me=Depends(get_current_user)):
    me_id = me["_id"]
    q = {}
    if tags.strip():
        wanted = [t.strip().lower() for t in tags.split(",") if t.strip()]
        if wanted:
            q["tags"] = {"$in": wanted}
    sort_field = "created_at" if sort == "recent" else "likes_count"
    docs = list(quizzes().find(q).sort(sort_field, -1).skip((page - 1) * limit).limit(limit))
    return [_enrich(d, me_id) for d in docs]


@router.post("/posts/quizzes", status_code=201)
def create(body: QuizIn, me: dict = Depends(get_current_user)):
    doc = {
        "author_id": me["_id"],
        "title": body.title,
        "description": body.description,
        "questions": [q.model_dump() for q in body.questions],
        "tags": clean_tags(body.tags),
        "likes": [], "dislikes": [], "comments": [],
        "likes_count": 0, "dislikes_count": 0,
        "attempts": [],
        "created_at": datetime.now(timezone.utc),
    }
    res = quizzes().insert_one(doc)
    doc["_id"] = res.inserted_id
    return _enrich(doc, me["_id"])


@router.patch("/posts/quizzes/{qid}")
def update(qid: str, body: TagsIn, me: dict = Depends(get_current_user)):
    try: oid = ObjectId(qid)
    except Exception: raise HTTPException(400, "bad id")
    d = quizzes().find_one({"_id": oid})
    if not d: raise HTTPException(404, "not found")
    if d["author_id"] != me["_id"]: raise HTTPException(403, "not owner")
    quizzes().update_one({"_id": oid}, {"$set": {"tags": clean_tags(body.tags)}})
    d["tags"] = clean_tags(body.tags)
    return _enrich(d, me["_id"])


@router.get("/posts/quizzes/{qid}")
def detail(qid: str, me=Depends(get_current_user)):
    try:
        oid = ObjectId(qid)
    except Exception:
        raise HTTPException(400, "bad id")
    d = quizzes().find_one({"_id": oid})
    if not d:
        raise HTTPException(404, "not found")
    return _enrich(d, me["_id"])


@router.delete("/posts/quizzes/{qid}")
def delete(qid: str, me: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(qid)
    except Exception:
        raise HTTPException(400, "bad id")
    d = quizzes().find_one({"_id": oid})
    if not d:
        raise HTTPException(404, "not found")
    if d["author_id"] != me["_id"]:
        raise HTTPException(403, "not owner")
    quizzes().delete_one({"_id": oid})
    return {"ok": True}


@router.post("/posts/quizzes/{qid}/like")
def toggle_like(qid: str, me: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(qid)
    except Exception:
        raise HTTPException(400, "bad id")
    me_id = me["_id"]
    d = quizzes().find_one({"_id": oid}, {"likes": 1, "dislikes": 1})
    if not d:
        raise HTTPException(404, "not found")
    if me_id in d.get("likes", []):
        quizzes().update_one({"_id": oid}, {"$pull": {"likes": me_id}, "$inc": {"likes_count": -1}})
        return {"liked": False, "likes_count": len(d["likes"]) - 1}
    was_disliked = me_id in d.get("dislikes", [])
    update = {"$pull": {"dislikes": me_id}, "$addToSet": {"likes": me_id}, "$inc": {"likes_count": 1}}
    if was_disliked:
        update["$inc"]["dislikes_count"] = -1
    quizzes().update_one({"_id": oid}, update)
    likes = quizzes().find_one({"_id": oid}, {"likes": 1})["likes"]
    return {"liked": True, "likes_count": len(likes)}


@router.post("/posts/quizzes/{qid}/dislike")
def toggle_dislike(qid: str, me: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(qid)
    except Exception:
        raise HTTPException(400, "bad id")
    me_id = me["_id"]
    d = quizzes().find_one({"_id": oid}, {"dislikes": 1, "likes": 1})
    if not d:
        raise HTTPException(404, "not found")
    if me_id in d.get("dislikes", []):
        quizzes().update_one({"_id": oid}, {"$pull": {"dislikes": me_id}, "$inc": {"dislikes_count": -1}})
        return {"disliked": False, "dislikes_count": len(d["dislikes"]) - 1}
    was_liked = me_id in d.get("likes", [])
    update = {"$pull": {"likes": me_id}, "$addToSet": {"dislikes": me_id}, "$inc": {"dislikes_count": 1}}
    if was_liked:
        update["$inc"]["likes_count"] = -1
    quizzes().update_one({"_id": oid}, update)
    dislikes = quizzes().find_one({"_id": oid}, {"dislikes": 1})["dislikes"]
    return {"disliked": True, "dislikes_count": len(dislikes)}


@router.post("/posts/quizzes/{qid}/comments", status_code=201)
def add_comment(qid: str, body: CommentIn, me: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(qid)
    except Exception:
        raise HTTPException(400, "bad id")
    if not quizzes().find_one({"_id": oid}, {"_id": 1}):
        raise HTTPException(404, "not found")
    c = {
        "_id": ObjectId(),
        "user_id": me["_id"],
        "username": me["username"],
        "text": body.text,
        "created_at": datetime.now(timezone.utc),
    }
    quizzes().update_one({"_id": oid}, {"$push": {"comments": c}})
    return {
        "id": str(c["_id"]),
        "user_id": str(c["user_id"]),
        "username": c["username"],
        "text": c["text"],
        "created_at": c["created_at"].isoformat(),
    }


@router.post("/posts/quizzes/{qid}/attempt")
def attempt(qid: str, body: AttemptIn, me: dict = Depends(get_current_user)):
    """One-shot attempt. Server scores answers and returns correct_index for each question."""
    try:
        oid = ObjectId(qid)
    except Exception:
        raise HTTPException(400, "bad id")
    me_id = me["_id"]

    d = quizzes().find_one({"_id": oid})
    if not d:
        raise HTTPException(404, "not found")
    if d["author_id"] == me_id:
        raise HTTPException(400, "cannot attempt your own quiz")
    if any(a["user_id"] == me_id for a in d.get("attempts", [])):
        raise HTTPException(400, "already attempted this quiz")

    questions = d.get("questions", [])
    if len(body.answers) != len(questions):
        raise HTTPException(400, f"expected {len(questions)} answers, got {len(body.answers)}")

    score = sum(
        int(q.get("marks", 1)) for i, q in enumerate(questions)
        if i < len(body.answers) and body.answers[i] == q["correct_index"]
    )
    total = sum(int(q.get("marks", 1)) for q in questions)

    attempt_doc = {
        "user_id": me_id,
        "username": me["username"],
        "score": score,
        "total": total,
        "answers": body.answers,
        "created_at": datetime.now(timezone.utc),
    }
    quizzes().update_one({"_id": oid}, {"$push": {"attempts": attempt_doc}})

    # Return questions WITH correct_index so the client can show right answers.
    revealed = [
        {"q": q["q"], "options": q["options"], "correct_index": q["correct_index"], "marks": int(q.get("marks", 1))}
        for q in questions
    ]
    return {
        "score": score,
        "total": total,
        "questions": revealed,
        "your_answers": body.answers,
    }