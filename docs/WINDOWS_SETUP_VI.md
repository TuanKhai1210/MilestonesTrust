# Thiết lập Windows trước khi nối TideCloak

Đã kiểm tra trên máy phát triển ngày 22/10/2026: Windows 11 Home, khoảng 16 GB RAM, Node.js 24.18.0. Gói WSL Store 2.7.8 có mặt nhưng `wsl --status` báo `Wsl/CallMsi/Install/REGDB_E_CLASSNOTREG`; chưa có WslService hoặc `C:\Program Files\WSL\wsl.exe`. Docker Desktop từ chối cài vì **VirtualMachinePlatform chưa bật**. Không diễn giải giá trị WMI VirtualizationFirmwareEnabled=false là bằng chứng BIOS tắt khi hypervisor đã hiện diện.

## Bước đang cần người dùng làm

Lưu các notebook/tài liệu đang làm trước. Mở **PowerShell → Run as administrator** và chạy:

```powershell
Set-Location -LiteralPath 'C:\Users\tuank\Documents\ChatGPT\RMIT HACKATHON 2026\milestone-trust'
Get-Content -LiteralPath .\scripts\enable-windows-wsl.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\enable-windows-wsl.ps1 -WhatIf
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\enable-windows-wsl.ps1
```

`ExecutionPolicy Bypass` chỉ áp dụng cho tiến trình chạy file này, không đổi policy của máy. `-WhatIf` chỉ trình bày thao tác dự kiến; cần bỏ `-WhatIf` ở lệnh cuối để thực hiện. Script cần quyền Administrator do bật Windows optional feature và cài WSL MSI. Nó kiểm hash/chữ ký Microsoft trước khi dùng bộ cài, bật VirtualMachinePlatform với NoRestart, cài WSL MSI nếu thiếu executable/service, không xóa distro hoặc tự restart. Lỗi cài MSI phải được xử lý theo log, không tiếp tục như đã thành công.

Nếu script chạy thành công, **Restart Windows** khi đã lưu công việc, rồi quay lại chat và báo “đã khởi động lại”. Nếu có lỗi, gửi đoạn lỗi cuối; không gửi mật khẩu/token.

## Các bộ cài đã chuẩn bị ngoài Git

Thư mục trên máy: `%USERPROFILE%\Downloads\MilestoneTrust-setup`.

| File | Bằng chứng đã kiểm tra |
|---|---|
| `Docker Desktop_4.96.1_Machine_X64_exe_en-US.exe` | winget source chính thức; SHA256 `87950d4659b9485c664b37a375276d4fc7bb88f948ddcb81314b843424bfac32`; chữ ký Docker Inc hợp lệ |
| `wsl.2.7.8.0.x64.msi` | Microsoft GitHub release 2.7.8; SHA256 `928506b99d6caad14e5a8938e3e3fd9d1c839df3ed4f40639bdb095fbf24cbf8`; chữ ký Microsoft Corporation hợp lệ |

Các file installer lớn không nằm trong repo. WSL MSI dùng đúng version của gói Store đã thấy trên máy; không khẳng định đây là release WSL mới nhất. Nếu dùng máy khác, kiểm tra lại môi trường và tải từ nguồn chính thức trước khi dùng script này.

## Sau khi restart

1. Kiểm tra `wsl --version`, `wsl --status` và WslService. Cài Docker Desktop per-user bằng bộ cài đã tải; mở Docker Desktop và tự đọc/chấp nhận điều khoản nếu đồng ý. Không cần trả phí chỉ để chạy thử; không tự đăng ký gói nào.
2. Đợi Docker engine chạy, xác nhận `docker info` thành công. Chỉ có Docker CLI chưa đủ.
3. Chạy TideCloak bằng compose, kiểm tra server `http://localhost:8080`, rồi thiết lập realm/client theo [hướng dẫn live](TIDECLOAK_SETUP.md). Nhóm tự nhập email, chấp nhận điều khoản Tide và thiết lập thông tin đăng nhập trong enclave.
4. Xuất adapter public client về `config/tidecloak.json`, bật auth TideCloak và kiểm chứng đăng nhập/quyền/QEA. Chưa đánh dấu các bước này PASS khi chưa có kết quả thực.

## Nguồn chính thức

- [Microsoft: cài WSL, gồm phương án MSI offline và VirtualMachinePlatform](https://learn.microsoft.com/en-us/windows/wsl/install#offline-install)
- [Microsoft WSL 2.7.8 và các assets](https://github.com/microsoft/WSL/releases/tag/2.7.8)
- [Docker Desktop trên Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [TideCloak Quickstart](https://docs.tide.org/get-started/Tidecloak%20Quickstart)
