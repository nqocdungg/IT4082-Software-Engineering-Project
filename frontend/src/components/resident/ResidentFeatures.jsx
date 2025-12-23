// src/components/resident/ResidentFeatures.jsx
import React from "react";
import "../../styles/resident/ResidentFeatures.css";

export default function ResidentFeatures() {
  return (
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
  );
}
