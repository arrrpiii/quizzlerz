"""MongoDB connection and collection accessors."""
import os
from pymongo import MongoClient, ASCENDING, DESCENDING

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("MONGO_DB", "quizzlerz")

_client = None

def get_client():
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URL)
    return _client

def db():
    return get_client()[DB_NAME]

def users():       return db()["users"]
def repos():       return db()["repos"]
def blogs():       return db()["blogs"]
def quizzes():     return db()["quizzes"]

def init_indexes():
    """Create unique indexes. Idempotent."""
    users().create_index([("username", ASCENDING)], unique=True)
    users().create_index([("email", ASCENDING)], unique=True)
    repos().create_index([("created_at", DESCENDING)])
    repos().create_index([("likes_count", DESCENDING), ("created_at", DESCENDING)])
    repos().create_index([("likes", DESCENDING)])
    blogs().create_index([("created_at", DESCENDING)])
    blogs().create_index([("likes_count", DESCENDING), ("created_at", DESCENDING)])
    blogs().create_index([("likes", DESCENDING)])
    quizzes().create_index([("created_at", DESCENDING)])
    quizzes().create_index([("likes_count", DESCENDING), ("created_at", DESCENDING)])
    quizzes().create_index([("likes", DESCENDING)])


def backfill_counts():
    """One-shot: derive likes_count / dislikes_count from the arrays
    on any doc that doesn't have them yet. Safe to run repeatedly."""
    for coll in (repos(), blogs(), quizzes()):
        for d in coll.find(
            {"$or": [{"likes_count": {"$exists": False}},
                     {"dislikes_count": {"$exists": False}}]}
        ):
            update = {}
            if "likes_count" not in d:
                update["likes_count"] = len(d.get("likes", []))
            if "dislikes_count" not in d:
                update["dislikes_count"] = len(d.get("dislikes", []))
            if update:
                coll.update_one({"_id": d["_id"]}, {"$set": update})