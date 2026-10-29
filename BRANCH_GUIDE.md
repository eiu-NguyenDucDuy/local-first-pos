# Nhánh

Nhánh main: Nhánh sản phẩm ổn định. Chỉ chứa code đã kiểm thử thành công (npm run build ra thư mục /out không lỗi). Không code trực tiếp trên main.

Nhánh develop: Nhánh tích hợp chính. Tất cả tính năng mới của các thành viên sẽ được gộp (merge) vào đây trước.

Nhánh Feature (feature/<issue-number>-<tên tính năng>): Nhánh riêng cho từng thành viên làm task.

# Push trên github

1. Tạo issue trên github về task cần làm
2. Tạo branch feature (cần bao gồm số của issue đó)
3. Sau khi đẩy code xong tạo Pull Request cho issue đó để review trước khi merge vào develop branch
4. Nếu merge xong có thể đóng issue và task hoàn thành