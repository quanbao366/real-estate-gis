import "./globals.css";
import "./leafletFix.css";

export const metadata = {
  title: "BĐS GIS DATN",
  description: "Website bất động sản sử dụng GIS + PostgreSQL/PostGIS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
