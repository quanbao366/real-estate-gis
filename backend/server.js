const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "datn_bds",
  password: process.env.DB_PASSWORD || "newpass",
  port: process.env.DB_PORT || 5432,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

// Test endpoint
app.get("/", (req, res) => {
  res.json({ message: "DATN Backend running!" });
});

// Properties endpoint (PostGIS)
app.get("/api/properties/:id", async (req, res) => {
  // NOTE: Chạy query lấy latitude/longitude từ PostGIS geom nếu có.
  // Trường hợp bảng/ cột không có geom thì fallback về latitude/longitude.

  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         id,
         title,
         price,
         area,
         location,
         COALESCE(latitude, ST_Y(geom::geometry)) as latitude,
         COALESCE(longitude, ST_X(geom::geometry)) as longitude,
         listing_id,
         bedrooms,
         bathrooms,
         property_type
       FROM properties
       WHERE id = $1
       LIMIT 1`,
      [id],
    );

    const row = result?.rows?.[0];
    if (!row) {
      return res
        .status(404)
        .json({ success: false, error: "Property not found" });
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error("[GET /api/properties/:id] error:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/api/properties", async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 10000, // meters
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      q,
      type,
      sort,
    } = req.query;

    const p = Math.max(1, parseInt(page));
    const l = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (p - 1) * l;

    const latNum = lat ? parseFloat(lat) : 10.8231;
    const lngNum = lng ? parseFloat(lng) : 106.6297;
    const radiusM = parseInt(radius);

    const whereClauses = [];
    const values = [];

    // PostGIS distance filter (first)
    values.push(lngNum, latNum, radiusM);
    whereClauses.push(
      `ST_DWithin(
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )`,
    );

    // Price / area
    if (minPrice !== undefined && minPrice !== "") {
      values.push(parseFloat(minPrice));
      whereClauses.push(`price >= $${values.length}`);
    }
    if (maxPrice !== undefined && maxPrice !== "") {
      values.push(parseFloat(maxPrice));
      whereClauses.push(`price <= $${values.length}`);
    }
    if (minArea !== undefined && minArea !== "") {
      values.push(parseFloat(minArea));
      whereClauses.push(`area >= $${values.length}`);
    }
    if (maxArea !== undefined && maxArea !== "") {
      values.push(parseFloat(maxArea));
      whereClauses.push(`area <= $${values.length}`);
    }

    // Type filter (property_type) - fuzzy matching
    // type (frontend) is Vietnamese; DB may not be consistent => use ILIKE with normalization
    if (type !== undefined && type !== "") {
      const t = String(type).trim();
      values.push(t);
      whereClauses.push(
        `LOWER(property_type) ILIKE LOWER($${values.length}) OR LOWER(property_type) ILIKE LOWER($${values.length})`,
      );
    }

    // Search query (title / location / property_type)
    if (q !== undefined && q !== "") {
      const qq = `%${String(q).toLowerCase()}%`;
      values.push(qq);
      whereClauses.push(
        `(
          LOWER(COALESCE(title, '')) LIKE $${values.length}
          OR LOWER(COALESCE(location, '')) LIKE $${values.length}
          OR LOWER(COALESCE(property_type, '')) LIKE $${values.length}
        )`,
      );
    }

    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    const sortKey = sort ? String(sort) : "";

    let orderBySQL = "ORDER BY price DESC NULLS LAST";
    if (sortKey === "newest") {
      orderBySQL = "ORDER BY id DESC";
    } else if (sortKey === "price_asc") {
      orderBySQL = "ORDER BY price ASC NULLS LAST";
    } else if (sortKey === "price_desc") {
      orderBySQL = "ORDER BY price DESC NULLS LAST";
    } else if (sortKey === "area_desc") {
      orderBySQL = "ORDER BY area DESC NULLS LAST";
    }

    const dataQuery = `
      SELECT *
      FROM properties
      ${whereSQL}
      ${orderBySQL}
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM properties
      ${whereSQL}
    `;

    const dataValues = [...values, l, offset];

    const [countRes, dataRes] = await Promise.all([
      pool.query(countQuery, values),
      pool.query(dataQuery, dataValues),
    ]);

    res.json({
      items: Array.isArray(dataRes.rows) ? dataRes.rows : [],
      total: countRes.rows?.[0]?.total ?? 0,
      page: p,
      limit: l,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
