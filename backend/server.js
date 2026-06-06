const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

// -------------------- Auth (JWT + bcrypt) --------------------

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
}

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { full_name, email, password } = req.body || {};

    if (!full_name || !String(full_name).trim()) {
      return res
        .status(400)
        .json({ success: false, error: "full_name is required" });
    }
    if (!email || !String(email).trim()) {
      return res
        .status(400)
        .json({ success: false, error: "email is required" });
    }
    if (!password || !String(password)) {
      return res
        .status(400)
        .json({ success: false, error: "password is required" });
    }

    const emailLower = String(email).trim().toLowerCase();

    const existsRes = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [emailLower],
    );
    if (existsRes?.rows?.length) {
      return res
        .status(409)
        .json({ success: false, error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const insertRes = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, created_at`,
      [String(full_name).trim(), emailLower, passwordHash, "user"],
    );

    const row = insertRes?.rows?.[0];
    return res.status(201).json({
      success: true,
      message: "Register successful",
      user: row,
    });
  } catch (err) {
    console.error("[POST /api/auth/register] error:", err);
    return res.status(500).json({ success: false, error: "Register failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !String(email).trim()) {
      return res
        .status(400)
        .json({ success: false, error: "email is required" });
    }
    if (!password || !String(password)) {
      return res
        .status(400)
        .json({ success: false, error: "password is required" });
    }

    const emailLower = String(email).trim().toLowerCase();

    const userRes = await pool.query(
      `SELECT id, full_name, email, password_hash, role
       FROM users WHERE email = $1 LIMIT 1`,
      [emailLower],
    );

    const user = userRes?.rows?.[0];
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[POST /api/auth/login] error:", err);
    return res.status(500).json({ success: false, error: "Login failed" });
  }
});

// Me
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const meRes = await pool.query(
      `SELECT id, full_name, email, role, created_at FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );

    const me = meRes?.rows?.[0];
    if (!me) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({ success: true, user: me });
  } catch (err) {
    console.error("[GET /api/auth/me] error:", err);
    return res.status(500).json({ success: false, error: "Fetch user failed" });
  }
});

// -------------------- Properties endpoint (PostGIS) --------------------

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
      location,
      minBedrooms,
      minBathrooms,
      sort,
    } = req.query;

    const p = Math.max(1, parseInt(page));
    const l = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (p - 1) * l;

    // Không filter theo bán kính nếu client không truyền lat/lng/radius.
    // Điều này đảm bảo mở trang lần đầu sẽ load toàn bộ dữ liệu (không WHERE theo khoảng cách).
    const latNum = lat ? parseFloat(lat) : null;
    const lngNum = lng ? parseFloat(lng) : null;
    const radiusM = radius ? parseInt(radius) : null;

    const whereClauses = [];
    const values = [];

    // PostGIS distance filter (chỉ thêm khi có đủ tham số)
    if (
      latNum !== null &&
      lngNum !== null &&
      Number.isFinite(latNum) &&
      Number.isFinite(lngNum) &&
      radiusM !== null &&
      Number.isFinite(radiusM)
    ) {
      values.push(lngNum, latNum, radiusM);
      whereClauses.push(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )`,
      );
    }

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

    // Location (khu vực) filter by `location` field
    // Preset có thể viết tắt (vd: "TP Thủ Đức") nên match theo cả preset đầy đủ
    // và token cuối cùng (vd: "Thủ Đức") để giảm trường hợp trả về 0.
    if (location !== undefined && location !== "") {
      const locRaw = String(location).trim();
      const locLower = locRaw.toLowerCase();
      const lastToken =
        locRaw.split(/\s+/).filter(Boolean).pop()?.toLowerCase() || locLower;

      values.push(`%${locLower}%`, `%${lastToken}%`);
      whereClauses.push(
        `LOWER(COALESCE(location, '')) LIKE $${values.length - 1} OR LOWER(COALESCE(location, '')) LIKE $${values.length}`,
      );
    }

    // Bedrooms / Bathrooms (min only)
    if (minBedrooms !== undefined && minBedrooms !== "") {
      const mb = parseInt(minBedrooms);
      if (Number.isFinite(mb) && mb > 0) {
        values.push(mb);
        whereClauses.push(`bedrooms >= $${values.length}`);
      }
    }

    if (minBathrooms !== undefined && minBathrooms !== "") {
      const mB = parseInt(minBathrooms);
      if (Number.isFinite(mB) && mB > 0) {
        values.push(mB);
        whereClauses.push(`bathrooms >= $${values.length}`);
      }
    }

    // Type filter (property_type) - fuzzy matching
    if (type !== undefined && type !== "") {
      const t = `%${String(type).trim().toLowerCase()}%`;
      values.push(t);
      whereClauses.push(
        `LOWER(COALESCE(property_type, '')) LIKE $${values.length}`,
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

    // LIMIT/OFFSET: dùng indices dựa trên số lượng values hiện tại.
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

    const total = countRes.rows?.[0]?.total ?? 0;
    const totalPages = total > 0 ? Math.ceil(total / l) : 0;

    res.json({
      data: Array.isArray(dataRes.rows) ? dataRes.rows : [],
      total,
      page: p,
      limit: l,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
