// src/components/resident/ResidentHero.jsx
import React, { useState, useEffect } from "react";
import HeroImage from "../../assets/images/anh1.jpg";
import "../../styles/resident/ResidentHero.css";

export default function ResidentHero() {
  const fullText = "Kết nối cư dân – Quản lý minh bạch";
  const [displayedText, setDisplayedText] = useState("");

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
    <section
      className="hero-banner"
      style={{ backgroundImage: `url(${HeroImage})` }}
    >
      <div className="hero-overlay white">
        <h1>
          {displayedText}
          {displayedText.length < fullText.length && <span className="cursor">|</span>}
        </h1>

        <p>Nền tảng thông tin & dịch vụ dành cho cư dân</p>
      </div>
    </section>
  );
}
