import psycopg2
import pandas as pd

conn = psycopg2.connect(
    host="localhost",
    database="datn_bds",
    user="postgres",
    password="newpass"
)
cur = conn.cursor()

# Fix table structure for large listing_id (VARCHAR) and NULL handling
cur.execute("""
    DO $$ BEGIN
        ALTER TABLE properties ALTER COLUMN listing_id TYPE VARCHAR(20);
    EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'already varchar';
    END $$;
""")
cur.execute("""
    DO $$ BEGIN
        ALTER TABLE properties ALTER COLUMN bedrooms TYPE INTEGER USING (CASE WHEN bedrooms IS NULL OR bedrooms::text = '' THEN NULL ELSE bedrooms::INTEGER END);
    EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'already integer';
    END $$;
""")
cur.execute("""
    DO $$ BEGIN
        ALTER TABLE properties ALTER COLUMN bathrooms TYPE INTEGER USING (CASE WHEN bathrooms IS NULL OR bathrooms::text = '' THEN NULL ELSE bathrooms::INTEGER END);
    EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'already integer';
    END $$;
""")

# Truncate table
cur.execute("TRUNCATE TABLE properties;")

# Load cleaned data (absolute path)
df = pd.read_csv('c:/Users/quanb/Documents/Kuzi/DATN/datn-project/data_public_cleaned.csv')

print(f"Loading {len(df)} cleaned rows")

count_inserted = 0
for _, row in df.iterrows():
    try:
        listing_id = str(int(row['Listing ID'])) if pd.notna(row['Listing ID']) else ''
        bedrooms = row.get('Bedrooms') if pd.notna(row.get('Bedrooms')) else None
        bathrooms = row.get('Bathrooms') if pd.notna(row.get('Bathrooms')) else None
        property_type = str(row.get('Property Type', ''))[:100] if pd.notna(row.get('Property Type')) else ''
        
        cur.execute("""
            INSERT INTO properties (title, price, area, location, latitude, longitude, geom, listing_id, bedrooms, bathrooms, property_type)
            VALUES (%s, %s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, %s, %s)
        """, (str(row['Title'])[:255], float(row['Price']), float(row['Area']), str(row['Location'])[:255], 
              float(row['Latitude']), float(row['Longitude']), 
              float(row['Longitude']), float(row['Latitude']), 
              listing_id, bedrooms, bathrooms, property_type))
        count_inserted += 1
    except Exception as e:
        print(f"Skip row {count_inserted}: {e}")

conn.commit()

# Check count
cur.execute("SELECT COUNT(*) FROM properties;")
total = cur.fetchone()[0]
print(f"✅ Successfully imported {total} properties to datn_bds.properties!")

cur.close()
conn.close()

