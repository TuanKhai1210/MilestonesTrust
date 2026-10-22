# Chạy và luyện demo khi chưa có TideCloak

Phần này dùng danh tính và tiền giả lập để nhóm làm UI, kiểm thử nghiệp vụ và luyện thuyết trình độc lập với Tide server. Không dùng kết quả này làm bằng chứng login/QEA thật. Tên làm việc vẫn là MilestoneTrust; chưa chốt tên thương hiệu mới.

## 1. Mở app từ đầu

Trên máy hiện tại, mở PowerShell bình thường:

```powershell
Set-Location -LiteralPath 'C:\Users\tuank\Documents\ChatGPT\RMIT HACKATHON 2026\milestone-trust'
npm ci
npm run demo:fresh
```

Máy đã có `node_modules` thì không cần chạy lại `npm ci` mỗi lần. Mở **http://localhost:3000** và giữ terminal đang chạy. Nếu app đang chạy ở một terminal khác, dừng tiến trình app đó bằng Ctrl+C trước; không chạy hai Next dev server trên cùng checkout.

`demo:fresh` tạo database mới có tên riêng trong `data/`, không xóa lần luyện trước hoặc database Tide. `npm run demo` dùng lại `data/demo.sqlite`. Database của các lần fresh vẫn được giữ trong `data/`; chạy fresh lần nữa là một phiên mới từ M1.

Góc trên phải phải có **Simulated identity:** và bộ chọn bốn vai trò. Trang có banner **LOCAL DEMO** nói rõ danh tính mô phỏng. Ban đầu bạn là public visitor: chọn tài khoản rồi bấm **Simulate sign-in**. Server tạo phiên giả lập 30 phút và trả roles. Muốn đổi tài khoản, bấm **Sign out (demo)** để thu hồi phiên cũ, chọn tài khoản khác rồi đăng nhập lại. Reload trang cần đăng nhập lại vì token demo chỉ giữ trong bộ nhớ browser. Không nhập password/email hoặc tạo tài khoản Tide thật trong flow này.

Nếu thấy nút Sign in with TideCloak thì bạn đang chạy chế độ live, hãy dừng app và dùng đúng lệnh demo ở trên. **Refresh workspace** chỉ tải lại dữ liệu server; muốn phiên sạch thì dừng app và dùng `demo:fresh`. Khi bảng bên dưới yêu cầu đổi vai trò, luôn đăng xuất và đăng nhập tài khoản mô phỏng tương ứng trước.

## 2. Thực hiện một vòng M1 → M2

| Bước | Chọn vai trò / thao tác | Kết quả phải thấy |
|---|---|---|
| 1 | Project team → tab **Project Workspace** → M1, điền recipient/purpose, bấm **Submit New Disbursement Request** | Request mới với số tiền cố định 20,000,000 VND; chờ hai approvals |
| 2 | Sponsor → tab **Approval Center** → đọc nội dung, bấm **Duyệt (Sponsor)** | 1 / 2 Approvals; chưa thể chi |
| 3 | Independent auditor → đọc cùng request/version, bấm **Duyệt (Auditor)** | Đủ 2 approvals |
| 4 | Sponsor → **Thực thi lệnh chi (Mock)** | Dashboard tổng chi 20,000,000; có payment mô phỏng |
| 5 | Project team → tab **Project Workspace** → chọn M1 ở phần evidence, nhập mô tả synthetic rồi submit | Nội dung minh chứng được lưu server |
| 6 | Independent auditor → tab **Approval Center** → **Xác thực & Mở khóa giai đoạn tiếp** | M1 VERIFIED; M2 ELIGIBLE; tiền đã chi vẫn 20,000,000 |

Minh chứng mẫu: `Synthetic demo: 10 filters delivered and installed; reviewed against the prepared delivery note.` Đây là câu giả lập để luyện, không phải minh chứng giao hàng thật.

M2 mở nghĩa là được tạo yêu cầu 30 triệu mới. Vẫn phải có hai approvals và một lệnh release mới. Lặp tương tự cho M3 50 triệu nếu muốn luyện đủ cả chiến dịch; cuối cùng ba mốc Verified và tổng mock payments 100 triệu.

## 3. Luyện các tình huống bị chặn

- **Chỉ một approval:** sau bước Sponsor duyệt, release phải còn khóa. API cũng phải từ chối, không chỉ UI.
- **Sửa nội dung sau khi duyệt:** trước khi chi, chuyển Project team → **Project Workspace**, chọn đúng mốc, đổi recipient/purpose → **Update Request & Recompute Hash (Resets Approvals)**. Version tăng, cả hai approvals bị xóa; phải đọc/duyệt lại. Số tiền phải bằng phân bổ cố định của mốc.
- **Platform admin:** vai trò này không có quyền duyệt chi hoặc xác minh giao hàng chỉ vì là admin. Các thao tác sai quyền bị API trả 403 trong kiểm thử.
- **Chi lặp:** API retry sau khi đã trả tiền không tạo payment thứ hai. Bộ test kiểm điều này; UI sau khi trả xong không có nút tạo thêm payment cho cùng request.
- **Thiếu minh chứng:** Auditor chưa được verify khi Team chưa submit evidence.

## 4. Kiểm tra tự động

```powershell
npm run check
npm run build
npm run doctor
```

`check` hiện có 27 tests: nghiệp vụ, API route handlers, phiên demo, frontend và token ký bằng khóa ES256 tạo riêng cho test. Session tests kiểm đăng nhập, server roles, hết hạn, thu hồi phiên và việc cấm mô phỏng trong live/production. Frontend tests kiểm dữ liệu persist, lỗi API không bị đổi thành thành công giả, public roles và việc ẩn bộ chọn demo trong live UI. API test hoàn tất cả ba mốc trên database tạm và kiểm các yêu cầu sai origin/content type/JSON/quyền. Các test không dùng tài khoản Tide hay gọi realm thật. Log từ chối chữ ký/exp/issuer trong test âm tính là kết quả mong đợi; kết luận theo số pass/fail cuối.

`doctor` kiểm Node, Docker CLI/engine và việc có adapter; adapter hiện diện chưa chứng minh login/QEA thành công. `build` kiểm bản production; demo identities bị cấm trong production nên dùng lệnh demo để luyện UI.

## 5. Luyện phần kể chuyện

Lời mở đầu tiếng Anh:

> A donor wants to help a community rebuild, but handing every decision to one person creates a trust gap. MilestoneTrust lets support move forward in stages. The project team requests funding; a sponsor and an independent auditor review the same request. After a simulated release, verified delivery opens the next stage. Responsibility is shared, and progress stays visible.

Trong phiên luyện local, nói rõ: **“These identities and payments are simulated. Live TideCloak governance is still being verified.”**

Khi Tide thật sẵn sàng, nối thêm phần QEA trong [kịch bản hai phút](DEMO_SCRIPT.md): một protected role change còn pending dưới quorum, rồi được áp dụng sau đủ approvals; tài khoản đích đăng nhập/refresh lấy token mới và thể hiện quyền thực. Không thay cảnh này bằng role picker local hoặc bảng trạng thái giả.

## 6. Đầu ra còn thiếu trước khi nộp

Đối chiếu [verification snapshot](VERIFICATION.md). Hiện chưa có MP4 hoàn chỉnh, tài khoản Tide của các bên, login app thật hoặc QEA pending/applied PASS. Sau khi các phần đó chạy được, quay video khoảng hai phút, `.mp4` dưới 100 MB đặt `demo/demo.mp4`, rồi gửi repo qua form theo yêu cầu người dùng. Repo public có code chưa đồng nghĩa đã nộp bài.
