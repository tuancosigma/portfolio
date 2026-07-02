# Favicon + ảnh professional bổ sung cho portfolio

> **Status: COMPLETED (2026-07-02).** Phase 1 favicon ✅ · Phase 2 chuyển fallback SVG tự vẽ (Gemini key free-tier, quota ảnh = 0) ✅ · Phase 3 gắn ảnh ✅ · Phase 4 OG ✅. Code review DONE, build Next + OpenNext sạch. Bonus: nén shield.png 690KB→132KB, icon PNG về 8-bit.

## Context

Site portfolio SOC/Blue Team (Next.js 16, deploy Cloudflare Workers) đã đủ nội dung + hiệu ứng nhưng:
- **Không có favicon** — tab trình duyệt trống. `public/` có sẵn `favicon.svg`, `icon.svg`, `apple-icon.png`... từ template cũ nhưng **không được wire** (Next.js App Router chỉ tự nhận icon đặt trong `app/`).
- 2 trang mới `/projects/[slug]` + `/incident-report` **hoàn toàn text-only**, thiếu visual chuyên nghiệp.
- Section Proof (nền đen) chỉ có text + ASCII pattern.
- OG image share link là text thuần trên nền đen.
- `public/images/shield.png` (690KB) nằm không, không ai tham chiếu.

**Ràng buộc từ user (đã chốt):**
1. **GIỮ NGUYÊN 100%** mọi ảnh + video đang dùng (video Hero, 6 blob PNG, bridge/whale/4 ảnh security). Chỉ THÊM, không thay.
2. Ảnh mới: **tạo bằng AI** (skill `ai-multimodal`, Gemini/Imagen) — phong cách khớp site: dark, bioluminescent, hồng accent `#eca8d6`, chủ đề cybersecurity/SOC.
3. Favicon: **thiết kế mới theo brand** — chữ "TP" hoặc biểu tượng shield/terminal, nền đen + accent hồng.
4. Vị trí ảnh mới: cả 4 chỗ — case study pages, incident report, Proof section, OG image + tận dụng shield.png.

**Điều kiện tiên quyết:** `GEMINI_API_KEY` **chưa có** trong env. Trước Phase 2 phải hỏi user cung cấp key (hoặc chọn fallback SVG-only). Favicon (Phase 1) KHÔNG cần key — làm bằng SVG code thuần.

## Phase 1 — Favicon bộ đầy đủ (không cần API key)

Next.js App Router file conventions — đặt file trong `app/` là tự nhận:

- **`app/icon.svg`** — SVG tự viết: nền đen bo góc, chữ "TP" font mono/display màu trắng + chấm accent `#eca8d6` (kiểu terminal cursor). Vector nên sắc nét mọi size.
- **`app/icon.png`** — 32×32 PNG render từ SVG trên (dùng ImageMagick có sẵn qua skill hoặc sharp trong node_modules nếu có; fallback: chỉ SVG là đủ cho browser hiện đại).
- **`app/apple-icon.png`** — 180×180 PNG cùng design (padding lớn hơn cho iOS).
- Metadata: Next tự sinh `<link rel="icon">` — không cần sửa `layout.tsx`.
- Dọn: xoá các icon mồ côi trong `public/` (`favicon.svg`, `icon.svg`, `icons.svg`, `apple-icon.png`, `icon-dark-32x32.png`, `icon-light-32x32.png`, `placeholder-*`) — không được tham chiếu ở đâu, tránh nhầm lẫn về sau. (Xác nhận lại bằng grep trước khi xoá.)

## Phase 2 — Tạo ảnh AI (cần GEMINI_API_KEY — HỎI USER trước khi chạy)

Dùng `.claude/skills/ai-multimodal` (`gemini_batch_process.py`, python venv `.claude\skills\.venv\Scripts\python.exe`). Tạo 5 ảnh, style prompt chung: *"dark moody cybersecurity aesthetic, bioluminescent pink (#eca8d6) and cherry-blossom accents on black, cinematic, professional, no text"*:

| File đích | Nội dung | Dùng cho |
|---|---|---|
| `public/images/project-waf.png` | WAF/tường lửa trừu tượng — lưới hexagon phát sáng chặn dòng packet đỏ | Hero banner `/projects/barracuda` |
| `public/images/project-ml.png` | Neural network / anomaly detection — cụm node phát sáng, outlier hồng | Hero banner `/projects/ai-threat-detection` |
| `public/images/project-db.png` | Database vault — trụ dữ liệu phát sáng sau lớp khoá | Hero banner `/projects/oracle-db-security` |
| `public/images/report-terminal.png` | Terminal/log stream màn hình tối, dòng log phát sáng | Hero banner `/incident-report` |
| `public/images/proof-evidence.png` | Bàn analyst tối giản — màn hình dashboard phát sáng trong bóng tối | Proof section (ảnh nền phụ, opacity thấp) |

- Chạy `media_optimizer.py` (có sẵn trong skill) nén còn ≤300KB/ảnh (blob hiện tại ~400KB–2.3MB, không làm nặng thêm).
- **Fallback nếu không có key:** tạo 5 SVG gradient-mesh + glow bằng code (vẫn đẹp, nhẹ, nhưng ít chi tiết hơn) — hỏi user chọn.

## Phase 3 — Gắn ảnh vào các trang/section

- **`app/projects/[slug]/page.tsx`**: thêm field `image` vào `lib/projects-data.ts` (3 entry), render banner ảnh full-width trong hero section của trang (giữa breadcrumb và title, có gradient overlay đen để title vẫn đọc rõ — pattern giống hero-section hiện có).
- **`app/incident-report/page.tsx`**: tương tự, banner `report-terminal.png` trong hero.
- **`components/landing/testimonials-section.tsx`** (Proof): thêm `proof-evidence.png` làm layer nền (absolute, opacity ~8%, dưới ASCII pattern) — không đổi layout/carousel.
- **`components/landing/security-section.tsx`** (Playbooks): gắn `shield.png` đang bỏ không vào large visual card (chỗ đang hiện 4 ảnh feature xoay vòng — thêm shield làm ảnh nền tĩnh mờ phía sau, giữ nguyên 4 ảnh xoay).
- Mọi `<img>` mới: có `alt` mô tả (SEO/a11y), `loading="lazy"` (trừ banner trên fold).

## Phase 4 — OG image nâng cấp

`app/opengraph-image.tsx`: giữ text hiện tại, thêm background pattern (grid mờ + radial glow hồng `#eca8d6` góc phải, mô phỏng aesthetic site) bằng JSX/CSS thuần trong `ImageResponse` — không cần ảnh ngoài, không phụ thuộc key.

## Thứ tự & kiểm tra

1. Phase 1 (favicon) → build → xem tab icon trên dev server
2. Hỏi user GEMINI_API_KEY → Phase 2 (gen ảnh) → user duyệt ảnh trước khi gắn
3. Phase 3 (gắn ảnh) → build
4. Phase 4 (OG) → build
5. `npm run build` + `npm run cf:build` sạch; curl các route 200; kiểm tra kích thước ảnh ≤300KB; code-reviewer subagent review cuối.

## Acceptance criteria

- Tab trình duyệt hiện favicon TP brand mới (SVG + PNG + apple-icon).
- 3 trang project + incident-report có banner ảnh AI đúng chủ đề, load nhanh (≤300KB/ảnh, lazy).
- Proof section có visual nền mới; shield.png được dùng; **không ảnh/video cũ nào bị thay/xoá** (trừ icon mồ côi chưa từng được tham chiếu).
- OG image có depth/pattern mới.
- Build Next + OpenNext sạch, mọi route 200.

## Out of scope

- Không đụng video Hero, không thay bất kỳ ảnh đang dùng nào.
- Không thêm thư viện mới (không sharp/next-image config mới nếu không cần).
- Không làm dark/light toggle, không đổi layout section nào.
