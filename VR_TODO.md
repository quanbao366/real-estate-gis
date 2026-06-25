# VR 360 upgrade - checklist

- [ ] Cài `three` cho frontend (đã gặp lỗi npm liên quan folder đang bị lock/EPERM)
- [ ] Sửa `frontend/app/_components/VirtualTourModal.jsx`:
  - [ ] Render panorama bằng Three.js WebGL: SphereGeometry (scale -1,1,1)
  - [ ] TextureLoader load `virtualTourUrl`
  - [ ] PerspectiveCamera + drag mouse/touch xoay 360
  - [ ] Dùng requestAnimationFrame, không dùng state lưu rotation
  - [ ] Cleanup renderer/scene/geometry/material/texture khi đóng modal
  - [ ] Resize responsive theo container
  - [ ] Giữ message lỗi: "Ảnh VR không đúng định dạng panorama 360"
  - [ ] Giữ ESC + click overlay đóng modal, giữ nút "Quay lại"
