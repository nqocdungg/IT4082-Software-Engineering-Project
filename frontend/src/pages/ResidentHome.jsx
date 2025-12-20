import React, { useState, useEffect } from "react";
import Logo from "../assets/images/Logo.png";
import HeroImage from "../assets/images/anh1.jpg";
import TBImage from "../assets/images/thongbao.png";
import SLide1image from "../assets/images/Slide1.png";
import SLide2image from "../assets/images/Slide2.png";

const latest = {
  title: "Thông báo bảo trì hệ thống",
  content: "Hệ thống sẽ tạm dừng từ 9h đến 12h ngày 20/12/2025",
  date: "18/12/2025",
};

const recentNotifications = [
  {
    title: "Nhắc nộp phí vệ sinh",
    content: "Hạn nộp: 25/12/2025",
    date: "17/12/2025",
  },
  {
    title: "Thông báo họp tổ dân phố",
    content: "Thời gian: 20/12/2025",
    date: "16/12/2025",
  },
  {
    title: "Cập nhật thông tin tạm trú",
    content: "Vui lòng kiểm tra thông tin tạm trú",
    date: "15/12/2025",
  },
];
const slides = [
  {
    titleSmall: "Nền tảng quản lý cư dân thông minh",
    titleMain: "QUẢN LÝ NHÂN KHẨU & HỘ KHẨU",
    desc: "Tra cứu thông tin hộ khẩu, nhân khẩu, lịch sử biến động cư trú nhanh chóng, chính xác và minh bạch. Hỗ trợ cư dân cập nhật thông tin trực tuyến, giảm thủ tục giấy tờ.",
    image: SLide1image,
  },
  {
    titleSmall: "Kết nối cư dân với ban quản lý",
    titleMain: "DỊCH VỤ CƯ TRÚ TRỰC TUYẾN",
    desc: "Đăng ký tạm trú, tạm vắng, phản ánh ý kiến và theo dõi trạng thái xử lý ngay trên hệ thống. Mọi thông tin được đồng bộ và bảo mật.",
    image: SLide2image,
  },
];

export default function ResidentHome() {
  const fullText = "Kết nối cư dân – Quản lý minh bạch";
  const [displayedText, setDisplayedText] = useState("");

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* ===== HEADER TRANG CƯ DÂN ===== */}
      <header className="resident-header">
        <div className="header-container">
          {/* LOGO */}
          <div className="logo">
            <img src={Logo} alt="Logo" />
          </div>

          {/* MENU */}
          <nav className="nav-menu">
            <div className="nav-item">
              <span>Trang chủ</span>
              <div className="dropdown">
                <div>Tổng quan</div>
              </div>
            </div>
            <div className="nav-item">
              <span>Thông báo</span>
              <div className="dropdown">
                <div>Thông báo chung</div>

                <div>Nhắc phí & phản hồi</div>
              </div>
            </div>
            <div className="nav-item">
              <span>Hóa đơn</span>
              <div className="dropdown">
                <div>Hóa đơn hàng tháng</div>
                <div>Lịch sử thanh toán</div>
                <div>Các khoản thu</div>
              </div>
            </div>
            <div className="nav-item">
              <span>Dịch vụ</span>
              <div className="dropdown">
                <div> Đăng ký tạm vắng</div>
                <div> Cập nhật thông tin nhân khẩu</div>
                <div>Theo dõi yêu cầu </div>
              </div>
            </div>
            <div className="nav-item">
              <span>Hộ khẩu</span>
              <div className="dropdown">
                <div>Thông tin hộ khẩu</div>
              </div>
            </div>
          </nav>

          {/* USER */}
          <div className="user-box">
            <span className="username">Nguyễn Văn A</span>
            <div className="dropdown user-dropdown">
              <div>Hồ sơ cá nhân</div>
              <div>Đổi mật khẩu</div>
              <div>Đăng xuất</div>
            </div>
          </div>
        </div>
        <div className="page-content">
          <section
            className="hero-banner"
            style={{ backgroundImage: `url(${HeroImage})` }}
          >
            <div className="hero-overlay white">
              <h1>
                {displayedText}
                <span className="cursor">|</span>
              </h1>
              <p>Nền tảng thông tin & dịch vụ dành cho cư dân</p>
            </div>
          </section>

          <section className="notifications-container">
            <div className="highlight-card">
              {/* Phần trên - ảnh */}
              <div className="highlight-top">
                <img
                  src={TBImage}
                  alt="Thông báo nổi bật"
                  className="highlight-img"
                />
              </div>

              {/* Phần dưới - nội dung */}
              <div className="highlight-bottom">
                {/* Nhãn loại tin */}
                <div className="highlight-tags">
                  <span className="tag">Sự kiện nổi bật</span>
                </div>

                {/* Tiêu đề */}
                <h3 className="highlight-title">{latest.title}</h3>

                {/* Mô tả */}
                <p className="highlight-desc">{latest.content}</p>

                {/* Xem thêm + ngày */}
                <div className="highlight-footer">
                  <a href="#" className="read-more"></a>
                  <span className="date">{latest.date}</span>
                </div>
              </div>
            </div>

            {/* Bên phải - danh sách thông báo */}
            <div className="notification-right">
              {recentNotifications.map((item, idx) => (
                <div className="notification-card" key={idx}>
                  <h4>{item.title}</h4>
                  <p>{item.content}</p>
                  <span className="date">{item.date}</span>
                </div>
              ))}

              {/* Nút chuyển trang / chuyển tin */}
              <div className="pagination-buttons">
                <button>{"<"}</button>
                <button>{">"}</button>
              </div>
            </div>
          </section>

          <section className="hero-banner1">
            <div className="vhm-slider">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`vhm-slide ${
                    index === currentSlide ? "active" : ""
                  }`}
                >
                  <div className="vhm-left">
                    <h5>{slide.titleSmall}</h5>
                    <h2>{slide.titleMain}</h2>
                    <p>{slide.desc}</p>
                    <button>KHÁM PHÁ DỰ ÁN</button>
                  </div>

                  <div
                    className="vhm-right"
                    style={{ backgroundImage: `url(${slide.image})` }}
                  />
                </div>
              ))}

              <div className="vhm-dots">
                {slides.map((_, index) => (
                  <span
                    key={index}
                    className={index === currentSlide ? "active" : ""}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>
          </section>
          <section className="resident-features">
            <h2 className="features-title">Tiện ích dành cho cư dân</h2>

            <div className="features-grid four">
              <div className="feature-card">
                <div className="feature-icon">🏠</div>
                <h4>Cư trú</h4>
                <p>Thông tin cư trú</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🚶</div>
                <h4>Tạm vắng</h4>
                <p>Thông báo tạm thời vắng mặt</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">💳</div>
                <h4>Thanh toán</h4>
                <p>Phí dịch vụ & hóa đơn</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">ℹ️</div>
                <h4>Xem thông tin</h4>
                <p>Thông tin cá nhân & hộ khẩu</p>
              </div>
            </div>
          </section>
          <footer className="resident-footer">
            <div className="footer-container">
              <div className="footer-col">
                <h4>HỆ THỐNG QUẢN LÝ NHÂN KHẨU – HỘ KHẨU</h4>
                <p>Cơ quan quản lý: UBND Phường ABC</p>
                <p>Địa chỉ: 12 Nguyễn Trãi, Quận XYZ, Hà Nội</p>
                <p>Email: hotro@quanlynhankhau.gov.vn</p>
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
        </div>
      </header>

      {/* ===== STYLE ===== */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        }

.page-content section {
  margin-bottom: 110px;  
}

        body {
          padding-top: 80px;
        }

        .resident-header {
          position: fixed;
          top: 8px;
          left: 0;
          width: 100%;
          height: 80px;
          background: #ffffff;
          border-bottom: 2px solid #dfe6f3;
          z-index: 1000;
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo img {
          height: 60px;
          cursor: pointer;
          padding-bottom: 5px;
        }

        .nav-menu {
          display: flex;
          gap: 30px;
        }

        .nav-item {
          position: relative;
          cursor: pointer;
          padding-bottom: 10px;
        }

        .nav-item span {
          padding: 10px 16px;
          font-size: 16.5px;
          font-weight: 700;
          color: #1f3c88;
          border-radius: 8px;
        }

        .nav-item:hover span {
          background: #afcbe9ff;
          color: #0a35a9ff;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .dropdown {
          position: absolute;
          top: 56px;
          left: 0;
          min-width: 190px;
          background: #ffffff;
          border: 1px solid #e0e6f1;
          border-radius: 8px;
          box-shadow: 0 8px 18px rgba(0,0,0,0.12);
          opacity: 0;
          visibility: hidden;
          transform: translateY(6px);
          transition: all 0.2s ease;
          z-index: 100;
        }

        .dropdown div {
          padding: 12px 16px;
          font-size: 14.5px;
          white-space: nowrap;
        }

        .dropdown div:hover {
          background: #f3f6ff;
          color: #1f3c88;
        }

        .nav-item:hover .dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .user-box {
          position: relative;
          cursor: pointer;
        }

        .username {
          background: #1f3c88;
          color: #ffffff;
          padding: 10px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .user-box:hover .user-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
.page-content {
  
  overflow-y: auto; 
  max-height: calc(100vh - 80px); 
}

        .hero-banner { margin-top: 2px; 
        width: 100%;
         height: 100vh;
          background-size: cover; 
          background-position: center;
           position: relative; }

        .hero-overlay.white {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.20);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 20px;
        }

.hero-overlay.white h1 {
  font-size: 40px;                       
  font-weight: 750;                       
  color: white;                         
  margin-bottom: 24px;                    
  text-shadow: 2px 2px 6px rgba(0,0,0,0.20); 
}


.hero-overlay.white p {
  font-size: 25px;                        
  font-weight: 700;                       
  color: white;
  text-shadow: 1px 1px 4px rgba(0,0,0,0.2);
}


        /* ===== CURSOR ===== */
        .cursor {
          display: inline-block;
          width: 2px;
          background-color: #0a35a9;
          margin-left: 2px;
          animation: blink 0.8s infinite;
        }

        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0; }
        }

        /* ===== THÔNG BÁO NỘI BỘ DƯỚI BANNER ===== */
.notifications-container {
  display: flex;
  gap: 40px;
  width: 100%; 
  padding: 40px;
  background-color: #f0f2f5; 
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
  align-items: stretch;
}

/* Hai bên chia đều */
.highlight-card,
.notification-right {
  flex: 1;
}

/* Hộp thông báo nổi bật bên trái */
.highlight-card {
  width: 100%;
height:400px;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.highlight-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

/* Phần trên - ảnh */
.highlight-top {
  flex: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.highlight-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Phần dưới - nội dung */
.highlight-bottom {
  flex: 3;
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background-color: #e0e2e4ff; 
  color: #2e2e30;
  border-top: 1px solid #d8d8d8;
}

.highlight-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.tag {
  background-color: #1a2a73;
  color: #ffffff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.highlight-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.highlight-desc {
  font-size: 14px;
  color: #555555;
  line-height: 1.5;
  margin-bottom: 8px;
}

.highlight-footer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #1a2a73;
}

/* Bên phải - danh sách thông báo */
.notification-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  padding: 25px;
  background-color: #ffffff;
  transition: all 0.2s ease;
}

.notification-right .notification-card {
  background-color: #f0f0f0a2; 
  border-radius: 12px;       
  box-shadow: 0 2px 6px rgba(0,0,0,0.1); 
  padding: 12px 12px;        
  transition: transform 0.2s ease, box-shadow 0.2s ease; 
}

.notification-right .notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
}
.notification-right .notification-card h4 {
  font-size: 14px;
  color: #1a2a73;
  margin-bottom: 4px;
}

.notification-right .notification-card p {
  font-size: 13px;
  color: #555555;
  margin: 0;
  line-height: 1.4;
}

.notification-right .notification-card .date {
  font-size: 12px;
  color: #1a2a73;
  margin-top: 6px;
  text-align: right;
}

/* Pagination */
.pagination-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 8px;
}

.pagination-buttons button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background-color: #1f3c88;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease;
}

.pagination-buttons button:hover {
  background-color: #0a35a9;
}

/* Responsive */
@media (max-width: 900px) {
  .notifications-container {
    flex-direction: column;
    padding: 20px;
  }
  .highlight-card,
  .notification-right {
    width: 100%;
  }
  .highlight-img {
    height: 120px;
  }
}

.vhm-slider {
  position: relative;
  max-width: 1200px;
  height: 460px;
  margin: 60px auto;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 14px 40px rgba(0,0,0,0.18);
  background: #fff;
}

.vhm-slide {
  position: absolute;
  inset: 0;
  display: flex;
  opacity: 0;
  transition: opacity 0.8s ease;
}

.vhm-slide.active {
  opacity: 1;
  z-index: 2;
}

/* BÊN TRÁI */
.vhm-left {
  width: 35%;
  padding: 50px 45px;
  background: #ffffff;
}

.vhm-left h5 {
  font-size: 14px;
  margin-bottom: 10px;
}

.vhm-left h2 {
  font-size: 32px;
  color: #c9a14a;
  font-weight: 800;
  margin-bottom: 20px;
}

.vhm-left p {
  font-size: 15px;
  line-height: 1.6;
  color: #555;
}

.vhm-left button {
  margin-top: 30px;
  padding: 12px 30px;
  border: 2px solid #1f3c88;
  background: transparent;
  color: #1f3c88;
  font-weight: 700;
  cursor: pointer;
}

/* BÊN PHẢI */
.vhm-right {
  width: 65%;
  background-size: cover;
  background-position: center;
}

/* DOTS */
.vhm-dots {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.vhm-dots span {
  width: 10px;
  height: 10px;
  background: rgba(0,0,0,0.25);
  border-radius: 50%;
  cursor: pointer;
}

.vhm-dots span.active {
  background: #c9a14a;
}

/* ===== TIỆN ÍCH CƯ DÂN (4 KHỐI) ===== */
.features-grid.four {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  max-width: 1100px;
  margin: 0 auto;
}

.feature-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 36px 20px;
  text-align: center;
  box-shadow: 0 10px 26px rgba(0,0,0,0.12);
  cursor: pointer;
  transition: all 0.25s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 18px 40px rgba(0,0,0,0.18);
}

.feature-icon {
  font-size: 42px;
  margin-bottom: 16px;
}

.feature-card h4 {
  font-size: 18px;
  font-weight: 800;
  color: #1f3c88;
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 14px;
  color: #666;
}

/* Responsive */
@media (max-width: 900px) {
  .features-grid.four {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .features-grid.four {
    grid-template-columns: 1fr;
  }
}
/* ===== FOOTER ===== */
.resident-footer {
  background: #f5f7fb;
  padding: 40px 60px 20px;
  font-size: 14px;
  color: #333;
}

.resident-footer .footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 40px;
}

.resident-footer .footer-col h4 {
  font-size: 15px;
  margin-bottom: 12px;
  color: #1f3c88;
}

.resident-footer .footer-col p {
  margin: 6px 0;
  line-height: 1.6;
}

.resident-footer .footer-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.resident-footer .footer-col ul li {
  margin-bottom: 8px;
  cursor: pointer;
}

.resident-footer .footer-col ul li:hover {
  color: #1f3c88;
  text-decoration: underline;
}

.resident-footer .footer-bottom {
  border-top: 1px solid #ddd;
  margin-top: 25px;
  padding-top: 15px;
  text-align: center;
  font-size: 13px;
  color: #777;
}

/* Responsive footer */
@media (max-width: 900px) {
  .resident-footer .footer-container {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}


      `}</style>
    </div>
  );
}
