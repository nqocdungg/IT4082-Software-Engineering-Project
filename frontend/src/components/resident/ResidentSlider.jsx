// src/components/resident/ResidentSlider.jsx
import React, { useState, useEffect } from "react";
import SLide1image from "../../assets/images/Slide1.png";
import SLide2image from "../../assets/images/Slide2.png";
import "../../styles/resident/ResidentSlider.css";

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

export default function ResidentSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero-banner1">
      <div className="vhm-slider">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`vhm-slide ${index === currentSlide ? "active" : ""}`}
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
  );
}
