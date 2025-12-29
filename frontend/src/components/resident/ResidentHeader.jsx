import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/images/Logo.png";
import "../../styles/resident/ResidentHeader.css";

export default function ResidentHeader() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    navigate("/login");
  };

  return (
    <header className="resident-header">
      <div className="header-container">
        <div className="logo">
          <img src={Logo} alt="Logo" />
        </div>

        <nav className="nav-menu">
          <div
            className="nav-item-resident"
            onClick={() => toggleDropdown("home")}
          >
            <span>
              <Link to="/resident-home" className="nav-link">
                Trang chủ
              </Link>
            </span>
          </div>

          <div
            className={`nav-item-resident ${
              openDropdown === "notification" ? "active" : ""
            }`}
            onClick={() => toggleDropdown("notification")}
          >
            <span>Thông báo</span>
            <div className="dropdown">
              <div>Thông báo chung</div>
              <div>Nhắc phí & phản hồi</div>
            </div>
          </div>

          <div
            className={`nav-item-resident ${
              openDropdown === "bill" ? "active" : ""
            }`}
            onClick={() => toggleDropdown("bill")}
          >
            <span>Hóa đơn</span>
            <div className="dropdown">
              <Link to="/resident/payment-infor">Thông tin khoản thu</Link>
              <Link to="/resident/payment">Thanh toán hoá đơn </Link>
              <Link to="/resident/history">Lịch sử thanh toán </Link>
            </div>
          </div>

          {/* <div
            className={`nav-item-resident ${openDropdown === "service" ? "active" : ""}`}
            onClick={() => toggleDropdown("service")}
          >
             <span>Dịch vụ</span> 
            <div className="dropdown">
              <div>Đăng ký tạm vắng</div>
              <div>Cập nhật thông tin nhân khẩu</div>
              <div>Theo dõi yêu cầu</div>
            </div>
          </div> */}

          <div
            className={`nav-item-resident ${
              openDropdown === "household" ? "active" : ""
            }`}
            onClick={() => toggleDropdown("household")}
          >
            <span>Hộ khẩu</span>
            <div className="dropdown">
              <Link to="/resident/household/info">Thông tin hộ khẩu</Link>
            </div>
          </div>
        </nav>

        <div className="user-box">
          <span className="username" onClick={() => toggleDropdown("user")}>
            {" "}
            Người dùng{" "}
          </span>
          <div
            className={`dropdown user-dropdown ${
              openDropdown === "user" ? "active" : ""
            }`}
          >
            <div>Hồ sơ cá nhân</div>
            <div onClick={handleLogout} style={{ cursor: "pointer" }}>
              Đăng xuất
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
