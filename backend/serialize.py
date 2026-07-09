"""Shared serialization for posts. Quiz correct_index only included when reveal_correct=True."""
from .db import users
def _public_post(d: dict, kind: str, reveal_correct: bool = False, your_answers: list | None = None) -> dict:
    # Comments are pushed to the end of the array; render newest first.
    raw_comments = list(d.get("comments", []))
    raw_comments.reverse()
    base = {
        "id": str(d["_id"]),
        "author_id": str(d["author_id"]),
        "title": d.get("title", ""),
        "created_at": d["created_at"].isoformat() if d.get("created_at") else None,
        "likes_count": len(d.get("likes", [])),
        "dislikes_count": len(d.get("dislikes", [])),
        "comments_count": len(d.get("comments", [])),
        "comments": [
            {
                "id": str(c.get("_id", "")),
                "user_id": str(c["user_id"]),
                "username": c.get("username", ""),
                "text": c.get("text", ""),
                "created_at": c["created_at"].isoformat() if c.get("created_at") else None,
            }
            for c in raw_comments
        ],
    }
    if kind == "repos":
        base.update({
            "description": d.get("description", ""),
            "files": d.get("files", []),
            "tags": d.get("tags", []),
        })
    elif kind == "blogs":
        base["content"] = d.get("content", "")
    elif kind == "quizzes":
        base["tags"] = d.get("tags", [])
        base["description"] = d.get("description", "")
        qs = []
        for i, q in enumerate(d.get("questions", [])):
            qd = {"q": q["q"], "options": q["options"], "marks": int(q.get("marks", 1))}
            if reveal_correct or your_answers is not None:
                qd["correct_index"] = q["correct_index"]
                if your_answers is not None:
                    qd["your_answer"] = your_answers[i] if i < len(your_answers) else None
            qs.append(qd)
        base["questions"] = qs
        base["total_marks"] = sum(int(q.get("marks", 1)) for q in d.get("questions", []))
        attempts = d.get("attempts", [])
        base["attempts_count"] = len(attempts)
        if attempts:
            base["avg_score"] = round(sum(a["score"] for a in attempts) / len(attempts), 2)
            base["high_score"] = max(a["score"] for a in attempts)
        else:
            base["avg_score"] = 0
            base["high_score"] = 0
    return base

def serialize_repo(d):   return _public_post(d, "repos")
def serialize_blog(d):   return _public_post(d, "blogs")
def serialize_quiz(d, reveal_correct=False, your_answers=None):
    return _public_post(d, "quizzes", reveal_correct=reveal_correct, your_answers=your_answers)

def serialize_many(docs, kind):
    """Bulk-serialize posts. Looks up each author's username in a single query and
    adds it to every item, so callers (library, user-posts list) don't have to."""
    if not docs:
        return []
    author_ids = list({d["author_id"] for d in docs})
    user_map = {
        u["_id"]: u.get("username", "")
        for u in users().find({"_id": {"$in": author_ids}}, {"username": 1})
    }
    out = []
    for d in docs:
        if   kind == "repos":   item = serialize_repo(d)
        elif kind == "blogs":   item = serialize_blog(d)
        elif kind == "quizzes": item = serialize_quiz(d)
        else: continue
        item["author_username"] = user_map.get(d["author_id"], "")
        out.append(item)
    return out