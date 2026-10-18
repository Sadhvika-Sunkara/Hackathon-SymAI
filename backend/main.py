import math
import os
from typing import Any, Dict, Optional

import base64
import hashlib
import hmac
import json
import time

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import db
from data import ALL_SUBURBS, CAMPUSES, CITIES, STATIONS, SUBURBS, UNIVERSITIES

import pathlib

from dotenv import load_dotenv

load_dotenv(pathlib.Path(__file__).parent / ".env")


app = FastAPI(title="Nivasya API")
app.add_middleware(
    CORSMiddleware,
    # Comma-separated list, e.g. "https://campusnest.vercel.app,http://localhost:3000"
    allow_origins=[o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

db.init()

db.init_owner_tables()

OWNER_USER = "admin"
OWNER_PASSWORD = os.getenv("OWNER_PASSWORD", "admin")  # prototype only
HOUSEHOLDS = {"female_only", "female_preferred", "male_preferred", "any"}
WALK_M_PER_MIN = 80
NEAR_KM = 50  # radius used when someone picks a location
DETOUR = 1.3  # straight-line distance -> realistic walking distance


def km(lat1, lng1, lat2, lng2):
    """Distance between two points in km (haversine formula)."""
    p = math.pi / 180
    a = (
        math.sin((lat2 - lat1) * p / 2) ** 2
        + math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lng2 - lng1) * p / 2) ** 2
    )
    return 12742 * math.asin(math.sqrt(a))


def enrich(listing, campus):
    """Add nearest station, walk time, and distance to the chosen campus."""
    station, d = min(
        ((s, km(listing["lat"], listing["lng"], s["lat"], s["lng"])) for s in STATIONS),
        key=lambda x: x[1],
    )
    out = {
        **listing,
        "station": station["name"],
        "walk_min": max(1, round(d * 1000 * DETOUR / WALK_M_PER_MIN)),
    }
    if campus:
        out["campus_km"] = round(km(listing["lat"], listing["lng"], campus["lat"], campus["lng"]), 1)
    return out


def require_owner(token: str):
    """Owner routes accept a signed session token (issued by /owner/login), never the raw password."""
    data = read_token(token) if token else None
    if not data or data.get("r") != "owner":
        raise HTTPException(401, "Owner login required")


@app.get("/campuses")
def campuses():
    return [{"id": k, **v} for k, v in CAMPUSES.items()]


@app.get("/suburbs")
def suburbs():
    return sorted(ALL_SUBURBS.keys())


def all_locations():
    out = {}
    for group, src in (("City", CITIES), ("University", UNIVERSITIES)):
        for k, (name, lat, lng) in src.items():
            out[k] = {"id": k, "name": name, "group": group, "lat": lat, "lng": lng}
    for name, (lat, lng) in ALL_SUBURBS.items():
        k = "sub-" + name.lower().replace(" ", "-")
        out[k] = {"id": k, "name": name, "group": "Suburb", "lat": lat, "lng": lng}
    return out


LOCATIONS = all_locations()


@app.get("/locations")
def locations():
    """Anywhere a renter might measure distance from: cities, universities and suburbs across Australia."""
    return list(LOCATIONS.values())


@app.get("/listings")
def listings(
    campus: Optional[str] = None,
    household: Optional[str] = None,
    walk_max: Optional[int] = None,
    max_rent: Optional[int] = None,
    bedrooms: Optional[str] = None,   # e.g. "1,2,3" (multi-select)
    bathrooms: Optional[str] = None,  # e.g. "1,2" (3 means 3 or more)
    furnished: Optional[bool] = None,
    bills: Optional[bool] = None,
    near: Optional[str] = None,
):
    where = near or campus
    c = LOCATIONS.get(where) if where else None
    if where and not c:
        raise HTTPException(404, "Unknown location")

    items = [enrich(l, c) for l in db.all_listings()]

    if household:
        wanted = set(household.split(","))
        items = [i for i in items if i["household"] in wanted]
    if walk_max is not None:
        items = [i for i in items if i["walk_min"] <= walk_max]
    if max_rent is not None:
        items = [i for i in items if i["rent"] <= max_rent]
    def nums(v):
        try:
            return {int(x) for x in v.split(",") if x.strip()}
        except ValueError:
            raise HTTPException(422, "Use numbers like 1,2,3")

    if bedrooms:
        want = nums(bedrooms)
        items = [i for i in items if i.get("bedrooms") in want]
    if bathrooms:
        want = nums(bathrooms)
        items = [i for i in items if min(i.get("bathrooms") or 1, 3) in want]
    if furnished is not None:
        items = [i for i in items if i.get("furnished") == furnished]
    if bills is not None:
        items = [i for i in items if i.get("bills_included") == bills]
    if c:
        # "Near" means nearby: only homes within a commutable distance of the chosen place
        items = [i for i in items if i["campus_km"] <= NEAR_KM]
        items.sort(key=lambda i: i["campus_km"])

    return items


class Login(BaseModel):
    username: str
    password: str


@app.post("/owner/login")
def owner_login(body: Login):
    if body.username != OWNER_USER or body.password != OWNER_PASSWORD:
        raise HTTPException(401, "Wrong username or password")
    return {"ok": True, "token": make_token(OWNER_USER, "Owner", role="owner")}


class NewListing(BaseModel):
    title: str = Field(min_length=3, max_length=80)
    suburb: str
    rent: int = Field(gt=0, lt=5000)
    household: str
    bedrooms: Optional[int] = Field(default=None, ge=1, le=6)
    bathrooms: Optional[int] = Field(default=None, ge=1, le=6)
    furnished: Optional[bool] = None
    bills_included: Optional[bool] = None
    amenities: Optional[list[str]] = None


@app.post("/listings", status_code=201)
def add_listing(body: NewListing, x_owner_password: str = Header(default="")):
    require_owner(x_owner_password)
    if body.household not in HOUSEHOLDS:
        raise HTTPException(422, "Invalid household type")
    if body.suburb not in ALL_SUBURBS:
        raise HTTPException(422, "Unknown suburb")
    lat, lng = ALL_SUBURBS[body.suburb]
    amenities = [a.strip()[:30] for a in (body.amenities or []) if a.strip()][:12]
    return db.add_listing(body.title, body.suburb, body.rent, body.household, lat, lng,
                          body.bedrooms, body.bathrooms, body.furnished, body.bills_included, amenities)


@app.delete("/listings/{listing_id}")
def delete_listing(listing_id: int, x_owner_password: str = Header(default="")):
    require_owner(x_owner_password)
    if not db.delete_listing(listing_id):
        raise HTTPException(404, "Listing not found")
    return {"deleted": listing_id}




class Message(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    body: str = Field(min_length=2, max_length=1000)


@app.post("/listings/{listing_id}/messages", status_code=201)
def message_owner(listing_id: int, body: Message):
    """Anyone can message the lease owner about a home. The owner reads replies in the dashboard."""
    if not any(l["id"] == listing_id for l in db.all_listings()):
        raise HTTPException(404, "Listing not found")
    saved = db.insert("messages", {"listing_id": listing_id, "name": body.name.strip(),
                                   "email": body.email.strip(), "body": body.body.strip()})
    return {"ok": True, "id": saved["id"]}


def check_table(table: str):
    if table not in db.TABLES:
        raise HTTPException(404, "Unknown table")


@app.get("/owner/{table}")
def owner_list(table: str, x_owner_password: str = Header(default="")):
    require_owner(x_owner_password)
    check_table(table)
    return db.rows(table)


@app.post("/owner/{table}", status_code=201)
def owner_add(table: str, body: Dict[str, Any], x_owner_password: str = Header(default="")):
    require_owner(x_owner_password)
    check_table(table)
    return db.insert(table, body)


@app.patch("/owner/{table}/{item_id}")
def owner_update(table: str, item_id: int, body: Dict[str, Any], x_owner_password: str = Header(default="")):
    require_owner(x_owner_password)
    check_table(table)
    if not db.update(table, item_id, body):
        raise HTTPException(404, "Not found")
    return {"updated": item_id}


@app.delete("/owner/{table}/{item_id}")
def owner_delete(table: str, item_id: int, x_owner_password: str = Header(default="")):
    require_owner(x_owner_password)
    check_table(table)
    if not db.remove(table, item_id):
        raise HTTPException(404, "Not found")
    return {"deleted": item_id}




# ---------- Subleaser login (Google, or demo mode when no client ID is set) ----------
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
SESSION_SECRET = os.getenv("SESSION_SECRET", "dev-secret-change-me")  # set a real one outside the demo


def make_token(email: str, name: str, role: str = "subleaser") -> str:
    payload = base64.urlsafe_b64encode(json.dumps({"e": email, "n": name, "r": role, "x": int(time.time()) + 86400}).encode()).decode()
    sig = hmac.new(SESSION_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def read_token(token: str) -> dict:
    try:
        payload, sig = token.split(".")
        good = hmac.new(SESSION_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, good):
            raise ValueError
        data = json.loads(base64.urlsafe_b64decode(payload))
        if data["x"] < time.time():
            raise ValueError
        return data
    except Exception:
        raise HTTPException(401, "Please sign in again")


def find_sub(email: str):
    return next((r for r in db.rows("subleasers") if (r.get("email") or "").lower() == email.lower()), None)


class SubLogin(BaseModel):
    credential: Optional[str] = None
    demo_name: Optional[str] = None
    demo_email: Optional[str] = None


@app.get("/subleaser/config")
def subleaser_config():
    return {"google": bool(GOOGLE_CLIENT_ID)}


@app.post("/subleaser/login")
def subleaser_login(body: SubLogin):
    if body.credential:
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(503, "Google sign-in isn't set up yet")
        from google.auth.transport import requests as grequests
        from google.oauth2 import id_token

        try:
            info = id_token.verify_oauth2_token(body.credential, grequests.Request(), GOOGLE_CLIENT_ID)
        except ValueError:
            raise HTTPException(401, "Google sign-in failed")
        email, name = info["email"], info.get("name", info["email"])
    elif body.demo_email and not GOOGLE_CLIENT_ID:
        email, name = body.demo_email.strip(), (body.demo_name or "Student").strip()
    else:
        raise HTTPException(401, "Sign in with Google")
    return {"token": make_token(email, name), "name": name}


@app.get("/subleaser/me")
def subleaser_me(x_session: str = Header(default="")):
    s = read_token(x_session)
    mine = find_sub(s["e"])
    out = {"name": s["n"], "email": s["e"], "profile": mine, "room": None, "bills": [], "complaints": []}
    if mine:
        out["room"] = next((l for l in db.all_listings() if l["id"] == mine["listing_id"]), None)
        out["bills"] = [b for b in db.rows("bills") if b["subleaser_id"] == mine["id"]]
        out["complaints"] = [c for c in db.rows("complaints") if c["subleaser_id"] == mine["id"]]
    return out


class SubComplaint(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    details: str = Field(default="", max_length=500)


@app.post("/subleaser/complaints", status_code=201)
def subleaser_complaint(body: SubComplaint, x_session: str = Header(default="")):
    s = read_token(x_session)
    mine = find_sub(s["e"])
    if not mine:
        raise HTTPException(404, "Your owner hasn't added you yet")
    return db.insert("complaints", {"subleaser_id": mine["id"], "title": body.title, "details": body.details})