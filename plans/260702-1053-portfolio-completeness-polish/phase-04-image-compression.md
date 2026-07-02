---
phase: 4
title: Image Compression
status: completed
priority: P3
effort: 30m
dependencies: []
---

# Phase 4: Image Compression

## Overview
Nén 2 ảnh local nặng nhất mà KHÔNG thay đổi hình ảnh hiển thị: `whale.png` (2.3MB, pricing-section) và `bridge.png` (1.1MB, cta-section). Kỹ thuật giống lần nén `shield.png` (690KB→132KB): resize về kích thước hiển thị thực + quantize PNG8/độ sâu 8-bit + strip metadata. Cân nhắc thêm 4 ảnh security JPG (433–633KB) nếu chất lượng giữ được.

## Requirements
- Functional: ảnh hiển thị KHÔNG khác biệt nhìn thấy được ở kích thước render thực tế.
- Non-functional: tổng dung lượng `public/images/` giảm ≥60%; không đổi tên file/đường dẫn (không phải sửa code).

## Related Code Files
- Modify (binary): `public/images/whale.png`, `public/images/bridge.png`
- Optional: `public/images/{isolated,encrypted,audit,permissions}.jpg` — JPG re-encode quality 80 + strip
- KHÔNG sửa file code nào.

## Implementation Steps
1. Đo kích thước render thực: whale hiển thị trong cột `lg:col-span-5` (~600px max), bridge trong khung `w-[600px] h-[650px]` → target width ~1200px (2x retina).
2. Backup tạm ra scratchpad trước khi nén (phòng cần so sánh/revert).
3. `magick whale.png -resize 1200x1200\> -depth 8 -strip` → nếu vẫn lớn, thử `-colors 256 PNG8:` và so bằng mắt (whale là ảnh organic gradient — PNG8 có thể banding; nếu banding rõ thì dừng ở 8-bit truecolor hoặc chuyển JPG q85 nếu không cần alpha... whale.png cần kiểm tra alpha channel trước: `magick identify -format "%A"`).
4. Tương tự bridge.png.
5. JPG security 4 ảnh: `magick X.jpg -strip -quality 80` — chỉ giữ nếu không thấy khác biệt.
6. So sánh trước/sau bằng mắt trên localhost:3000 (pricing + CTA + playbooks sections).
7. Build sạch; commit binary.

## Success Criteria
- [ ] whale.png ≤ 400KB, bridge.png ≤ 300KB (hoặc mức tốt nhất không suy giảm nhìn thấy)
- [ ] Không khác biệt thị giác ở kích thước hiển thị thật
- [ ] Không sửa dòng code nào
- [ ] Build sạch

## Risk Assessment
Thấp. Rủi ro duy nhất: quantize làm banding trên gradient mượt — mitigate bằng so sánh bằng mắt từng ảnh, giữ backup trong scratchpad, sẵn sàng revert từng file qua git.
