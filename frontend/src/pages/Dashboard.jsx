import React from "react";
import Header from "../components/Header.jsx";
import SideBar from "../components/SideBar.jsx";
import { FaHome, FaUserFriends, FaMoneyBillWave, FaWallet } from "react-icons/fa";

import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  // --- Nhãn 12 tháng ---
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // --- Dữ liệu ---
  const added = [5, 8, 6, 7, 4, 6, 5, 20, 6, 8, 5, 6];
  const movedOut = [2, 1, 3, 2, 9, 2, 1, 3, 2, 1, 2, 1];
  const deceased = [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1];
  const changeOwner = [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1];
  const splitHousehold = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];

  const totalChanges = added.map(
    (v, i) => v + movedOut[i] + deceased[i] + changeOwner[i] + splitHousehold[i]
  );

  // Bar + Line (stacked bars + line)
  const residentChangesData = {
    labels: months,
    datasets: [
      { type: "bar", label: "Thêm mới",   data: added,       backgroundColor: "#3B82F6", barThickness: 16, maxBarThickness: 18 },
      { type: "bar", label: "Chuyển đi",  data: movedOut,    backgroundColor: "#F59E0B", barThickness: 16, maxBarThickness: 18 },
      { type: "bar", label: "Qua đời",    data: deceased,    backgroundColor: "#EF4444", barThickness: 16, maxBarThickness: 18 },
      { type: "bar", label: "Đổi chủ hộ", data: changeOwner, backgroundColor: "#10B981", barThickness: 16, maxBarThickness: 18 },
      { type: "bar", label: "Tách hộ",    data: splitHousehold, backgroundColor: "#8B5CF6", barThickness: 16, maxBarThickness: 18 },
      {
        type: "line",
        label: "Tổng biến động",
        data: totalChanges,
        borderColor: "#9CA3AF",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointBackgroundColor: "#FFFFFF",
        pointBorderColor: "#D1D5DB",
        pointRadius: 3,
        pointHoverRadius: 6,
        order: 2,
      },
    ],
  };

  const residentChangesOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top", align: "center", labels: { boxWidth: 10, padding: 20 } },
      title: { display: true, text: "Biến động nhân khẩu (Thường trú)" },
      tooltip: { mode: "index", intersect: false },
    },
    layout: { padding: { top: 0 } },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true, title: { display: true, text: "Số nhân khẩu" }, ticks: { stepSize: 1 } },
    },
    onHover: (event, chartElement) => {
      if (event?.native?.target) {
        event.native.target.style.cursor = chartElement.length > 0 ? "pointer" : "default";
      }
    },
  };

  // Doughnut
  const residentStatusData = {
    labels: ["Tạm trú", "Tạm vắng"],
    datasets: [
      { data: [300, 100], backgroundColor: ["#2563EB", "#93C5FD"], hoverBackgroundColor: ["#1D4ED8", "#60A5FA"], borderWidth: 0 },
    ],
  };

  const genderData = {
    labels: ["Nam", "Nữ"],
    datasets: [
      { data: [65, 35], backgroundColor: ["#7d9cc9ff", "#ee5555ff"], hoverBackgroundColor: ["#64748B", "#EF4444"], borderWidth: 0 },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { onClick: () => {}, position: "top", labels: { padding: 15, boxWidth: 15, font: { size: 12 } } },
    },
    layout: { padding: { top: 6, bottom: 0 } },
    onHover: (event, elements) => {
      if (event?.native?.target) {
        event.native.target.style.cursor = elements.length ? "pointer" : "default";
      }
    },
  };

  return (
    <div className="appMain">
      <Header />
      <div className="mainContentWrapper">
        <SideBar />
        <div className="mainContent">
          <div className="dashboard">
            {/* === Top cards === */}
            <div className="top-cards">
              <div className="card card1">
                <div className="card-content">
                  <h4>Tổng số hộ gia đình</h4>
                  <p className="value">1234</p>
                </div>
                <div className="icon-container blue">
                  <FaHome />
                </div>
              </div>

              <div className="card card2">
                <div className="card-content">
                  <h4>Tổng số nhân khẩu</h4>
                  <p className="value">3568</p>
                </div>
                <div className="icon-container green">
                  <FaUserFriends />
                </div>
              </div>

              <div className="card card3">
                <div className="card-content">
                  <h4>Tổng chi theo tháng</h4>
                  <p className="value">45.000.000 VND</p>
                </div>
                <div className="icon-container red">
                  <FaMoneyBillWave />
                </div>
              </div>

              <div className="card card4">
                <div className="card-content">
                  <h4>Tổng thu theo tháng</h4>
                  <p className="value">78.636.000 VND</p>
                </div>
                <div className="icon-container purple">
                  <FaWallet />
                </div>
              </div>
            </div>

            {/* === Charts Section === */}
            <div className="charts">
              <div className="chart-left">
                <div className="chart-header">
                  <h3>Biến động nhân khẩu</h3>
                  <button className="btn-action">Download</button>
                </div>
                <div className="chart-container">
                  <Bar data={residentChangesData} options={residentChangesOptions} />
                </div>
              </div>

              <div className="chart-right">
                <h3 style={{ textAlign: "center", marginBottom: "40px" }}>
                  Thống kê nhân khẩu
                </h3>
                <div className="circle-group">
                  <div className="circle-item">
                    <Doughnut data={residentStatusData} options={doughnutOptions} width={195} height={195} responsive={false} />
                    <p className="target">Tình trạng cư trú</p>
                  </div>

                  <div className="circle-item">
                    <Doughnut data={genderData} options={doughnutOptions} width={195} height={195} responsive={false} />
                    <p className="target">Giới tính</p>
                  </div>
                </div>
              </div>
            </div>
            {/* === End Charts === */}
          </div>
        </div>
      </div>
    </div>
  );
}