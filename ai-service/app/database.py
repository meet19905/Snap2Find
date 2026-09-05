"""Async SQLite database management using aiosqlite.

Provides connection lifecycle management and schema initialization.
Reference: https://aiosqlite.omnilib.dev/en/stable/
"""

from __future__ import annotations

import aiosqlite

from app.config import DB_PATH

# Module-level connection holder.
_connection: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    """Return the shared database connection.

    This is used as a FastAPI dependency and also called directly
    within route handlers.
    """
    if _connection is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _connection


async def _create_tables(conn: aiosqlite.Connection) -> None:
    """Create the database tables and performance indexes if they don't exist."""
    # Enable WAL mode & performance pragmas for concurrent read/write speed
    await conn.execute("PRAGMA journal_mode=WAL;")
    await conn.execute("PRAGMA synchronous=NORMAL;")

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            category TEXT,
            location TEXT,
            image_path TEXT,
            thumb_path TEXT,
            embedding TEXT,
            phone_number TEXT,
            description TEXT,
            status TEXT DEFAULT 'unclaimed',
            claimed_by_phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Check if thumb_path column exists in legacy tables
    cursor = await conn.execute("PRAGMA table_info(items)")
    columns = [row[1] for row in await cursor.fetchall()]
    if "thumb_path" not in columns:
        await conn.execute("ALTER TABLE items ADD COLUMN thumb_path TEXT")

    # Composite indexes for high-speed filtered queries
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_items_lookup ON items(status, type, category);")
    await conn.execute("CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);")
    await conn.commit()


async def init_db(db_path: str | None = None) -> None:
    """Open the database and create tables if they don't exist.

    Called once during application startup via the lifespan handler.
    Schema matches the original Node.js backend exactly.

    Args:
        db_path: Optional override for the database path. If None, uses the
                 configured DB_PATH. Pass ":memory:" for testing.
    """
    global _connection

    # Close any existing connection first
    if _connection is not None:
        await _connection.close()
        _connection = None

    path = db_path if db_path is not None else str(DB_PATH)
    _connection = await aiosqlite.connect(path)
    _connection.row_factory = aiosqlite.Row

    await _create_tables(_connection)


async def close_db() -> None:
    """Close the database connection during shutdown."""
    global _connection
    if _connection is not None:
        await _connection.close()
        _connection = None
