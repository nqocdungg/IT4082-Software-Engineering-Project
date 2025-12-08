// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import SideBar from "../components/SideBar.jsx";
import { FaHome, FaUserFriends, FaFolderOpen } from "react-icons/fa";
import "../styles/dashboard.css";

import {
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from "recharts";

export default function Dashboard() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

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

  const births = [4, 3, 5, 6, 4, 5, 4, 7, 5, 4, 3, 4];
  const movedIn = [3, 4, 5, 4, 3, 4, 3, 6, 4, 3, 3, 4];
  const movedOut = [2, 2, 3, 2, 3, 3, 2, 3, 2, 3, 2, 2];
  const deceased = [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1];

  const populationFlowChartData = months.map((month, index) => ({
    month,
    births: births[index],
    movedIn: movedIn[index],
    movedOut: movedOut[index],
    deceased: deceased[index],
  }));

  const populationStructureData = [
    { name: "Trẻ em (<15)", value: 620, color: "#22C55E" },
    { name: "Thanh niên (15–35)", value: 1450, color: "#0EA5E9" },
    { name: "Trung niên (36–60)", value: 980, color: "#F97316" },
    { name: "Cao tuổi (>60)", value: 518, color: "#A855F7" },
  ];
  const totalPopulation = populationStructureData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const monthlyRevenue = [
    2.8, 7.3, 6, 7.8, 7.1, 8.2, 8.6, 10.1, 7.5, 11.9, 7.2, 15.6,
  ];
  const monthlyExpense = [
    1.2, 4.9, 4.4, 5.1, 4.7, 5.3, 5.6, 5.0, 8.0, 5.1, 4.6, 4.9,
  ];

  const financeChartData = months.map((month, index) => ({
    month,
    revenue: monthlyRevenue[index],
    expense: monthlyExpense[index],
  }));

  return (
    <div className="appMain">
      <Header />

      <div className="mainContentWrapper">
        <SideBar />

        <main className="mainContent">
          <div className="dashboard">
            {/* TOP CARDS */}
            <div className="top-cards">
              <div className="card">
                <div className="card-content">
                  <h4>Tổng số hộ gia đình</h4>
                  <p className="value">1234</p>
                </div>
                <div className="icon-container blue">
                  <FaHome />
                </div>
              </div>

              <div className="card">
                <div className="card-content">
                  <h4>Tổng số nhân khẩu</h4>
                  <p className="value">3568</p>
                </div>
                <div className="icon-container green">
                  <FaUserFriends />
                </div>
              </div>

              <div className="card">
                <div className="card-content">
                  <h4>Hồ sơ cần xử lý</h4>
                  <p className="value">12</p>
                </div>
                <div className="icon-container purple">
                  <FaFolderOpen />
                </div>
              </div>
            </div>

            {/* CHARTS HÀNG 2 */}
            <div className="charts">
              {/* BarChart bên trái */}
              <div className="chart-left">
                <h3>Biến động dân cư</h3>
                <div className="chart-container">
                  {isReady && (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={populationFlowChartData}
                        margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
                        barGap={4}
                        barCategoryGap="20%"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(148,163,184,0.35)"
                        />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tick={{ fontSize: 11, fill: "#6B7280" }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: "#9CA3AF" }}
                        />
                        <RechartsTooltip
                          cursor={{ fill: "rgba(0,0,0,0.04)" }}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid rgba(17,24,39,0.08)",
                            boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                            padding: 10,
                          }}
                          labelStyle={{ fontSize: 12, fontWeight: 600 }}
                        />
                        <RechartsLegend
                          verticalAlign="top"
                          height={32}
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: 11.5,
                            color: "#4B5563",
                            paddingBottom: 8,
                          }}
                        />
                        <Bar
                          dataKey="births"
                          name="Số người sinh"
                          fill="#22C55E"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="deceased"
                          name="Số người mất"
                          fill="#EF4444"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="movedIn"
                          name="Chuyển đến"
                          fill="#0EA5E9"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="movedOut"
                          name="Chuyển đi"
                          fill="#F97316"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Donut bên phải – cơ cấu độ tuổi dân cư */}
              <div className="chart-right">
                <h3>Cơ cấu độ tuổi dân cư</h3>

                <div className="circle-item full-width">
                  {isReady && (
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie
                          data={populationStructureData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {populationStructureData.map((entry, index) => (
                            <Cell
                              key={`cell-structure-${index}`}
                              fill={entry.color}
                            />
                          ))}

                          {/* TỔNG Ở GIỮA – fix: parse cx, cy thành số */}
                          <Label
                            position="center"
                            content={({ viewBox }) => {
                              if (!viewBox) return null;
                              const cx = Number(viewBox.cx);
                              const cy = Number(viewBox.cy);
                              if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
                                return null;
                              }
                              return (
                                <g>
                                  <text
                                    x={cx}
                                    y={cy - 2}
                                    textAnchor="middle"
                                    style={{
                                      fontSize: "16px",
                                      fontWeight: 700,
                                      fill: "#111827",
                                    }}
                                  >
                                    {totalPopulation}
                                  </text>
                                  <text
                                    x={cx}
                                    y={cy + 16}
                                    textAnchor="middle"
                                    style={{
                                      fontSize: "11px",
                                      fill: "#6B7280",
                                    }}
                                  >
                                    Nhân khẩu
                                  </text>
                                </g>
                              );
                            }}
                          />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  {/* legend chi tiết */}
                  <div className="age-legend">
                    {populationStructureData.map((item) => {
                      const percent = Math.round(
                        (item.value / totalPopulation) * 100
                      );
                      return (
                        <div key={item.name} className="age-legend-row">
                          <div className="age-legend-left">
                            <span
                              className="age-legend-dot"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.name}</span>
                          </div>
                          <span className="age-legend-value">
                            {item.value} người ({percent}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* STATS ROW – area chart lớn bên trái, 2 card xếp dọc bên phải */}
            <div className="stats-row">
              <div className="stat-card finance-card">
                
                <div className="finance-chart-wrapper">
                  {isReady && (
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart
                        data={financeChartData}
                        margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorRevenue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#22C55E"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#22C55E"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorExpense"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#EF4444"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#EF4444"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="3 3"
                          stroke="rgba(148,163,184,0.35)"
                        />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={16}
                          tick={{ fontSize: 10, fill: "#9CA3AF" }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: "#9CA3AF" }}
                          width={26}
                        />

                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid rgba(148,163,184,0.5)",
                            fontSize: 12,
                            padding: 8,
                          }}
                          labelStyle={{ fontWeight: 600 }}
                          formatter={(value, name) => [
                            `${value.toFixed(1)} Triệu`,
                            name === "revenue" ? "Thu" : "Chi",
                          ]}
                        />

                        <Area
                          type="natural"
                          dataKey="revenue"
                          name="Thu"
                          stroke="#22C55E"
                          strokeWidth={1}
                          fill="url(#colorRevenue)"
                        />
                        <Area
                          type="natural"
                          dataKey="expense"
                          name="Chi"
                          stroke="#EF4444"
                          strokeWidth={1}
                          fill="url(#colorExpense)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  

                </div>

                <div className="finance-info">
                  <span className="finance-title">
                    Tổng thu - chi (12 tháng)
                  </span>
                  <span className="finance-amount">+33.636.000 VND</span>
                  <span className="finance-change">
                    <span className="stat-dot up" />
                    ▲ 22.2% so với cùng kỳ
                  </span>
                </div>
              </div>

              <div className="stats-side-column">
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
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
