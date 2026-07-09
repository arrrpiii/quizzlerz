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
    repos().create_index([("likes", DESCENDING)])
    blogs().create_index([("created_at", DESCENDING)])
    blogs().create_index([("likes", DESCENDING)])
    quizzes().create_index([("created_at", DESCENDING)])
    quizzes().create_index([("likes", DESCENDING)])