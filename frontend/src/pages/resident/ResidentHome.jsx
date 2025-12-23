// src/pages/resident/ResidentHome.jsx
import React from "react";
import ResidentHeader from "../../components/resident/ResidentHeader";
import ResidentHero from "../../components/resident/ResidentHero";
import ResidentNotifications from "../../components/resident/ResidentNotifications";
import ResidentSlider from "../../components/resident/ResidentSlider";
import ResidentFeatures from "../../components/resident/ResidentFeatures";
import ResidentFooter from "../../components/resident/ResidentFooter";

export default function ResidentHome() {
  return (
    <div>
      <ResidentHeader />
      <div className="page-content">
        <ResidentHero />
        <ResidentNotifications />
        <ResidentSlider />
        <ResidentFeatures />
        <ResidentFooter />
      </div>
    </div>
  );
}
