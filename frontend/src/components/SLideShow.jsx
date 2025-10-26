import { useState, useEffect } from "react";
import "./Slideshow.css";

import Vinhomes1 from "../assets/images/Vinhomes-1.png";
import Vinhomes2 from "../assets/images/Vinhomes-2.png";
import Vinhomes3 from "../assets/images/Vinhomes-3.png";

// Mảng chứa các ảnh sẽ được hiển thị trong slideshow
const images = [Vinhomes1, Vinhomes2, Vinhomes3];

function Slideshow() {
  // --- State để lưu chỉ số ảnh hiện tại đang hiển thị ---
  const [current, setCurrent] = useState(0);

  // --- useEffect để tự động chuyển ảnh sau mỗi 3 giây ---
  useEffect(() => {
    const interval = setInterval(() => {
      // Cứ sau 3s sẽ tăng chỉ số lên 1, và quay lại 0 nếu hết ảnh
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4900);

    // Xóa interval khi component bị unmount (tránh memory leak)
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* --- Container chứa các ảnh slideshow --- */}
      <div className="slideshow-container">
        {images.map((src, index) => (
          <img
            key={index} // mỗi ảnh cần key riêng
            src={src}
            alt={`slide-${index}`} // mô tả ảnh cho SEO / accessibility
            className={`slide ${index === current ? "active" : ""}`} // thêm class 'active' để hiển thị ảnh hiện tại
          />
        ))}
      </div>

      {/* --- Khối thông tin hiển thị trên ảnh (overlay) --- */}
      <div className="information">
        <p>
          Nền tảng quản lí dân cư cao cấp, đã hoạt động trên hơn 11 tỉnh thành
        </p>
        <button className="moreInfor">Tìm hiểu thêm về chúng tôi</button>
      </div>
    </>
  );
}

export default Slideshow;
