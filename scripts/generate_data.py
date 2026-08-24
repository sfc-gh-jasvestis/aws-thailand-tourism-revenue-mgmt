"""
Synthetic Data Generator — Revenue Management & Dynamic Pricing
Generates realistic tourism data for 120 Thai resort properties.

Usage:
  SNOWFLAKE_CONNECTION_NAME=default python scripts/generate_data.py
  python scripts/generate_data.py --quick   # Smaller dataset for testing
"""
import argparse
import json
import os
import random
import uuid
from datetime import date, datetime, timedelta

import snowflake.connector

# ── Config ──
DESTINATIONS = ['Phuket', 'Koh Samui', 'Bangkok', 'Chiang Mai']
DEST_PROPS = {'Phuket': 35, 'Koh Samui': 25, 'Bangkok': 40, 'Chiang Mai': 20}
CATEGORIES = ['Luxury', 'Upper Upscale', 'Upscale', 'Midscale']
SOURCE_MARKETS = ['China', 'Europe', 'US', 'ASEAN', 'Korea', 'Japan', 'Australia', 'Domestic']
CHANNELS = ['Direct', 'Agoda', 'Booking.com', 'Expedia', 'Wholesaler', 'GDS']
OTAS = ['Direct', 'Agoda', 'Booking.com', 'Expedia', 'Traveloka', 'Trip.com']
ROOM_TYPES = ['Deluxe', 'Premier', 'Suite', 'Villa', 'Pool Villa']
SEASONS = ['High', 'Shoulder', 'Low', 'Songkran', 'NYE']
DOC_TYPES = ['Pricing Strategy', 'Market Brief', 'Competitor Analysis', 'Revenue Report']

# Base rates by category (THB)
BASE_RATES = {'Luxury': 8500, 'Upper Upscale': 5200, 'Upscale': 3200, 'Midscale': 1800}
# Seasonal multipliers
SEASON_MULT = {'High': 1.4, 'Shoulder': 1.0, 'Low': 0.7, 'Songkran': 1.6, 'NYE': 2.0}

THAI_FIRST = ['Siriporn', 'Rattanachai', 'Pimchanok', 'Somchai', 'Wanida', 'Thananon']
THAI_LAST = ['Chaiyaporn', 'Wutthisak', 'Srisangwan', 'Limthongkul', 'Kanchanawat']


def get_connection():
    conn_name = os.getenv('SNOWFLAKE_CONNECTION_NAME')
    if conn_name:
        return snowflake.connector.connect(connection_name=conn_name)
    return snowflake.connector.connect(
        account=os.getenv('SNOWFLAKE_ACCOUNT', ''),
        user=os.getenv('SNOWFLAKE_USER', ''),
        password=os.getenv('SNOWFLAKE_PASSWORD', ''),
        role='ACCOUNTADMIN',
        warehouse='TOURISM_WH',
        database='TOURISM_REVENUE',
    )


def get_season(d: date) -> str:
    month = d.month
    if month in (4,):
        return 'Songkran'
    if month == 12 and d.day >= 24:
        return 'NYE'
    if month in (11, 12, 1, 2, 3):
        return 'High'
    if month in (4, 5, 10):
        return 'Shoulder'
    return 'Low'


def gen_properties():
    props = []
    for dest, count in DEST_PROPS.items():
        for i in range(count):
            cat = random.choice(CATEGORIES)
            props.append({
                'PROPERTY_ID': f'{dest[:3].upper()}-{i+1:03d}',
                'PROPERTY_NAME': f'{dest} {cat} Resort {i+1}',
                'DESTINATION': dest,
                'CATEGORY': cat,
                'ROOMS_TOTAL': random.choice([80, 120, 150, 200, 250, 300, 350]),
                'STAR_RATING': round(random.uniform(3.5, 5.0), 1),
                'OWNER_GROUP': f'{random.choice(THAI_LAST)} Hotels Group',
                'LATITUDE': {'Phuket': 7.88, 'Koh Samui': 9.51, 'Bangkok': 13.75, 'Chiang Mai': 18.79}[dest] + random.uniform(-0.1, 0.1),
                'LONGITUDE': {'Phuket': 98.38, 'Koh Samui': 100.06, 'Bangkok': 100.52, 'Chiang Mai': 98.98}[dest] + random.uniform(-0.1, 0.1),
                'OPENED_DATE': str(date(random.randint(2005, 2022), random.randint(1, 12), 1)),
            })
    return props


def gen_reservations(properties, days=365, quick=False):
    rows = []
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    per_prop = 50 if quick else 2100
    for prop in properties:
        base_rate = BASE_RATES[prop['CATEGORY']]
        for _ in range(per_prop):
            book_date = start_date + timedelta(days=random.randint(0, days - 30))
            lead = random.randint(1, 90)
            ci = book_date + timedelta(days=lead)
            nights = random.choices([1, 2, 3, 4, 5, 7], weights=[10, 30, 25, 15, 10, 10])[0]
            season = get_season(ci)
            rate = base_rate * SEASON_MULT[season] * random.uniform(0.85, 1.15)
            rows.append({
                'RESERVATION_ID': str(uuid.uuid4())[:12],
                'PROPERTY_ID': prop['PROPERTY_ID'],
                'GUEST_NATIONALITY': random.choice(['Thai', 'Chinese', 'British', 'German', 'American', 'Korean', 'Japanese', 'Australian', 'Singaporean', 'Malaysian']),
                'SOURCE_MARKET': random.choice(SOURCE_MARKETS),
                'CHANNEL': random.choice(CHANNELS),
                'CHECK_IN': str(ci),
                'CHECK_OUT': str(ci + timedelta(days=nights)),
                'ROOM_NIGHTS': nights,
                'ADR': round(rate, 2),
                'TOTAL_REVENUE': round(rate * nights, 2),
                'STATUS': random.choices(['Confirmed', 'Cancelled', 'No-Show'], weights=[80, 15, 5])[0],
                'BOOKING_DATE': str(book_date),
                'LEAD_TIME_DAYS': lead,
                'ROOM_TYPE': random.choice(ROOM_TYPES),
            })
    return rows


def gen_revenue_actuals(properties, days=365):
    rows = []
    end_date = date.today()
    for prop in properties:
        base_rate = BASE_RATES[prop['CATEGORY']]
        rooms = prop['ROOMS_TOTAL']
        for d in range(days):
            day = end_date - timedelta(days=days - d)
            season = get_season(day)
            occ = random.uniform(0.50, 0.90) * min(SEASON_MULT[season], 1.3)
            occ = min(max(occ, 0.35), 0.98)
            sold = int(rooms * occ)
            adr = base_rate * SEASON_MULT[season] * random.uniform(0.9, 1.1)
            room_rev = sold * adr
            rows.append({
                'PROPERTY_ID': prop['PROPERTY_ID'],
                'REVENUE_DATE': str(day),
                'ROOMS_AVAILABLE': rooms,
                'ROOMS_SOLD': sold,
                'ROOM_REVENUE': round(room_rev, 2),
                'FB_REVENUE': round(room_rev * random.uniform(0.15, 0.35), 2),
                'OTHER_REVENUE': round(room_rev * random.uniform(0.05, 0.15), 2),
                'TOTAL_REVENUE': round(room_rev * random.uniform(1.2, 1.5), 2),
            })
    return rows


def gen_ota_feeds(properties, days=30, quick=False):
    rows = []
    end_date = date.today()
    sample = properties if not quick else properties[:20]
    for prop in sample:
        base_rate = BASE_RATES[prop['CATEGORY']]
        for d in range(days):
            stay = end_date + timedelta(days=d)
            season = get_season(stay)
            for ota in OTAS:
                if ota == 'Direct':
                    # Direct rate varies: sometimes under, sometimes over OTA market
                    rate = base_rate * SEASON_MULT[season] * random.uniform(0.78, 1.22)
                else:
                    rate = base_rate * SEASON_MULT[season] * random.uniform(0.92, 1.12)
                rows.append({
                    'FEED_ID': str(uuid.uuid4())[:12],
                    'PROPERTY_ID': prop['PROPERTY_ID'],
                    'OTA_NAME': ota,
                    'STAY_DATE': str(stay),
                    'ROOM_TYPE': random.choice(ROOM_TYPES),
                    'RATE_THB': round(rate, 2),
                    'RATE_USD': round(rate / 35.5, 2),
                    'AVAILABILITY_STATUS': random.choices(['Available', 'Limited', 'Sold Out'], weights=[70, 20, 10])[0],
                    'SCRAPED_AT': datetime.now().isoformat(),
                })
    return rows


def gen_demand_signals(properties, days=90, quick=False):
    rows = []
    end_date = date.today()
    sample = properties if not quick else properties[:20]
    for prop in sample:
        for market in SOURCE_MARKETS:
            for d in range(days):
                day = end_date - timedelta(days=days - d)
                rows.append({
                    'SIGNAL_ID': str(uuid.uuid4())[:12],
                    'PROPERTY_ID': prop['PROPERTY_ID'],
                    'SOURCE_MARKET': market,
                    'SIGNAL_DATE': str(day),
                    'SEARCH_VOLUME': random.randint(10, 500),
                    'BOOKING_INTENT_SCORE': round(random.uniform(20, 95), 1),
                    'FLIGHT_SEARCHES': random.randint(50, 2000),
                })
    return rows


def gen_comp_set(properties):
    rows = []
    for prop in properties:
        comps = [p for p in properties if p['DESTINATION'] == prop['DESTINATION'] and p['PROPERTY_ID'] != prop['PROPERTY_ID']]
        chosen = random.sample(comps, min(5, len(comps)))
        for c in chosen:
            # Store RevPAR estimate (rate × avg occupancy) so REVPAR_INDEX is meaningful
            comp_adr = BASE_RATES[c['CATEGORY']] * random.uniform(0.9, 1.1)
            comp_occ = random.uniform(0.55, 0.75)
            rows.append({
                'PROPERTY_ID': prop['PROPERTY_ID'],
                'COMP_PROPERTY_ID': c['PROPERTY_ID'],
                'COMP_PROPERTY_NAME': c['PROPERTY_NAME'],
                'COMP_DESTINATION': c['DESTINATION'],
                'COMP_CATEGORY': c['CATEGORY'],
                'COMP_ROOMS_TOTAL': c['ROOMS_TOTAL'],
                'COMP_AVG_RATE': round(comp_adr * comp_occ, 2),
            })
    return rows


def gen_strategy_docs():
    rows = []
    for i in range(100):
        dest = random.choice(DESTINATIONS)
        season = random.choice(SEASONS)
        segment = random.choice(SOURCE_MARKETS)
        doc_type = random.choice(DOC_TYPES)
        rows.append({
            'DOC_ID': f'DOC-{i+1:03d}',
            'TITLE': f'{doc_type}: {dest} {season} Season — {segment} Market',
            'CONTENT': f'This {doc_type.lower()} covers revenue optimization strategies for {dest} properties during {season} season, targeting {segment} travelers. Key recommendations include rate positioning, channel mix optimization, and package bundling for maximum RevPAR. Average ADR target: THB {BASE_RATES[random.choice(CATEGORIES)]:,.0f}. Competitive set index target: 105.',
            'DESTINATION': dest,
            'SEASON': season,
            'MARKET_SEGMENT': segment,
            'DOC_TYPE': doc_type,
            'AUTHOR': f'{random.choice(THAI_FIRST)} {random.choice(THAI_LAST)}',
            'PUBLISH_DATE': str(date.today() - timedelta(days=random.randint(0, 180))),
        })
    return rows


def insert_batch(cursor, table, rows, batch_size=1000):
    if not rows:
        return
    cols = list(rows[0].keys())
    placeholders = ', '.join(['%s'] * len(cols))
    sql = f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({placeholders})"
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        values = [tuple(row[c] for c in cols) for row in batch]
        cursor.executemany(sql, values)
    print(f"  Inserted {len(rows)} rows into {table}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--quick', action='store_true', help='Generate smaller dataset for testing')
    args = parser.parse_args()

    print("Connecting to Snowflake...")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("USE DATABASE TOURISM_REVENUE")
    cur.execute("USE WAREHOUSE TOURISM_WH")

    print("Generating properties (120)...")
    properties = gen_properties()
    cur.execute("USE SCHEMA RAW")
    cur.execute("TRUNCATE TABLE RAW.PROPERTIES")
    insert_batch(cur, 'RAW.PROPERTIES', properties)

    print("Generating competitive set (600)...")
    comp_set = gen_comp_set(properties)
    cur.execute("TRUNCATE TABLE RAW.COMPETITIVE_SET")
    insert_batch(cur, 'RAW.COMPETITIVE_SET', comp_set)

    print("Generating strategy docs (100)...")
    docs = gen_strategy_docs()
    cur.execute("TRUNCATE TABLE RAW.STRATEGY_DOCS")
    insert_batch(cur, 'RAW.STRATEGY_DOCS', docs)

    days = 90 if args.quick else 365
    print(f"Generating revenue actuals ({days} days x 120 properties)...")
    actuals = gen_revenue_actuals(properties, days=days)
    cur.execute("TRUNCATE TABLE RAW.REVENUE_ACTUALS")
    insert_batch(cur, 'RAW.REVENUE_ACTUALS', actuals, batch_size=5000)

    print(f"Generating reservations...")
    reservations = gen_reservations(properties, days=days, quick=args.quick)
    cur.execute("TRUNCATE TABLE RAW.RESERVATIONS")
    insert_batch(cur, 'RAW.RESERVATIONS', reservations, batch_size=5000)

    print("Generating OTA rate feeds (30 days forward)...")
    ota = gen_ota_feeds(properties, days=30, quick=args.quick)
    cur.execute("TRUNCATE TABLE RAW.OTA_RATE_FEEDS")
    insert_batch(cur, 'RAW.OTA_RATE_FEEDS', ota, batch_size=5000)

    signal_days = 30 if args.quick else 90
    print(f"Generating demand signals ({signal_days} days)...")
    signals = gen_demand_signals(properties, days=signal_days, quick=args.quick)
    cur.execute("TRUNCATE TABLE RAW.DEMAND_SIGNALS")
    insert_batch(cur, 'RAW.DEMAND_SIGNALS', signals, batch_size=5000)

    conn.commit()
    cur.close()
    conn.close()
    print("\nDone! All tables populated.")
    print("Run 'snowsql -f snowflake/04_dynamic_tables.sql' to refresh curated layer.")


if __name__ == '__main__':
    main()
