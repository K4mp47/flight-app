from math import radians, sin, cos, sqrt, atan2
from datetime import datetime, timedelta

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # average radius of the Earth in km

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2

    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance = R * c
    return distance  # in km

def round_time_to_nearest_5_minutes(dt_time):
    minutes = dt_time.minute
    remainder = minutes % 5
    if remainder < 3:
        rounded_minutes = minutes - remainder
    else:
        rounded_minutes = minutes + (5 - remainder)

    new_hour = dt_time.hour + (rounded_minutes // 60)
    rounded_minutes = rounded_minutes % 60
    return dt_time.replace(hour=new_hour % 24, minute=rounded_minutes, second=0, microsecond=0)

def calculate_arrival_time(departure_time_str, distance_km):
    departure_time = datetime.strptime(departure_time_str, "%H:%M")
    speed_kmh = 850
    duration_hours = distance_km / speed_kmh
    duration = timedelta(hours=duration_hours)
    raw_arrival = departure_time + duration
    rounded_arrival = round_time_to_nearest_5_minutes(raw_arrival)
    return rounded_arrival.time()

