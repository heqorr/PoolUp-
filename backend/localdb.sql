CREATE TABLE IF NOT EXISTS pools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    store_name TEXT,
    category TEXT,
    target_amount REAL,
    current_amount REAL DEFAULT 0,
    deadline DATETIME
);

CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pool_id INTEGER,
    user_name TEXT,
    contribution REAL,
    FOREIGN KEY(pool_id) REFERENCES pools(id)
);