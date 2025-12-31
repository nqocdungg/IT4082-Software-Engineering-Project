// src/components/resident/ResidentFooter.jsx
import React from "react";
import "../../styles/resident/ResidentFooter.css";

export default function ResidentFooter() {
  return (
    <footer className="resident-footer">
      <div className="footer-container">
        <div className="footer-col">
          <h4>HỆ THỐNG QUẢN LÝ NHÂN KHẨU – HỘ KHẨU</h4>
          <p>Cơ quan quản lý: UBND Phường La Khê, Quận Hà Đông, Hà Nội</p>
          <p>Địa chỉ: TDP số 7, Phường La Khê, Quận Hà Đông, Hà Nội</p>
          <p>Email: tdp7lakhe@gmail.com</p>
          <p>Hotline: 1900 1234</p>
        </div>

        <div className="footer-col">
          <h4>Chính sách</h4>
          <ul>
            <li>Bảo mật thông tin công dân</li>
            <li>Quy định sử dụng hệ thống</li>
            <li>Quyền & nghĩa vụ cư dân</li>
            <li>Điều khoản dịch vụ</li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Liên kết nhanh</h4>
          <ul>
            <li>Thông tin hộ khẩu</li>
            <li>Khai báo tạm vắng</li>
            <li>Lịch sử hồ sơ</li>
            <li>Hướng dẫn sử dụng</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        © 2025 Hệ thống Quản lý Nhân khẩu – Hộ khẩu
      </div>
    </footer>
  );
}
