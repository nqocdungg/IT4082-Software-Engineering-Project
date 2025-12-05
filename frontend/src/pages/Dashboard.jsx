import React from "react";
import Header from "../components/Header.jsx";
import SideBar from "../components/SideBar.jsx";
import { FaHome, FaUserFriends } from "react-icons/fa";

import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function Dashboard() {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // === Biến động dân cư theo thời gian (line chart) ===
  // Dữ liệu mẫu mang tính "realistic" hơn một tí
  const births =    [4, 3, 5, 6, 4, 5, 4, 7, 5, 4, 3, 4]; // Số người sinh
  const movedIn =   [3, 4, 5, 4, 3, 4, 3, 6, 4, 3, 3, 4]; // Chuyển đến
  const movedOut =  [2, 2, 3, 2, 3, 3, 2, 3, 2, 3, 2, 2]; // Chuyển đi
  const deceased =  [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1]; // Mất

  const populationFlowData = {
    labels: months,
    datasets: [
      {
        label: "Số người sinh",
        data: births,
        borderColor: "#22C55E",
        backgroundColor: "transparent",
        tension: 0.4,
        borderWidth: 1.8,
        pointRadius: 2.5,
        pointHoverRadius: 4,
        pointBackgroundColor: "#22C55E",
        pointBorderWidth: 0,
      },
      {
        label: "Số người chuyển đến",
        data: movedIn,
        borderColor: "#0EA5E9",
        backgroundColor: "transparent",
        tension: 0.4,
        borderWidth: 1.8,
        pointRadius: 2.5,
        pointHoverRadius: 4,
        pointBackgroundColor: "#0EA5E9",
        pointBorderWidth: 0,
      },
      {
        label: "Số người chuyển đi",
        data: movedOut,
        borderColor: "#F97316",
        backgroundColor: "transparent",
        tension: 0.4,
        borderWidth: 1.8,
        pointRadius: 2.5,
        pointHoverRadius: 4,
        pointBackgroundColor: "#F97316",
        pointBorderWidth: 0,
      },
      {
        label: "Số người mất",
        data: deceased,
        borderColor: "#EF4444",
        backgroundColor: "transparent",
        tension: 0.4,
        borderWidth: 1.8,
        pointRadius: 2.5,
        pointHoverRadius: 4,
        pointBackgroundColor: "#EF4444",
        pointBorderWidth: 0,
      },
    ],
  };

  const populationFlowOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 11.5, family: "Inter, system-ui, sans-serif" },
          color: "#4B5563",
          usePointStyle: true,
          boxWidth: 10,
        },
      },
      title: {
        display: true,
        text: "Biến động dân cư theo thời gian",
        font: { size: 14, weight: "600", family: "Inter, system-ui, sans-serif" },
        color: "#111827",
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#111827",
        titleFont: { size: 12, family: "Inter, system-ui, sans-serif" },
        bodyFont: { size: 11, family: "Inter, system-ui, sans-serif" },
        padding: 10,
        cornerRadius: 8,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    layout: {
      padding: { top: 8, right: 8, left: 0, bottom: 0 },
    },
    scales: {
      x: {
        ticks: {
          color: "#6B7280",
          font: { size: 11 },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 8,
        ticks: {
          color: "#9CA3AF",
          stepSize: 1,
          font: { size: 11 },
        },
        grid: {
          color: "rgba(148, 163, 184, 0.18)", // grid mảnh, hiện đại
          drawBorder: false,
        },
        title: {
          display: true,
          text: "Số người",
          color: "#6B7280",
          font: { size: 11.5 },
        },
      },
    },
  };

  // Doughnut — tình trạng cư trú
  const residentStatusData = {
    labels: ["Tạm trú", "Tạm vắng"],
    datasets: [
      {
        data: [300, 100],
        backgroundColor: ["#22C55E", "#FBBF24"],
        borderWidth: 0,
      },
    ],
  };

  // Doughnut — giới tính
  const genderData = {
    labels: ["Nam (65%)", "Nữ (35%)"],
    datasets: [
      {
        data: [65, 35],
        backgroundColor: ["#22C55E", "#D1FAE5"],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#374151", font: { size: 12 } },
      },
    },
  };

  return (
    <div className="appMain">
      <Header />

      <div className="mainContentWrapper">
        <SideBar />

        <div className="mainContent">
          {/* TOP CARDS */}
          <div className="top-cards">
            {/* Card hộ gia đình */}
            <div className="card">
              <div className="card-content">
                <h4>Tổng số hộ gia đình</h4>
                <p className="value">1234</p>
              </div>
              <div className="icon-container blue">
                <FaHome />
              </div>
            </div>

            {/* Card nhân khẩu */}
            <div className="card">
              <div className="card-content">
                <h4>Tổng số nhân khẩu</h4>
                <p className="value">3568</p>
              </div>
              <div className="icon-container green">
                <FaUserFriends />
              </div>
            </div>

            {/* Card thu – chi */}
            <div className="card net-card">
              <div className="net-header">
                <span className="net-title">Tổng thu - chi</span>
                <span className="net-amount">+33.636.000 VND</span>
                <span className="net-change">▲ 22.2%</span>
              </div>

              <div className="net-bars">
                <div className="net-row">
                  <span className="net-label">Tổng thu: 78.636.000 VND</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill revenue"
                      style={{ width: "85%" }}
                    />
                  </div>
                </div>

                <div className="net-row">
                  <span className="net-label">Tổng chi: 45.000.000 VND</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill expense"
                      style={{ width: "55%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === BIỂU ĐỒ === */}
          <div className="charts">
            <div className="chart-left">
              <h3>Biến động dân cư</h3>
              <div className="chart-container">
                <Line
                  data={populationFlowData}
                  options={populationFlowOptions}
                />
              </div>
            </div>

            <div className="chart-right">
              <h3>Thống kê nhân khẩu</h3>
              <div className="circle-group">
                <div className="circle-item">
                  <Doughnut
                    data={residentStatusData}
                    options={doughnutOptions}
                  />
                  <p className="target">Tình trạng cư trú</p>
                </div>

                <div className="circle-item">
                  <Doughnut data={genderData} options={doughnutOptions} />
                  <p className="target">Giới tính</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hàng thống kê thêm */}
          <div className="stats-row">
            <div className="stat-card">
              <p className="stat-label">Tỷ lệ đóng phí tháng này</p>
              <p className="stat-value">92%</p>
              <p className="stat-sub">
                <span className="stat-dot up"></span>
                Tăng 4% so với tháng trước
              </p>
            </div>

            <div className="stat-card">
              <p className="stat-label">Số hộ còn nợ phí</p>
              <p className="stat-value">18 hộ</p>
              <p className="stat-sub">
                <span className="stat-dot down"></span>
                +5 hộ so với tháng trước
              </p>
            </div>

            <div className="stat-card">
              <p className="stat-label">Hồ sơ cần xử lý</p>
              <p className="stat-value">12</p>
              <p className="stat-sub">
                <span className="stat-dot up neutral"></span>
                Bao gồm tạm trú, tạm vắng, đổi chủ hộ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
