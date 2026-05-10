import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

CSV_PATH = 'datn-project/data_public_cleaned.csv'

TABLE = 'properties'

DB = {
    'host': 'localhost',
    'database': 'datn_bds',
    'user': 'postgres',
    'password': 'newpass',
    'port': 5432,
}

# Note: this script assumes table `properties` exists and has columns:
# id, title, price, area, location, latitude, longitude, geom, listing_id,
# bedrooms, bathrooms, property_type

def main():
    df = pd.read_csv(CSV_PATH, encoding='utf-8')
    # Normalize column names
    df.columns = [c.strip() for c in df.columns]

    # Ensure required columns exist
    required = ['Title','Price','Area','Location','Latitude','Longitude','Bedrooms','Bathrooms','Property Type','Listing ID']
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in CSV: {missing}")

    rows = []
    for _, r in df.iterrows():
        title = str(r['Title'])
        price = float(r['Price'])
        area = float(r['Area'])
        location = str(r['Location'])
        lat = float(r['Latitude'])
        lng = float(r['Longitude'])

        bedrooms = r['Bedrooms']
        bathrooms = r['Bathrooms']
        prop_type = str(r['Property Type']) if not pd.isna(r['Property Type']) else None

        # bedrooms/bathrooms can be NaN
        bedrooms = None if pd.isna(bedrooms) else int(bedrooms)
        bathrooms = None if pd.isna(bathrooms) else int(bathrooms)

        listing_id = int(r['Listing ID']) if not pd.isna(r['Listing ID']) else None

        rows.append((
            title,
            price,
            area,
            location,
            lat,
            lng,
            lng,
            lat,
            listing_id,
            bedrooms,
            bathrooms,
            prop_type,
        ))

    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # Bulk insert
    # If you want ON CONFLICT upsert later, ensure `listing_id` has a UNIQUE constraint.
    sql = f"""
    INSERT INTO {TABLE} (
        title, price, area, location, latitude, longitude, geom,
        listing_id, bedrooms, bathrooms, property_type
    ) VALUES %s;
    """


    # Values mapping:
    # title, price, area, location, latitude, longitude, geom_lng, geom_lat, listing_id, bedrooms, bathrooms, property_type
    # But our geom expression needs ST_MakePoint(longitude, latitude)
    # We'll use geom constructed inside VALUES via placeholders.

    # Rebuild rows to match INSERT columns:
    values = []
    for (title, price, area, location, lat, lng, geom_lng, geom_lat, listing_id, bedrooms, bathrooms, prop_type) in rows:
        values.append((title, price, area, location, lat, lng, geom_lng, geom_lat, listing_id, bedrooms, bathrooms, prop_type))

    template = "( %s, %s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s,%s), 4326), %s, %s, %s, %s )"

    execute_values(cur, sql.replace('VALUES %s', f"VALUES %s"), values, template=template)
    conn.commit()
    cur.close()
    conn.close()

    print(f"✅ Imported {len(values)} rows into {TABLE} from {CSV_PATH}")


if __name__ == '__main__':
    main()

