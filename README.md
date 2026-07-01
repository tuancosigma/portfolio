# COMPUTE - AI Agents for Distributed Computing

Dự án này là trang giới thiệu (Landing Page) cho hệ thống **COMPUTE - AI Agents for Distributed Computing**, được xây dựng trên nền tảng Next.js 16 mới nhất, kết hợp cùng React 19, Tailwind CSS và Three.js/React Three Fiber cho các hiệu ứng 3D.

Dự án cũng chứa một khung xương ứng dụng (Skeleton) React + Redux Toolkit + CodeGraph ở thư mục `src/`.

---

## 📂 Cấu Trúc Thư Mục Dự Án

*   **`app/`**: Thư mục định tuyến (App Router) của Next.js.
    *   `page.tsx`: Trang chính chứa toàn bộ các Section của landing page.
    *   `layout.tsx`: Bố cục gốc của trang (Root Layout), cấu hình phông chữ (`Instrument Sans`, `Instrument Serif`, `JetBrains Mono`) và tích hợp `@vercel/analytics`.
    *   `globals.css`: File cấu hình CSS toàn cục.
*   **`components/`**: Các thành phần giao diện (UI Components).
    *   `landing/`: Chứa các Section chi tiết của Landing Page (Hero, Features, Metrics, Security, pricing, Footer, v.v.).
    *   `ui/`: Chứa các thành phần UI dùng chung được phát triển trên shadcn/ui.
*   **`hooks/`** & **`lib/`**: Các React hooks dùng chung và các hàm tiện ích (`utils.ts`).
*   **`src/`**: Thư mục chứa code mẫu (Skeleton) cho ứng dụng React + Redux Toolkit + CodeGraph (chưa tích hợp trực tiếp vào luồng Next.js hiện tại).
*   **`public/`**: Các tài nguyên tĩnh (hình ảnh, icons).

---

## 🛠 Hướng Dẫn Cài Đặt và Chạy Dự Án

### Yêu cầu hệ thống
*   **Node.js**: Phiên bản 18 trở lên.
*   **npm**: Trình quản lý gói đi kèm Node.js.

### 1. Cài đặt các gói phụ thuộc (Dependencies)
Chạy lệnh sau tại thư mục gốc của dự án để cài đặt tất cả thư viện cần thiết:
```bash
npm install
```

### 2. Khởi chạy dự án ở môi trường phát triển (Development)
Chạy lệnh sau để khởi động máy chủ thử nghiệm tại local:
```bash
npm run dev
```
Sau khi chạy thành công, mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000).

### 3. Biên dịch dự án cho môi trường Production (Build)
Biên dịch mã nguồn sang dạng tối ưu hóa hiệu năng:
```bash
npm run build
```

### 4. Chạy dự án sau khi đã Build
```bash
npm run start
```

---

## 📦 Các Kịch Bản Đóng Gói / Triển Khai Khác

Nếu bạn muốn dựng gói cài đặt hoặc đóng gói dự án theo hình thức khác, vui lòng chọn một trong các phương án sau:

1. **Docker Containerize**: Đóng gói ứng dụng Next.js thành Docker Image để chạy trên mọi môi trường.
2. **Triển khai Cloud**: Hướng dẫn deploy lên Vercel, Netlify hoặc các máy chủ VPS (PM2).
3. **Đóng gói Desktop (Electron)**: Đóng gói trang landing page/ứng dụng thành ứng dụng chạy trên Desktop (Windows/macOS/Linux).
