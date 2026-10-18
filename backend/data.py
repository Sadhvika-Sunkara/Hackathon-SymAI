CAMPUSES = {
    "macquarie": {"name": "Macquarie University", "lat": -33.7738, "lng": 151.1127},
    "usyd": {"name": "University of Sydney", "lat": -33.8888, "lng": 151.1873},
    "unsw": {"name": "UNSW Kensington", "lat": -33.9173, "lng": 151.2313},
    "uts": {"name": "UTS", "lat": -33.8832, "lng": 151.2007},
    "wsu": {"name": "Western Sydney Uni (Parramatta)", "lat": -33.8161, "lng": 151.0038},
}

STATIONS = [
    {"name": "Macquarie University", "lat": -33.7762, "lng": 151.1177},
    {"name": "North Ryde", "lat": -33.7957, "lng": 151.1308},
    {"name": "Epping", "lat": -33.7727, "lng": 151.0820},
    {"name": "Central", "lat": -33.8832, "lng": 151.2064},
    {"name": "Redfern", "lat": -33.8929, "lng": 151.1985},
    {"name": "Macdonaldtown", "lat": -33.8953, "lng": 151.1866},
    {"name": "Newtown", "lat": -33.8979, "lng": 151.1790},
    {"name": "Kensington (light rail)", "lat": -33.9066, "lng": 151.2220},
    {"name": "Parramatta", "lat": -33.8176, "lng": 151.0054},
    {"name": "Westmead", "lat": -33.8082, "lng": 150.9876},
]

LISTINGS = [
    {"id": 1, "title": "Sunny room in Newtown terrace", "suburb": "Newtown", "rent": 280, "household": "female_only", "lat": -33.8985, "lng": 151.1795},
    {"id": 2, "title": "Furnished room near Macquarie Uni", "suburb": "Macquarie Park", "rent": 260, "household": "female_preferred", "lat": -33.7790, "lng": 151.1180},
    {"id": 3, "title": "Share house, 5 min to Central", "suburb": "Surry Hills", "rent": 340, "household": "any", "lat": -33.8830, "lng": 151.2110},
    {"id": 4, "title": "Quiet room in Kensington unit", "suburb": "Kensington", "rent": 300, "household": "male_preferred", "lat": -33.9070, "lng": 151.2210},
    {"id": 5, "title": "Female-only flat near UNSW", "suburb": "Kingsford", "rent": 270, "household": "female_only", "lat": -33.9120, "lng": 151.2260},
    {"id": 6, "title": "Room by Parramatta station", "suburb": "Parramatta", "rent": 220, "household": "any", "lat": -33.8190, "lng": 151.0070},
    {"id": 7, "title": "Large room in Epping house", "suburb": "Epping", "rent": 240, "household": "female_preferred", "lat": -33.7740, "lng": 151.0850},
    {"id": 8, "title": "Room near Redfern, close to USYD", "suburb": "Redfern", "rent": 310, "household": "any", "lat": -33.8915, "lng": 151.1960},
]


SUBURBS = {
    "Newtown": (-33.8979, 151.1790),
    "Enmore": (-33.9000, 151.1750),
    "Erskineville": (-33.9017, 151.1853),
    "Glebe": (-33.8800, 151.1850),
    "Ultimo": (-33.8810, 151.1980),
    "Haymarket": (-33.8800, 151.2040),
    "Surry Hills": (-33.8860, 151.2110),
    "Redfern": (-33.8930, 151.2040),
    "Zetland": (-33.9070, 151.2100),
    "Kensington": (-33.9100, 151.2220),
    "Kingsford": (-33.9230, 151.2270),
    "Randwick": (-33.9140, 151.2420),
    "Macquarie Park": (-33.7769, 151.1280),
    "Marsfield": (-33.7790, 151.1030),
    "North Ryde": (-33.7957, 151.1308),
    "Epping": (-33.7727, 151.0820),
    "Chatswood": (-33.7960, 151.1830),
    "Parramatta": (-33.8150, 151.0011),
    "Harris Park": (-33.8230, 151.0090),
    "Westmead": (-33.8082, 150.9876),
}

# ---------- Australia-wide ----------
# Places anyone can measure distance from: cities, universities and Sydney suburbs.
CITIES = {
    "sydney": ("Sydney CBD", -33.8688, 151.2093),
    "melbourne": ("Melbourne CBD", -37.8136, 144.9631),
    "brisbane": ("Brisbane CBD", -27.4698, 153.0251),
    "perth": ("Perth CBD", -31.9523, 115.8613),
    "adelaide": ("Adelaide CBD", -34.9285, 138.6007),
    "canberra": ("Canberra City", -35.2809, 149.1300),
    "goldcoast": ("Gold Coast", -28.0167, 153.4000),
    "hobart": ("Hobart", -42.8821, 147.3272),
    "darwin": ("Darwin", -12.4634, 130.8456),
}

UNIVERSITIES = {
    **{k: (v["name"], v["lat"], v["lng"]) for k, v in CAMPUSES.items()},
    "unimelb": ("University of Melbourne", -37.7963, 144.9614),
    "monash": ("Monash University (Clayton)", -37.9105, 145.1362),
    "uq": ("University of Queensland", -27.4975, 153.0137),
    "qut": ("QUT Gardens Point", -27.4772, 153.0280),
    "uwa": ("University of Western Australia", -31.9806, 115.8178),
    "curtin": ("Curtin University", -32.0062, 115.8944),
    "adelaideuni": ("University of Adelaide", -34.9189, 138.6057),
    "anu": ("Australian National University", -35.2777, 149.1185),
}

CITY_SUBURBS = {
    "Carlton": (-37.8001, 144.9671), "Fitzroy": (-37.7984, 144.9785), "Richmond": (-37.8230, 144.9980),
    "Brunswick": (-37.7670, 144.9620), "Clayton": (-37.9150, 145.1300),
    "South Brisbane": (-27.4800, 153.0170), "St Lucia": (-27.4990, 153.0050), "Kelvin Grove": (-27.4500, 153.0150),
    "Fortitude Valley": (-27.4570, 153.0340),
    "Subiaco": (-31.9480, 115.8250), "Northbridge": (-31.9470, 115.8580), "Crawley": (-31.9830, 115.8160),
    "Bentley": (-32.0040, 115.8940),
    "North Adelaide": (-34.9065, 138.5930), "Kent Town": (-34.9230, 138.6220),
    "Braddon": (-35.2750, 149.1350), "Acton": (-35.2790, 149.1150),
}
ALL_SUBURBS = {**SUBURBS, **CITY_SUBURBS}

STATIONS += [
    {"name": "Flinders Street", "lat": -37.8183, "lng": 144.9671},
    {"name": "Melbourne Central", "lat": -37.8100, "lng": 144.9628},
    {"name": "Richmond (VIC)", "lat": -37.8240, "lng": 144.9900},
    {"name": "Jewell", "lat": -37.7752, "lng": 144.9587},
    {"name": "Clayton", "lat": -37.9246, "lng": 145.1205},
    {"name": "Brisbane Central", "lat": -27.4660, "lng": 153.0260},
    {"name": "Roma Street", "lat": -27.4655, "lng": 153.0190},
    {"name": "South Brisbane", "lat": -27.4760, "lng": 153.0180},
    {"name": "Fortitude Valley", "lat": -27.4565, "lng": 153.0330},
    {"name": "Perth", "lat": -31.9510, "lng": 115.8600},
    {"name": "Subiaco", "lat": -31.9460, "lng": 115.8240},
    {"name": "Elizabeth Quay", "lat": -31.9580, "lng": 115.8560},
    {"name": "Adelaide", "lat": -34.9210, "lng": 138.5960},
    {"name": "Alinga Street (light rail)", "lat": -35.2780, "lng": 149.1310},
]

# Fictional sample homes outside Sydney (no real addresses).
CITY_LISTINGS = [
    ("Bright room near Melbourne Uni", "Carlton", 320, "female_preferred"),
    ("Terrace share house in Fitzroy", "Fitzroy", 300, "any"),
    ("Quiet room by Richmond station", "Richmond", 290, "female_only"),
    ("Brunswick room, tram at the door", "Brunswick", 260, "any"),
    ("Room close to Monash Clayton", "Clayton", 240, "male_preferred"),
    ("South Bank studio room", "South Brisbane", 310, "any"),
    ("Room near UQ St Lucia", "St Lucia", 270, "female_only"),
    ("Kelvin Grove share near QUT", "Kelvin Grove", 250, "female_preferred"),
    ("Valley apartment room", "Fortitude Valley", 295, "any"),
    ("Subiaco room near the train", "Subiaco", 280, "female_preferred"),
    ("Northbridge city room", "Northbridge", 300, "any"),
    ("Room walking to UWA", "Crawley", 290, "female_only"),
    ("Bentley house near Curtin", "Bentley", 220, "male_preferred"),
    ("North Adelaide terrace room", "North Adelaide", 260, "female_only"),
    ("Kent Town share house", "Kent Town", 230, "any"),
    ("Braddon apartment room", "Braddon", 310, "female_preferred"),
    ("Room next to ANU", "Acton", 280, "any"),
]
