import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../../assets/images/Logo.png";
import "../../styles/resident/ResidentHeader.css";
import axios from "axios";

export default function ResidentHeader() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [totalUnread, setTotalUnread] = useState(0);

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    navigate("/login");
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("http://localhost:5000/api/resident/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const unread = res.data.filter(n => !n.isRead).length;
        setTotalUnread(unread);
      } catch (error) {
        console.error("Lỗi lấy số thông báo:", error);
      }
    };
    fetchUnreadCount();
  }, [location.pathname]);

  const isActive = (path) => location.pathname.includes(path) ? "active" : "";

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

          <Link 
            to="/resident/notifications?tab=general" 
            className={`nav-item-resident notification-wrapper ${isActive('/resident/notifications') ? 'active' : ''}`}
          >
            <span className="nav-label">Thông báo</span>

            {totalUnread > 0 && (
              <span className="header-badge pulse-animation">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </Link>

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
          <div className={`nav-item-resident ${isActive('/resident/help') ? 'active' : ''}`}>
             <span>
               <Link to="/resident/help" className="nav-link">
                 Trợ giúp
               </Link>
             </span>
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
