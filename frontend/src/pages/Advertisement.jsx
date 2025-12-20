import Header from "../components/Header";
import vinhome from "../assets/images/vinhome_riverside.png";
import { useState } from "react";
import "./Advertisement.css"

function Advertisement() {
  const [activeBox, setActiveBox] = useState("box1");

  return (
    <>
      <Header/>
      <div className="banner">
        <img id="vinhome" src={vinhome} alt="Vinhome Riverside" />
        <div className="infor">
          <div
            className={`information ${activeBox === "box1" ? "active" : ""}`}
            onMouseEnter={() => setActiveBox("box1")}
            onMouseLeave={() => setActiveBox(undefined)}
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
            onMouseLeave={() => setActiveBox("box1")}
          >
            <p>Chúng tôi có mặt tại hơn 11 tỉnh, thành phố trên khắp cả nước.</p>
            <button>TÌM HIỂU THÊM</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Advertisement;

