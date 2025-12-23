// src/components/resident/ResidentNotifications.jsx
import React from "react";
import TBImage from "../../assets/images/thongbao.png";
import "../../styles/resident/ResidentNotifications.css";

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

export default function ResidentNotifications() {
  return (
    <section className="notifications-container">
      <div className="highlight-card">
        <div className="highlight-top">
          <img
            src={TBImage}
            alt="Thông báo nổi bật"
            className="highlight-img"
          />
        </div>
        <div className="highlight-bottom">
          <div className="highlight-tags">
            <span className="tag">Sự kiện nổi bật</span>
          </div>
          <h3 className="highlight-title">{latest.title}</h3>
          <p className="highlight-desc">{latest.content}</p>
          <div className="highlight-footer">
            <span className="date">{latest.date}</span>
          </div>
        </div>
      </div>

      <div className="notification-right">
        {recentNotifications.map((item, idx) => (
          <div className="notification-card" key={idx}>
            <h4>{item.title}</h4>
            <p>{item.content}</p>
            <span className="date">{item.date}</span>
          </div>
        ))}
        <div className="pagination-buttons">
          <button>{"<"}</button>
          <button>{">"}</button>
        </div>
      </div>
    </section>
  );
}
