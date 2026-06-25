// Parse tiếng Việt (tự nhiên) -> intent + conditions để truy vấn properties.

function normalizeText(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/đồng/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePriceVNDToBillion(str) {
  // str có thể là: "3", "3,5", "2.5"
  const s = String(str || "")
    .trim()
    .replace(/,/g, ".");
  const num = Number(s);
  if (!Number.isFinite(num)) return null;
  return num; // đơn vị tỷ (vd "3" => 3 tỷ)
}

// Chuẩn hóa theo dataset thực tế.
// Dataset đang lưu theo ví dụ:
//   4.6 tỷ -> 46000
//   9.9 tỷ -> 99000
//   20 tỷ  -> 200000
// => nghĩa là DB đang lưu price = priceBillion * 10000
const PRICE_BILLION_TO_DB_MULTIPLIER = 10000;

function convertBillionToDBPrice(priceBillion) {
  if (priceBillion == null) return null;
  if (!Number.isFinite(Number(priceBillion))) return null;
  return Number(priceBillion) * PRICE_BILLION_TO_DB_MULTIPLIER;
}

// Heuristic: một số dataset scale area (x10 hoặc x100). Ta nhận theo dữ liệu thực tế:
// Hiện tại code sẽ tự động convert theo ngưỡng phổ biến.
// - nếu người dùng hỏi ~100m² nhưng DB đang chứa ~1000 hoặc ~10000 thì sẽ convert trước.
const AREA_DB_SCALE_CANDIDATES = [1, 10, 100];
function normalizeAreaForDB(areaM2) {
  if (areaM2 == null) return null;
  const a = Number(areaM2);
  if (!Number.isFinite(a)) return null;

  // Nếu không có tín hiệu scale thì giữ nguyên.
  // Tự động chọn scale dựa vào việc nhiều khả năng area DB nằm trong khoảng 100..50000.
  // Ví dụ: 80–150m² -> DB có thể là 800–1500 (x10) hoặc 8000–15000 (x100).
  const targetRanges = [
    { min: 100, max: 5000 }, // x10
    { min: 1000, max: 50000 }, // x100
  ];

  for (const scale of AREA_DB_SCALE_CANDIDATES) {
    const v = a * scale;
    const inSomeRange = targetRanges.some((r) => v >= r.min && v <= r.max);
    if (inSomeRange) return v;
  }

  // fallback: giữ nguyên
  return a;
}

function extractPriceRangeVietnam(text) {
  // Trả về { minPrice, maxPrice } theo đơn vị tỷ (vd 3 nghĩa là 3 tỷ)
  // Backend properties.price là numeric: có thể đang lưu theo "tỷ" hay "VND".
  // Trong app hiện tại dùng minPrice/maxPrice truyền vào query trực tiếp.
  // UI presets gán "3".."20" => backend so sánh numeric với các giá trị đó.
  // => giả định properties.price đang lưu theo đơn vị "tỷ".

  const t = text;

  // Dưới / Trên
  // "dưới 3 tỷ" | "< 3 tỷ" | "ít hơn 3 tỷ"
  let m = t.match(
    /(dưới|trước|ít hơn|<)\s*([0-9]+(?:[\.,][0-9]+)?)\s*(tỷ|ty|billion)/i,
  );
  if (m) {
    const maxB = parsePriceVNDToBillion(m[2]);
    if (maxB !== null) return { minPrice: null, maxPrice: maxB };
  }

  m = t.match(/(trên|hơn|>=|>)\s*([0-9]+(?:[\.,][0-9]+)?)\s*(tỷ|ty|billion)/i);
  if (m) {
    const minB = parsePriceVNDToBillion(m[2]);
    if (minB !== null) return { minPrice: minB, maxPrice: null };
  }

  // "3 - 5 tỷ", "từ 3 đến 5 tỷ", "3 đến 5"
  m = t.match(
    /(từ|between|từ\s+)?\s*([0-9]+(?:[\.,][0-9]+)?)\s*(tỷ|ty|billion)\s*(đến|-)\s*([0-9]+(?:[\.,][0-9]+)?)\s*(tỷ|ty|billion)?/i,
  );
  if (m) {
    const minB = parsePriceVNDToBillion(m[2]);
    const maxB = parsePriceVNDToBillion(m[5]);
    if (minB !== null && maxB !== null) {
      return { minPrice: minB, maxPrice: maxB };
    }
  }

  // "3-5" không có "tỷ" (fallback)
  m = t.match(/([0-9]+(?:[\.,][0-9]+)?)\s*(đến|-)\s*([0-9]+(?:[\.,][0-9]+)?)/i);
  if (m && t.includes("tỷ")) {
    const minB = parsePriceVNDToBillion(m[1]);
    const maxB = parsePriceVNDToBillion(m[3]);
    if (minB !== null && maxB !== null)
      return { minPrice: minB, maxPrice: maxB };
  }

  return { minPrice: null, maxPrice: null };
}

function extractAreaRangeVietnam(text) {
  const t = text;

  let m = t.match(/(dưới|<|ít hơn)\s*([0-9]+(?:[\.,][0-9]+)?)\s*(m2|m²|sqm)/i);
  if (m) {
    const maxA = Number(String(m[2]).replace(/,/g, "."));
    if (Number.isFinite(maxA)) return { minArea: null, maxArea: maxA };
  }

  m = t.match(/(trên|hơn|>)\s*([0-9]+(?:[\.,][0-9]+)?)\s*(m2|m²|sqm)/i);
  if (m) {
    const minA = Number(String(m[2]).replace(/,/g, "."));
    if (Number.isFinite(minA)) return { minArea: minA, maxArea: null };
  }

  m = t.match(
    /([0-9]+(?:[\.,][0-9]+)?)\s*(đến|-)\s*([0-9]+(?:[\.,][0-9]+)?)\s*(m2|m²|sqm)?/i,
  );
  if (
    m &&
    (t.includes("m2") ||
      t.includes("m²") ||
      t.includes("sqm") ||
      /m/.test(m[4] || ""))
  ) {
    const minA = Number(String(m[1]).replace(/,/g, "."));
    const maxA = Number(String(m[3]).replace(/,/g, "."));
    if (Number.isFinite(minA) && Number.isFinite(maxA)) {
      return { minArea: minA, maxArea: maxA };
    }
  }

  return { minArea: null, maxArea: null };
}

function extractPropertyType(text) {
  // Chuẩn hóa theo mapping yêu cầu (DB đang dùng property_type dạng text)
  const normalized = text;

  const mapping = [
    { re: /(căn hộ|can ho|chung cư|chungcu)/i, type: "Căn hộ chung cư" },
    { re: /(nhà riêng|nha rieng|biệt thự|biet thu|villa)/i, type: "Nhà riêng" },
    { re: /(đất nền|dat nen|đất|dat)/i, type: "Đất" },
    {
      re: /(kho xưởng|kho xuong|kho|nhà xưởng|nha xuong|xưởng|xuong|kho nhà xưởng)/i,
      type: "Kho, nhà xưởng",
    },
    // fallback từ khóa “chung cư” (tránh lệch chính tả)
    { re: /(chung cư)/i, type: "Căn hộ chung cư" },
  ];

  for (const m of mapping) {
    if (m.re.test(normalized)) return m.type;
  }
  return null;
}

function extractLocation(text) {
  // Fuzzy: backend sẽ match LIKE trên location.
  // Ta cố gắng lấy cụm "ở ...", "tại ...", hoặc token quận/thành phố.

  // Patterns: "ở Thủ Đức", "tại Bình Thạnh", "quận 7" ...
  const candidates = [];

  let m = text.match(/(?:ở|tại|khu vực|quận|huyện)\s+([^,\n]+)/i);
  if (m?.[1]) {
    candidates.push(m[1].trim());
  }

  // bắt riêng "quận X"
  m = text.match(/quận\s*\d+\s*[^,\n]*/i);
  if (m?.[0]) candidates.push(m[0].trim());

  // Thủ Đức / Bình Thạnh / Tân Phú ... (fallback danh sách)
  const localList = [
    "thủ đức",
    "thu duc",
    "bình thạnh",
    "binh thanh",
    "tân phú",
    "tan phu",
    "quận 7",
    "quan 7",
  ];
  for (const item of localList) {
    if (text.includes(item)) {
      // trả về đúng string giống item (sẽ được backend fuzzy match)
      candidates.push(item);
    }
  }

  if (!candidates.length) return null;

  // lấy candidate dài nhất (thường chứa đủ cụm)
  candidates.sort((a, b) => b.length - a.length);
  return String(candidates[0]).trim();
}

function detectIntent(text) {
  const t = text;

  // Các câu hỏi phổ biến: trả danh sách chức năng trợ lý (không truy vấn).
  const helpRe =
    /(\b(ti\x00\x80m ki\x00\x82m\b|help|h\u1ed7 tr\u1ee3|h\x00\u1ea3 tr\u1ee3|h\x00\u1b0\u1edbng d\u1eabn sử d\u1ee5ng|h\x00\u01b0\u1edbng d\u1eabn sử d\u1ee5ng|b\u1ea1n c\x00e2n\u00a0\bbi\u1ebft|b\u1ea1n c\x00f3 th\u1ec3\u00a0\b l\u00e0m\u00a0\b\b|b\u1ea1n c\x00f3 th\u1ec3\u00a0\b l\u00e0m gì|\tnoi|t\u00f4i n\x00ean h\u1ecfi? hỏi gì|t\u00f4i n\x00ean hỏi gì|b\u1ea1n c\x00f3 th\u1ec3 l\u00e0m gì|c\u00e1ch\s+\u0111\u1eb7t\s+\u00adh|t\u1ed5ng quan|h\u01a1n d\u1eabn|h\u01b0\u1edbng\s+d\u1eabn|h\u1ecfi)\b)/i;
  if (
    helpRe.test(t) ||
    /\b(\u0111i\u1ec1u\s+ki\u1ec7n|b\u1ea1n c\x00f3 th\u1ec3|\u0111\u1eb7t\s+\u0111i\u1ec1u\s+ki\u1ec7n|huong dan|huong\s+d\u1eabn|help)\b/i.test(
      t,
    )
  ) {
    return { type: "HELP" };
  }

  // Ngoài phạm vi bất động sản.
  // Các từ khóa phổ biến cho hỏi trời, sức khỏe, tin tức, toán... sẽ bị coi là ngoài phạm vi.
  const outRe =
    /(th\u1eddi\s+ti\u1ebft|th\u1eddi\s+ti\u1ebft\b|thoi\s\u0111i\u1ec1m|th\u1edd\u1ea7n|th\u1eddi\u0111i\u1ec3m|th\u1eddi\u00a0gian|th\u1edbi\s+ti\u1ebft|thoi\s+ti\u1ebft|th\u1eddi\u0111\u1ec3m|th\u1eddi\u00a0t\u0111|\b\d{1,2}(\/|\-)?\d{1,2}(\/|\-)?\d{2,4}\b|th\u1ef1c\s+h\u00f2ng\b|tin\s+\u0111\u1ed3n|tin\s+t\u1ee9c|b\u1ecbnh\s+lu\u1eadn|s\u1ee9c\s+kh\u1ecfe|\u0111au|\u0111\u1ea7u\s+\u0111au|ch\u1ee9ng|c\u1ea3m\s+\u1ee9ng|\u1ee9ng\s+ph\u00f2ng|to\u00e1n|l\u00e0m\s+to\u00e1n|gi\u1ea3i\s+ph\u00e1p|ch\u1ebf\s+\u1ea1y|v\u00ed\s+d\u1ee5|code|program|react|node|python|javascript|ng\u1eef ph\u1ea3i|h\u1ecfi\s+\u1ede? g\u1ecdi)/i;
  const outGenericQ =
    /(h\u00f4m\s+nay\s+|ai\s+|c\u1ea3m\s+|l\u00e0m\s+g\u00ec|l\u1ecbch\s+|gi\u00fa|gi\u00e1|c\u00f3\s+n\u00ean|\b\w+\s+\w+\s+l\u00e0\s+g\u00ec\b)/i;
  if (
    outRe.test(t) &&
    !/(b\u1ea\u1ea5t\s+\u0111\u1ed9ng\s+s\u1ea3n|nh\u00e0|c\u0103n\s+h\u1ed9|\u0111\u1ea5t\s+|bi\u1ec7t\s+th\u1ee7|chung\s+\c\u00e2|kho\s+x\u01b0\u1ea9|kho\s+\x75\u0111ong)/i.test(
      t,
    )
  ) {
    return { type: "OUT_OF_SCOPE" };
  }

  // COUNT/Search.
  const isCount =
    /(\u0111\u1ebfm|bao\s+nhi\u00eau|how\s+many|c\u00f3\s+bao\s+nhi\u00eau|s\u1ed1\s+l\u01b0\u1ee3ng)/i.test(
      t,
    );
  if (isCount) return { type: "COUNT" };

  // Mặc định SEARCH (có thể rỗng điều kiện).
  return { type: "SEARCH" };
}

function hasAtLeastOneCondition(conditions) {
  return (
    conditions &&
    (conditions.minPrice != null ||
      conditions.maxPrice != null ||
      conditions.minArea != null ||
      conditions.maxArea != null ||
      !!conditions.property_type ||
      !!conditions.location)
  );
}

function parseChatMessage(message) {
  const t = normalizeText(message);
  const intent = detectIntent(t);

  // HELP / OUT_OF_SCOPE không cần điều kiện tìm kiếm.
  if (intent.type === "HELP" || intent.type === "OUT_OF_SCOPE") {
    return {
      intent,
      conditions: {
        minPrice: null,
        maxPrice: null,
        minArea: null,
        maxArea: null,
        property_type: null,
        location: null,
        q: null,
      },
    };
  }

  const price = extractPriceRangeVietnam(t);
  const area = extractAreaRangeVietnam(t);
  const propertyType = extractPropertyType(t);
  const location = extractLocation(t);

  // Convert về đúng đơn vị DB trước khi query
  const minPriceDB = convertBillionToDBPrice(price.minPrice);
  const maxPriceDB = convertBillionToDBPrice(price.maxPrice);
  const minAreaDB = normalizeAreaForDB(area.minArea);
  const maxAreaDB = normalizeAreaForDB(area.maxArea);

  const conditions = {
    minPrice: minPriceDB,
    maxPrice: maxPriceDB,
    minArea: minAreaDB,
    maxArea: maxAreaDB,
    property_type: propertyType,
    location,
    q: null,
  };

  const enoughSignals = hasAtLeastOneCondition(conditions);

  return {
    intent,
    conditions,
    meta: {
      enoughSignals,
    },
  };
}

module.exports = {
  parseChatMessage,
};
