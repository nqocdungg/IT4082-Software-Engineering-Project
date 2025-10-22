import { useState } from "react";
import "./Authentication.css";
import vinhome from "./vinhome_riverside.jpg";

function Authen() {
  const [activeBox, setActiveBox] = useState("box1");

  return (
    <div className="infor">
      <img id="vinhome" src={vinhome} alt="Vinhome Riverside" />

      <div
        className={`information ${activeBox === "box1" ? "active" : ""}`}
        onMouseEnter={() => setActiveBox("box1")}
        onMouseLeave={() => setActiveBox(null)}
      >
        <p>
          Kinh doanh bền vững, Giải pháp thông minh,
          Lời khuyên cho bạn,
          Dịch vụ số một.
        </p>
        <button>TÌM HIỂU THÊM</button>
      </div>

      <div
        className={`information ${activeBox === "box2" ? "active" : ""}`}
        onMouseEnter={() => setActiveBox("box2")}
        onMouseLeave={() => setActiveBox(null)}
      >
        <p>Chúng tôi có mặt tại hơn 11 tỉnh, thành phố trên khắp cả nước.</p>
        <button>TÌM HIỂU THÊM</button>
      </div>
    </div>
  );
}

export default Authen;
