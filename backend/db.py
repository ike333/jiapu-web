"""SQLite 数据库层：users / sms_codes / changes / feedbacks / photos 五张表
多谱支持：users / changes / feedbacks / photos 均带 clan 字段（按谱隔离）
"""
import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "genealogy.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _has_column(conn, table, column):
    cols = [r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]
    return column in cols


def init_db():
    conn = get_conn()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            phone       TEXT NOT NULL,
            name        TEXT NOT NULL,
            password    TEXT NOT NULL,          -- pbkdf2 哈希
            role        TEXT NOT NULL DEFAULT 'user',  -- user | admin
            clan        TEXT NOT NULL DEFAULT 'chen',  -- 所属谱系
            created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            UNIQUE(phone, clan)
        );

        CREATE TABLE IF NOT EXISTS sms_codes (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            phone      TEXT NOT NULL,
            purpose    TEXT NOT NULL,           -- register | login
            code       TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used       INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        );

        CREATE TABLE IF NOT EXISTS changes (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            type           TEXT NOT NULL,       -- birth | marriage | death
            data           TEXT NOT NULL,       -- JSON 详情
            status         TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
            clan           TEXT NOT NULL DEFAULT 'chen',  -- 所属谱系
            submitter_id   INTEGER,
            submitter_name TEXT,
            submitter_phone TEXT,
            remark         TEXT,
            reviewed_by    TEXT,
            reviewed_at    TEXT,
            created_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        );

        CREATE TABLE IF NOT EXISTS feedbacks (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            content        TEXT NOT NULL,
            submitter_id   INTEGER,
            submitter_name TEXT,
            submitter_phone TEXT,
            status         TEXT NOT NULL DEFAULT 'pending', -- pending | replied
            clan           TEXT NOT NULL DEFAULT 'chen',  -- 所属谱系
            reply          TEXT,
            replied_by     TEXT,
            replied_at     TEXT,
            created_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        );

        CREATE TABLE IF NOT EXISTS photos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            clan        TEXT NOT NULL DEFAULT 'chen',   -- 所属谱系
            person_id   TEXT NOT NULL,                  -- 展平人物 id（p_0, p_1 ...）
            slot        TEXT NOT NULL DEFAULT 'self',   -- self(本人) | spouse(配偶)
            filename    TEXT NOT NULL,                  -- uploads/{clan}/{filename}
            uploaded_by TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            UNIQUE(clan, person_id, slot)
        );

        CREATE TABLE IF NOT EXISTS photos_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            clan        TEXT NOT NULL DEFAULT 'chen',
            person_id   TEXT NOT NULL,
            slot        TEXT NOT NULL DEFAULT 'self',
            filename    TEXT NOT NULL,                  -- prev/ 目录下留底文件名
            uploaded_by TEXT,
            archived_by TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        );
        """
    )
    _migrate(conn)
    conn.commit()
    conn.close()


def _migrate(conn):
    """旧表结构迁移（单谱 → 多谱）：
    - users 原 phone UNIQUE，需重建为 UNIQUE(phone, clan)，旧数据归入 'chen'
    - changes / feedbacks 补 clan 列（默认 'chen'）
    """
    # users：若无 clan 列则重建表
    if not _has_column(conn, "users", "clan"):
        conn.executescript(
            """
            ALTER TABLE users RENAME TO users_old;
            CREATE TABLE users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                phone       TEXT NOT NULL,
                name        TEXT NOT NULL,
                password    TEXT NOT NULL,
                role        TEXT NOT NULL DEFAULT 'user',
                clan        TEXT NOT NULL DEFAULT 'chen',
                created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                UNIQUE(phone, clan)
            );
            INSERT INTO users (id, phone, name, password, role, clan, created_at)
                SELECT id, phone, name, password, role, 'chen', created_at FROM users_old;
            DROP TABLE users_old;
            UPDATE sqlite_sequence SET seq = (SELECT COALESCE(MAX(id), 0) FROM users) WHERE name = 'users';
            """
        )
    # changes / feedbacks：补 clan 列
    for table in ("changes", "feedbacks"):
        if not _has_column(conn, table, "clan"):
            conn.execute(f"ALTER TABLE {table} ADD COLUMN clan TEXT NOT NULL DEFAULT 'chen'")
    # changes：补 exported_at（世系表呈现已整理标记）
    if not _has_column(conn, "changes", "exported_at"):
        conn.execute("ALTER TABLE changes ADD COLUMN exported_at TEXT")
    conn.commit()


def row_to_dict(row):
    return dict(row) if row else None


def db_insert(table, fields):
    keys = list(fields.keys())
    vals = list(fields.values())
    ph = ",".join("?" for _ in keys)
    conn = get_conn()
    cur = conn.execute(
        f"INSERT INTO {table} ({','.join(keys)}) VALUES ({ph})", vals
    )
    conn.commit()
    last_id = cur.lastrowid
    conn.close()
    return last_id


def db_update(table, fields, where):
    keys = list(fields.keys())
    vals = list(fields.values())
    wkeys = list(where.keys())
    wvals = list(where.values())
    sets = ",".join(f"{k}=?" for k in keys)
    wcond = " AND ".join(f"{k}=?" for k in wkeys)
    conn = get_conn()
    conn.execute(f"UPDATE {table} SET {sets} WHERE {wcond}", vals + wvals)
    conn.commit()
    conn.close()


def db_query(table, where=None, order_by=None, limit=None):
    sql = f"SELECT * FROM {table}"
    args = []
    if where:
        wkeys = list(where.keys())
        args = list(where.values())
        sql += " WHERE " + " AND ".join(f"{k}=?" for k in wkeys)
    if order_by:
        sql += f" ORDER BY {order_by}"
    if limit:
        sql += f" LIMIT {limit}"
    conn = get_conn()
    rows = conn.execute(sql, args).fetchall()
    conn.close()
    return [dict(r) for r in rows]
