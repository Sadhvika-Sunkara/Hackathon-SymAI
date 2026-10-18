import os
import sqlite3

from data import ALL_SUBURBS, CITY_LISTINGS, LISTINGS

# On Railway, set DB_PATH=/data/campusnest.db (a mounted volume) so data survives redeploys.
DB_FILE = os.getenv("DB_PATH", "campusnest.db")
os.makedirs(os.path.dirname(DB_FILE) or ".", exist_ok=True)


def conn():
    c = sqlite3.connect(DB_FILE)
    c.row_factory = sqlite3.Row
    return c


def init():
    """Create the table and load the sample listings the first time only."""
    with conn() as c:
        c.execute(
            """CREATE TABLE IF NOT EXISTS listings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                suburb TEXT NOT NULL,
                rent INTEGER NOT NULL,
                household TEXT NOT NULL,
                lat REAL NOT NULL,
                lng REAL NOT NULL
            )"""
        )
        if c.execute("SELECT COUNT(*) FROM listings").fetchone()[0] == 0:
            c.executemany(
                "INSERT INTO listings (id, title, suburb, rent, household, lat, lng) "
                "VALUES (:id, :title, :suburb, :rent, :household, :lat, :lng)",
                LISTINGS,
            )
        # Home details added later: add the columns to existing databases too.
        have = {r["name"] for r in c.execute("PRAGMA table_info(listings)")}
        for col, typ in (("bedrooms", "INTEGER"), ("bathrooms", "INTEGER"), ("furnished", "INTEGER"),
                         ("bills_included", "INTEGER"), ("amenities", "TEXT")):
            if col not in have:
                c.execute(f"ALTER TABLE listings ADD COLUMN {col} {typ}")
        # Sample homes in other Australian cities, added once.
        titles = {r[0] for r in c.execute("SELECT title FROM listings")}
        for title, suburb, rent, household in CITY_LISTINGS:
            if title not in titles:
                lat, lng = ALL_SUBURBS[suburb]
                c.execute(
                    "INSERT INTO listings (title, suburb, rent, household, lat, lng) VALUES (?, ?, ?, ?, ?, ?)",
                    (title, suburb, rent, household, lat, lng),
                )
    fill_details()


AMENITIES = ["Wifi", "Laundry", "Air con", "Parking", "Dishwasher", "Balcony", "Gym", "Study desk", "Pets allowed"]


def fill_details():
    """Give homes without details sample bedrooms, bathrooms, furnishing, bills and amenities.
    Deterministic per id, so every redeploy shows the same values."""
    with conn() as c:
        for r in c.execute("SELECT id FROM listings WHERE bedrooms IS NULL OR bathrooms IS NULL").fetchall():
            i = r["id"]
            beds = (i * 7) % 6 + 1
            baths = min(3, 1 + (beds - 1) // 2 + (i % 2 if beds > 1 else 0))
            furnished = 0 if i % 3 == 0 else 1
            bills = 1 if i % 2 == 0 else 0
            picks = [a for k, a in enumerate(AMENITIES) if (i * 5 + k * 3) % 4 != 0][: 3 + i % 3]
            c.execute(
                "UPDATE listings SET bedrooms = ?, bathrooms = ?, furnished = ?, bills_included = ?, amenities = ? WHERE id = ?",
                (beds, baths, furnished, bills, ",".join(picks), i),
            )


def _out(row):
    d = dict(row)
    d["amenities"] = [a for a in (d.get("amenities") or "").split(",") if a]
    d["furnished"] = bool(d.get("furnished"))
    d["bills_included"] = bool(d.get("bills_included"))
    return d


def all_listings():
    with conn() as c:
        return [_out(r) for r in c.execute("SELECT * FROM listings ORDER BY id")]


def add_listing(title, suburb, rent, household, lat, lng,
                bedrooms=None, bathrooms=None, furnished=None, bills_included=None, amenities=None):
    """Owners set the details; anything left blank gets sample values from fill_details()."""
    with conn() as c:
        cur = c.execute(
            "INSERT INTO listings (title, suburb, rent, household, lat, lng, bedrooms, bathrooms, furnished, bills_included, amenities) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (title, suburb, rent, household, lat, lng, bedrooms, bathrooms,
             None if furnished is None else int(furnished),
             None if bills_included is None else int(bills_included),
             ",".join(amenities) if amenities else None),
        )
        new_id = cur.lastrowid
    fill_details()
    with conn() as c:
        return _out(c.execute("SELECT * FROM listings WHERE id = ?", (new_id,)).fetchone())


def delete_listing(listing_id):
    with conn() as c:
        return c.execute("DELETE FROM listings WHERE id = ?", (listing_id,)).rowcount > 0



TABLES = {
    "subleasers": {"name": "TEXT NOT NULL", "email": "TEXT", "phone": "TEXT", "listing_id": "INTEGER",
                   "status": "TEXT DEFAULT 'onboarding'", "move_in": "TEXT", "move_out": "TEXT", "lease_url": "TEXT",
                   # Identity verification (demo, sample data only: no ID images or numbers are stored)
                   "id_type": "TEXT", "id_status": "TEXT DEFAULT 'not_started'", "face_status": "TEXT DEFAULT 'not_started'",
                   "decision": "TEXT DEFAULT 'pending'"},
    "bills": {"subleaser_id": "INTEGER", "description": "TEXT NOT NULL", "amount": "REAL NOT NULL",
              "due": "TEXT", "paid": "INTEGER DEFAULT 0"},
    "messages": {"listing_id": "INTEGER", "name": "TEXT NOT NULL", "email": "TEXT NOT NULL", "body": "TEXT NOT NULL",
                 "reply": "TEXT", "status": "TEXT DEFAULT 'new'", "created": "TEXT DEFAULT CURRENT_TIMESTAMP"},
    "complaints": {"subleaser_id": "INTEGER", "title": "TEXT NOT NULL", "details": "TEXT",
                   "status": "TEXT DEFAULT 'open'", "created": "TEXT DEFAULT CURRENT_DATE"},
}


def init_owner_tables():
    with conn() as c:
        for t, cols in TABLES.items():
            defs = ", ".join(f"{k} {v}" for k, v in cols.items())
            c.execute(f"CREATE TABLE IF NOT EXISTS {t} (id INTEGER PRIMARY KEY AUTOINCREMENT, {defs})")
            have = {r["name"] for r in c.execute(f"PRAGMA table_info({t})")}
            for k, v in cols.items():
                if k not in have:
                    c.execute(f"ALTER TABLE {t} ADD COLUMN {k} {v}")


def rows(t):
    with conn() as c:
        return [dict(r) for r in c.execute(f"SELECT * FROM {t} ORDER BY id DESC")]


def insert(t, data):
    cols = [k for k in data if k in TABLES[t]]
    marks = ",".join(["?"] * len(cols))
    with conn() as c:
        cur = c.execute(f"INSERT INTO {t} ({','.join(cols)}) VALUES ({marks})", [data[k] for k in cols])
        return dict(c.execute(f"SELECT * FROM {t} WHERE id = ?", (cur.lastrowid,)).fetchone())


def update(t, item_id, data):
    cols = [k for k in data if k in TABLES[t]]
    if not cols:
        return False
    sets = ",".join(f"{k} = ?" for k in cols)
    with conn() as c:
        return c.execute(f"UPDATE {t} SET {sets} WHERE id = ?", [data[k] for k in cols] + [item_id]).rowcount > 0


def remove(t, item_id):
    with conn() as c:
        return c.execute(f"DELETE FROM {t} WHERE id = ?", (item_id,)).rowcount > 0