import pandas as pd
import numpy as np
import re
from sqlalchemy import create_engine
import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Load CSV (adjust encoding if needed)
df = pd.read_csv('../data_public.csv', encoding='utf-8')

print(f"Original data: {len(df)} rows")
print(df.columns)

# Clean columns
df = df[['Title', 'Price', 'Area', 'Location', 'Latitude', 'Longitude', 'Bedrooms', 'Bathrooms', 'Property Type', 'Listing ID']].copy()

# Clean Price (tỷ VND)
df['Price'] = df['Price'].astype(str).str.replace('tỷ', '').str.replace('.', '').str.replace(',', '').astype(float)

# Clean Area (m2)
df['Area'] = df['Area'].astype(str).str.replace('m²', '').str.replace('.', '').str.replace(',', '').astype(float)

# Clean Lat/Lng (handle missing as NaN)
df['Latitude'] = pd.to_numeric(df['Latitude'], errors='coerce')
df['Longitude'] = pd.to_numeric(df['Longitude'], errors='coerce')

# Drop rows without lat/lng or price/area
df = df.dropna(subset=['Latitude', 'Longitude', 'Price', 'Area'])
print(f"After cleaning (with geo): {len(df)} rows")

# Remove outliers (price/area)
q1_price, q3_price = df['Price'].quantile([0.25, 0.75])
iqr_price = q3_price - q1_price
df = df[(df['Price'] >= q1_price - 1.5*iqr_price) & (df['Price'] <= q3_price + 1.5*iqr_price)]

q1_area, q3_area = df['Area'].quantile([0.25, 0.75])
iqr_area = q3_area - q1_area
df = df[(df['Area'] >= q1_area - 1.5*iqr_area) & (df['Area'] <= q3_area + 1.5*iqr_area)]

print(f"After outlier removal: {len(df)} rows")
print(df.describe())

# Save cleaned CSV
df.to_csv('../data_public_cleaned.csv', index=False, encoding='utf-8')
print("✅ Cleaned data saved to data_public_cleaned.csv")

# Connect to PG and create geom
conn = psycopg2.connect(
    host="localhost",
    database="datn_bds",
    user="postgres",
    password="newpass"
)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Insert cleaned data (limit first)
for _, row in df.head(1000).iterrows():
    cur.execute("""
        INSERT INTO properties (title, price, area, location, latitude, longitude, geom, listing_id, bedrooms, bathrooms, property_type)
        VALUES (%s, %s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, %s, %s)
        ON CONFLICT (listing_id) DO NOTHING
    """, (row['Title'], row['Price'], row['Area'], row['Location'], row['Latitude'], row['Longitude'], 
          row['Longitude'], row['Latitude'], row['Listing ID'], row['Bedrooms'], row['Bathrooms'], row['Property Type']))

conn.commit()
cur.close()
conn.close()
print("✅ Data imported to PG (first 1000 rows)")

print("GIAI ĐOẠN 2 ready! Run: python scripts/clean_data.py")
