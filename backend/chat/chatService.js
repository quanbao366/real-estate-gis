const { parseChatMessage } = require("./chatParser");

function summarizeConditions(conditions) {
  const parts = [];
  if (conditions.minPrice != null || conditions.maxPrice != null) {
    if (conditions.minPrice != null && conditions.maxPrice != null) {
      parts.push(`giá ${conditions.minPrice}–${conditions.maxPrice} tỷ`);
    } else if (conditions.minPrice != null) {
      parts.push(`giá từ ${conditions.minPrice} tỷ`);
    } else {
      parts.push(`giá dưới ${conditions.maxPrice} tỷ`);
    }
  }

  if (conditions.location) parts.push(`khu vực ${conditions.location}`);
  if (conditions.property_type) parts.push(`loại ${conditions.property_type}`);

  if (conditions.minArea != null || conditions.maxArea != null) {
    if (conditions.minArea != null && conditions.maxArea != null) {
      parts.push(`diện tích ${conditions.minArea}–${conditions.maxArea} m²`);
    } else if (conditions.minArea != null) {
      parts.push(`diện tích ≥ ${conditions.minArea} m²`);
    } else {
      parts.push(`diện tích ≤ ${conditions.maxArea} m²`);
    }
  }

  return parts.length ? parts.join(", ") : "một số tiêu chí phù hợp";
}

function buildWhere(conditions, values) {
  const where = [];

  // price
  if (conditions.minPrice !== null && conditions.minPrice !== undefined) {
    values.push(conditions.minPrice);
    where.push(`price >= $${values.length}`);
  }
  if (conditions.maxPrice !== null && conditions.maxPrice !== undefined) {
    values.push(conditions.maxPrice);
    where.push(`price <= $${values.length}`);
  }

  // area
  if (conditions.minArea !== null && conditions.minArea !== undefined) {
    values.push(conditions.minArea);
    where.push(`area >= $${values.length}`);
  }
  if (conditions.maxArea !== null && conditions.maxArea !== undefined) {
    values.push(conditions.maxArea);
    where.push(`area <= $${values.length}`);
  }

  // location (khu vực) - fuzzy linh hoạt theo token phường/xã/quận/đường
  if (conditions.location) {
    const tokens = normalizeLocationTokens(conditions.location);

    // luôn cho phép match theo chuỗi đầy đủ
    const locRaw = String(conditions.location).trim();
    const locLower = locRaw.toLowerCase();
    const allTokens = Array.from(new Set([locLower, ...tokens]));

    const tokenClauses = [];
    for (const tok of allTokens) {
      values.push(`%${tok}%`);
      tokenClauses.push(`LOWER(COALESCE(location, '')) LIKE $${values.length}`);
    }

    if (tokenClauses.length) {
      where.push(`(${tokenClauses.join(" OR ")})`);
    }
  }

  // property_type
  if (conditions.property_type) {
    const t = `%${String(conditions.property_type).trim().toLowerCase()}%`;
    values.push(t);
    where.push(`LOWER(COALESCE(property_type, '')) LIKE $${values.length}`);
  }

  return where.length ? `WHERE ${where.join(" AND ")}` : "";
}

function normalizeLocationTokens(locationRaw) {
  const s = String(locationRaw || "").toLowerCase();

  // Các token để match linh hoạt trong location (DB đã có thể chứa chuỗi đầy đủ)
  const tokens = new Set();

  // tách theo dấu phẩy/ khoảng trắng
  for (const part of s.split(/[,/\n]+/g)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // thêm cả phần đầy đủ
    tokens.add(trimmed);
    // thêm token cuối nếu có
    const last = trimmed.split(/\s+/).filter(Boolean).pop();
    if (last) tokens.add(last);
  }

  // thêm token theo mẫu phường/xã/quận/đường
  const reTokens = [
    /((?:phường|xã)\s*[^\s,\n]+)/gi,
    /(quận\s*[^\s,\n]+)/gi,
    /(huyện\s*[^\s,\n]+)/gi,
    /((?:đường|đg)\s*[^\s,\n]+)/gi,
  ];

  for (const re of reTokens) {
    const matches = s.match(re);
    if (matches && matches.length) {
      for (const m of matches) tokens.add(m.trim());
    }
  }

  // lọc token quá ngắn
  return Array.from(tokens)
    .map(String)
    .filter((t) => t.length >= 3);
}

function buildNoResultAnswer(intentType, conditions, count) {
  const condText = summarizeConditions(conditions);

  // Gợi ý: nới dải giá/khu vực/loại (không cần thực thi lại query ở hiện tại)
  const suggestions = [];
  if (conditions.minPrice != null || conditions.maxPrice != null) {
    suggestions.push(
      "Bạn có thể thử nới khoảng giá (tăng trần hoặc giảm mức tối thiểu) để tăng số lượng tin phù hợp.",
    );
  } else {
    suggestions.push(
      "Bạn có thể thử thêm khoảng giá để bot tìm chính xác hơn.",
    );
  }

  if (conditions.location) {
    suggestions.push(
      "Hoặc mở rộng khu vực lân cận (ví dụ theo quận lân cận) để có thêm lựa chọn.",
    );
  } else {
    suggestions.push(
      "Bạn có thể cho biết khu vực mong muốn (ví dụ Thủ Đức, Bình Thạnh...).",
    );
  }

  if (conditions.property_type) {
    suggestions.push(
      "Nếu bạn linh hoạt về loại hình, hãy thử đổi loại (đất/căn hộ/nhà riêng...) để xem thêm kết quả.",
    );
  } else {
    suggestions.push("Bạn có thể cho biết loại bất động sản bạn quan tâm.");
  }

  const sample1 = conditions.location
    ? `Ví dụ: “Tầm ${conditions.minPrice ?? 3}-${conditions.maxPrice ?? 6} tỷ ở ${conditions.location}”`
    : `Ví dụ: “Dưới 5 tỷ ở Thủ Đức”`;
  const sample2 = conditions.property_type
    ? `Ví dụ: “${conditions.property_type} tầm giá rộng hơn ở ${conditions.location ?? "khu vực bạn chọn"}”`
    : `Ví dụ: “Nhà riêng dưới 7 tỷ ở Quận 7”`;
  const sample3 =
    conditions.minArea != null || conditions.maxArea != null
      ? `Ví dụ: “Diện tích ${conditions.minArea ?? 60}-${conditions.maxArea ?? 100}m² ở ${conditions.location ?? "khu vực bất kỳ"}”`
      : `Ví dụ: “Căn hộ 2 phòng ngủ dưới 6 tỷ ở Bình Thạnh”`;

  if (intentType === "COUNT") {
    return `Hiện tại chưa có bất động sản phù hợp với tiêu chí: ${condText}.

Bạn có thể thử điều chỉnh:
- ${suggestions[0] ?? "Nới khoảng giá"}
- ${suggestions[1] ?? "Mở rộng khu vực"}
- ${suggestions[2] ?? "Đổi loại hình"}

Gợi ý câu hỏi khác:
- ${sample1}
- ${sample2}
- ${sample3}`;
  }

  return `Mình chưa tìm thấy tin phù hợp với tiêu chí của bạn (${condText}).

Bạn có thể thử điều chỉnh:
- ${suggestions[0] ?? "Nới khoảng giá"}
- ${suggestions[1] ?? "Mở rộng khu vực"}
- ${suggestions[2] ?? "Đổi loại hình"}

Gợi ý câu hỏi khác:
- ${sample1}
- ${sample2}
- ${sample3}`;
}

function buildTextAnswer(intentType, conditions, count) {
  const condText = summarizeConditions(conditions);

  if (typeof count === "number" && count <= 0) {
    return buildNoResultAnswer(intentType, conditions, count);
  }

  if (intentType === "COUNT") {
    if (count === 1) {
      return `Có 1 bất động sản phù hợp với tiêu chí của bạn (${condText}). Bạn muốn mình xem chi tiết tin nào không?`;
    }
    return `Có ${count} bất động sản phù hợp với tiêu chí: ${condText}.

Nếu bạn muốn, mình sẽ gợi ý một vài tin phù hợp nhất ở dưới.`;
  }

  // SEARCH
  const tail =
    count > 5
      ? "Dưới đây là 5 tin phù hợp nhất"
      : "Dưới đây là những tin phù hợp";
  return `${tail} theo tiêu chí: ${condText} (hiện có ${count} tin).
`;
}

function formatPropertyForChat(p) {
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    price: p.price,
    area: p.area,
    location: p.location,
    property_type: p.property_type,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    latitude: p.latitude,
    longitude: p.longitude,
    listing_id: p.listing_id,
  };
}

async function handleChat({ message, pool }) {
  const parsed = parseChatMessage(message);
  const { intent, conditions, meta } = parsed;

  // build where
  const values = [];
  const whereSQL = buildWhere(conditions, values);

  // count
  const countQuery = `SELECT COUNT(*)::int AS total FROM properties ${whereSQL}`;

  // select top 5
  // ưu tiên giá desc (giống default /api/properties)
  const dataQuery = `
    SELECT
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
    ${whereSQL}
    ORDER BY price DESC NULLS LAST
    LIMIT 5
  `;

  // Debug: log conditions + converted values + SQL condition cuối
  // (không ảnh hưởng API; chỉ log server console)
  try {
    const debug = {
      message: String(message || ""),
      intent: intent?.type,
      conditionsParsed: conditions,
      sqlWhere: whereSQL,
      values,
    };
    console.log("[CHAT_DEBUG]", JSON.stringify(debug));
  } catch (e) {
    // ignore debug failures
  }

  const [countRes, dataRes] = await Promise.all([
    pool.query(countQuery, values),
    pool.query(dataQuery, values),
  ]);

  const count = countRes?.rows?.[0]?.total ?? 0;

  const properties = Array.isArray(dataRes?.rows) ? dataRes.rows : [];

  // HELP / OUT_OF_SCOPE / không đủ tín hiệu
  if (intent?.type === "HELP") {
    const text =
      'Mình có thể giúp bạn tra cứu và gợi ý bất động sản với các tiêu chí như: giá, diện tích, khu vực và loại hình.\n\nBạn có thể hỏi theo ví dụ:\n- "Dưới 3 tỷ ở Thủ Đức"\n- "Loại đất ở Quận 7"\n- "Đếm bao nhiêu căn hộ dưới 5 tỷ ở Bình Thạnh"\n\nNếu bạn chưa biết nên hỏi gì, thử: "Tôi nên hỏi gì?"';

    return {
      success: true,
      text,
      properties: [],
      count: 0,
      intent: intent.type,
      conditions,
    };
  }

  if (intent?.type === "OUT_OF_SCOPE") {
    const text =
      "Mình là trợ lý bất động sản của hệ thống, không thể trả lời các câu hỏi ngoài phạm vi (ví dụ: thời tiết).\n\nBạn có thể hỏi lại theo hướng tra cứu/gợi ý bất động sản, như: giá bao nhiêu, ở khu vực nào (quận/thành phố), diện tích bao nhiêu, loại hình gì (căn hộ/đất/nhà riêng...).";
    return {
      success: true,
      text,
      properties: [],
      count: 0,
      intent: intent.type,
      conditions,
    };
  }

  if (meta && meta.enoughSignals === false) {
    const text =
      'Mình chưa hiểu rõ tiêu chí tìm kiếm từ câu của bạn.\n\nBạn cho mình biết giúp 1–2 thông tin như: giá, khu vực (quận), hoặc loại bất động sản nhé.\n\nVí dụ câu hỏi hợp lệ:\n- "Dưới 5 tỷ ở Bình Thạnh"\n- "Nhà riêng trên 60m² ở Thủ Đức"\n- "Căn hộ giá 3-6 tỷ ở Quận 7"\n- "Đếm bao nhiêu căn hộ dưới 7 tỷ ở Tân Phú"\n- "Loại đất ở Quận 7';
    return {
      success: true,
      text,
      properties: [],
      count: 0,
      intent: intent.type,
      conditions,
    };
  }

  const text = buildTextAnswer(intent.type, conditions, count);

  return {
    success: true,
    text,

    properties: properties
      .slice(0, 5)
      .map(formatPropertyForChat)
      .filter(Boolean),
    count,
    intent: intent.type,
    conditions,
  };
}

module.exports = {
  handleChat,
};
