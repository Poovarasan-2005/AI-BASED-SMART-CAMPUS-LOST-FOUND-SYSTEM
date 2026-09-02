import asyncio
import os
import json
from typing import Dict, List, Any, Optional
import uuid
from datetime import datetime
from app.config import settings

PERSIST_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".dev_db.json")

class MemoryCollection:
    """In-memory collection for standalone dev testing with disk persistence."""
    def __init__(self, name: str, parent_db=None):
        self.name = name
        self.parent_db = parent_db
        self.data: Dict[str, Dict[str, Any]] = {}

    def _notify_change(self):
        if self.parent_db:
            self.parent_db.save_to_disk()

    def _matches_query(self, item: Dict[str, Any], query: Dict[str, Any]) -> bool:
        """Evaluates Mongo-like queries including $or, $in, and direct equality."""
        if not query:
            return True

        if "$or" in query:
            sub_queries = query["$or"]
            match_or = False
            for sq in sub_queries:
                if self._matches_query(item, sq):
                    match_or = True
                    break
            if not match_or:
                return False

        for k, v in query.items():
            if k == "$or":
                continue

            if isinstance(v, dict) and "$in" in v:
                in_list = v["$in"]
                if item.get(k) not in in_list:
                    return False
            elif isinstance(v, dict) and "$nin" in v:
                nin_list = v["$nin"]
                if item.get(k) in nin_list:
                    return False
            elif isinstance(v, dict):
                pass
            else:
                if item.get(k) != v:
                    return False

        return True

    async def insert_one(self, document: Dict[str, Any]):
        doc_copy = dict(document)
        if "_id" not in doc_copy:
            doc_copy["_id"] = doc_copy.get("id") or str(uuid.uuid4())
        self.data[str(doc_copy["_id"])] = doc_copy
        self._notify_change()
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy["_id"])

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for item in self.data.values():
            if self._matches_query(item, query):
                return dict(item)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None):
        query = query or {}
        results = []
        for item in self.data.values():
            if self._matches_query(item, query):
                results.append(dict(item))
        
        class Cursor:
            def __init__(self, items):
                self.items = items
            def sort(self, key, direction=-1):
                reverse = True if direction == -1 else False
                self.items.sort(key=lambda x: x.get(key, ""), reverse=reverse)
                return self
            def limit(self, l):
                self.items = self.items[:l]
                return self
            async def to_list(self, length=1000):
                return self.items[:length]
            def __aiter__(self):
                self._iter = iter(self.items)
                return self
            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration

        return Cursor(results)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        target = await self.find_one(query)
        if target:
            item_id = str(target["_id"])
            if "$set" in update:
                for k, v in update["$set"].items():
                    self.data[item_id][k] = v
            if "$inc" in update:
                for k, v in update["$inc"].items():
                    self.data[item_id][k] = self.data[item_id].get(k, 0) + v
            self._notify_change()
            class UpdateResult:
                modified_count = 1
            return UpdateResult()
        class UpdateResult:
            modified_count = 0
        return UpdateResult()

    async def delete_one(self, query: Dict[str, Any]):
        target = await self.find_one(query)
        if target:
            del self.data[str(target["_id"])]
            self._notify_change()
            class DeleteResult:
                deleted_count = 1
            return DeleteResult()
        class DeleteResult:
            deleted_count = 0
        return DeleteResult()

    async def count_documents(self, query: Dict[str, Any]) -> int:
        count = 0
        for item in self.data.values():
            if self._matches_query(item, query):
                count += 1
        return count

class MemoryDatabase:
    def __init__(self):
        self.collections: Dict[str, MemoryCollection] = {}
        self.load_from_disk()

    def get_collection(self, name: str) -> MemoryCollection:
        if name not in self.collections:
            self.collections[name] = MemoryCollection(name, parent_db=self)
        return self.collections[name]

    def __getitem__(self, name: str) -> MemoryCollection:
        return self.get_collection(name)

    def save_to_disk(self):
        try:
            dump = {}
            for name, col in self.collections.items():
                dump[name] = col.data
            with open(PERSIST_FILE, "w") as f:
                json.dump(dump, f, indent=2)
        except Exception as e:
            print(f"Failed to persist dev DB: {e}")

    def load_from_disk(self):
        try:
            if os.path.exists(PERSIST_FILE):
                with open(PERSIST_FILE, "r") as f:
                    dump = json.load(f)
                    for name, data in dump.items():
                        col = MemoryCollection(name, parent_db=self)
                        col.data = data
                        self.collections[name] = col
                print(f"Loaded persistent dev database from {PERSIST_FILE}")
        except Exception as e:
            print(f"Failed to load persistent dev DB: {e}")

# Global DB client initialization
db_client = None
db = None
use_memory_fallback = False

async def get_database():
    global db_client, db, use_memory_fallback
    if db is not None:
        return db

    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(settings.DATABASE_URL, serverSelectionTimeoutMS=1500)
        await client.admin.command('ping')
        db_client = client
        db = client[settings.MONGODB_DB_NAME]
        use_memory_fallback = False
        print(f"Connected to MongoDB at {settings.DATABASE_URL}")
    except Exception as e:
        print(f"MongoDB not available ({e}). Initializing Persistent Dev Database.")
        db = MemoryDatabase()
        use_memory_fallback = True
    return db
