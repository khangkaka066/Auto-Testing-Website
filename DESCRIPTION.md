# Mô tả source code Auto-Testing-Website

Auto-Testing-Website là một nền tảng web giúp người dùng tự động kiểm thử website hoặc ứng dụng web của mình. Người dùng có thể tải source code dạng `.zip` lên hệ thống, hoặc kết nối GitHub để chọn repository và branch cần kiểm thử. Sau đó hệ thống sẽ tự động phân tích mã nguồn, tạo kịch bản kiểm thử, chạy test bằng Playwright và trả về báo cáo kết quả trực quan.

Source code được chia thành hai phần chính: `frontend` và `backend`. Phần frontend được xây dựng bằng React, dùng React Router để điều hướng giữa các trang như landing page, đăng nhập, đăng ký, dashboard, hồ sơ người dùng, trang chạy test, trang theo dõi tiến trình và trang xem báo cáo. Giao diện dashboard cho phép người dùng upload file ZIP, chọn repository GitHub, chọn loại test như UI Testing, API Testing hoặc Functional Testing, xem lịch sử các lần chạy test, điểm chất lượng gần nhất, số credit còn lại và trạng thái kết nối GitHub.

Phần backend được xây dựng bằng Node.js và Express. Backend cung cấp các API cho xác thực người dùng, quản lý hồ sơ, upload avatar, kết nối GitHub OAuth, lấy danh sách repository/branch, upload source code, khởi chạy pipeline test và truy vấn trạng thái/báo cáo test. Dữ liệu người dùng, lịch sử test, log xác thực và thông tin project được lưu thông qua Supabase. Source code tải lên cũng có thể được lưu trữ kèm manifest trên Cloudflare R2.

Trung tâm của hệ thống là pipeline tự động trong `backend/src/pipeline`. Pipeline gồm nhiều bước: quét cấu trúc project, phát hiện frontend/backend/database, phân tích source code bằng AI, lập kế hoạch test case, lọc các test phù hợp, sinh file Playwright, kiểm tra tính hợp lệ của test, tự sửa test lỗi nếu cần, chạy test và tạo báo cáo cuối cùng. Mỗi lần chạy tạo một workspace riêng, lưu lại các file trung gian như kết quả phân tích, kế hoạch test, test spec, log chạy service, report Playwright và báo cáo tổng hợp.

Hệ thống có cơ chế theo dõi tiến trình theo thời gian gần thực. Khi người dùng bắt đầu test, backend tạo một job nền và frontend gọi API định kỳ để cập nhật trạng thái. Người dùng có thể thấy pipeline đang ở bước nào, phần trăm hoàn thành, tiến độ nhỏ theo từng nhóm file, thông báo lỗi nếu thất bại và nút xem báo cáo khi hoàn tất.

Báo cáo cuối cùng tập trung vào khả năng đọc hiểu nhanh: điểm sức khỏe website trên thang 100, tổng số test, số test pass/fail, thời gian chạy và danh sách lỗi phát hiện được. Mỗi lỗi có thông tin trang hoặc file liên quan, mức độ nghiêm trọng và mô tả vấn đề. Nhờ đó người dùng không chỉ biết website có lỗi hay không, mà còn có dữ liệu cụ thể để ưu tiên sửa lỗi.

Tóm lại, source code này triển khai một sản phẩm kiểm thử tự động có đầy đủ luồng từ đăng nhập, nạp mã nguồn, phân tích bằng AI, sinh test Playwright, chạy kiểm thử, theo dõi tiến trình đến xem báo cáo. Đây là nền tảng phù hợp để mở rộng thêm nhiều loại kiểm thử, tích hợp CI/CD hoặc nâng cấp thành dịch vụ QA tự động cho nhiều dự án web.
