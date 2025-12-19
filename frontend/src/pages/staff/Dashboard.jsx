import React, { useState, useEffect, useMemo } from "react";
import { FaHome, FaUserFriends, FaFolderOpen } from "react-icons/fa";
import "../../styles/staff/dashboard.css";

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

  const fixedFee = [3.2, 3.1, 3.3, 3.2, 3.4, 3.3, 3.5, 3.6, 3.4, 3.5, 3.6, 3.8];
  const contribution = [0.6, 1.1, 0.9, 1.4, 1.0, 1.3, 1.2, 1.8, 1.1, 1.6, 1.0, 2.2];
  const totalFixedFee = fixedFee[fixedFee.length - 1];
  const totalContribution = contribution[contribution.length - 1];
  const totalRevenue = totalFixedFee + totalContribution;

  const fixedPct = totalRevenue > 0 ? (totalFixedFee / totalRevenue) * 100 : 0;
  const contribPct = totalRevenue > 0 ? (totalContribution / totalRevenue) * 100 : 0;

  const feeChartData = useMemo(
    () =>
      months.map((month, index) => ({
        month,
        fixedFee: fixedFee[index],
        contribution: contribution[index],
      })),
    []
  );

  const populationStructureData = [
    { name: "Trẻ em (<15)", value: 620, color: "#22C55E" },
    { name: "Thanh niên (15–35)", value: 1450, color: "#0EA5E9" },
    { name: "Trung niên (36–60)", value: 980, color: "#F97316" },
    { name: "Cao tuổi (>60)", value: 518, color: "#A855F7" },
  ];

  const totalPopulation = useMemo(
    () => populationStructureData.reduce((sum, item) => sum + item.value, 0),
    []
  );
  const residencyPieData = [
    { name: "Thường trú", value: 2100, color: "#16A34A" },
    { name: "Tạm trú", value: 680, color: "#F59E0B" },
    { name: "Tạm vắng", value: 420, color: "#3B82F6" },
    { name: "Chuyển đi", value: 240, color: "#6B7280" },
  ];

  const totalResidency = useMemo(
    () => residencyPieData.reduce((sum, item) => sum + item.value, 0),
    []
  );

  return (
    <div className="dashboard">
      <div className="top-cards">
        <div className="card card-revenue">
          <div className="card-content">
            <div className="revenue-head">
              <h4>Tổng thu trong tháng</h4>
              <span className="revenue-total">
                {totalRevenue.toFixed(1)} triệu
              </span>
            </div>

            <div className="revenue-lines">
              <div className="revenue-line">
                <div className="revenue-line-top">
                  <span>Thu cố định</span>
                  <strong>{totalFixedFee.toFixed(1)} triệu</strong>
                </div>
                <div className="revenue-bar">
                  <div className="fixed" style={{ width: `${fixedPct}%` }} />
                </div>
              </div>
              <div className="revenue-line">
                <div className="revenue-line-top">
                  <span>Đóng góp</span>
                  <strong>{totalContribution.toFixed(1)} triệu</strong>
                </div>
                <div className="revenue-bar">
                  <div className="contrib" style={{ width: `${contribPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <h4>Tổng số hộ gia đình</h4>

            <div className="value-row">
              <span className="icon-container blue">
                <FaHome />
              </span>
              <span className="value">1234</span>
            </div>
          </div>
        </div>


        <div className="card">
          <div className="card-content">
            <h4 className="card-title">Tổng số nhân khẩu</h4>
            <div className="value-row">
              <span className="icon-container green">
                <FaUserFriends />
              </span>
              <span className="value">3568</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <h4>Hồ sơ cần xử lý</h4>
            <div className="value-row">
              <span className="icon-container purple">
                <FaFolderOpen />
              </span>
              <span className="value">12</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel panel-bars">
          <div className="panel-head">
            <h3>Thu phí theo tháng</h3>
            <span className="panel-sub">Thu cố định & Đóng góp</span>
          </div>

          <div className="panel-body">
            {isReady && (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={feeChartData}
                  margin={{ top: 10, right: 14, left: 0, bottom: 0 }}
                  barGap={4}
                  barCategoryGap="30%"
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
                    tickMargin={10}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                  />
                  <YAxis
                    allowDecimals={true}
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
                    labelStyle={{ fontSize: 12, fontWeight: 700 }}
                    formatter={(value, name) => [
                      `${Number(value).toFixed(1)} triệu`,
                      name === "fixedFee" ? "Thu cố định" : "Đóng góp",
                    ]}
                  />
                  <RechartsLegend
                    verticalAlign="top"
                    height={32}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingBottom: 6 }}
                  />

                  <Bar
                    dataKey="fixedFee"
                    name="Thu cố định"
                    fill="#639beb"
                    radius={[8, 8, 8, 8]}
                    barSize={14}
                  />
                  <Bar
                    dataKey="contribution"
                    name="Đóng góp"
                    fill="#d8e7f7"
                    radius={[8, 8, 8, 8]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="panel panel-two-rows">
          <div className="panel-head">
            <h3>Thu phí / Nợ phí</h3>
            <span className="panel-sub">Tổng quan tháng này</span>
          </div>

          <div className="panel-body two-rows">
            <div className="mini-card">
              <div className="row-head">
                <p className="mini-label">Tỷ lệ đóng phí tháng này</p>
                <span className="row-change up">▲ 4%</span>
              </div>

              <p className="mini-value">92%</p>

              <div className="progress-bar">
                <div className="progress-fill green" style={{ width: "92%" }} />
              </div>

              <p className="mini-sub">1.136 / 1.234 hộ đã đóng phí</p>
            </div>

            <div className="mini-card">
              <div className="row-head">
                <p className="mini-label">Số hộ còn nợ phí</p>
                <span className="row-change down">▼ 5%</span>
              </div>

              <p className="mini-value">18 hộ</p>

              <div className="progress-bar">
                <div className="progress-fill red" style={{ width: "1.46%" }} />
              </div>

              <p className="mini-sub">18 / 1.234 hộ chưa hoàn thành</p>
            </div>
          </div>
        </div>

        <div className="bottom-row">
          <div className="panel panel-pie">
            <div className="panel-head">
              <h3>Cơ cấu độ tuổi</h3>
              <span className="panel-sub">Theo nhóm tuổi</span>
            </div>

            <div className="panel-body pie-body">
              {isReady && (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={populationStructureData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {populationStructureData.map((entry, index) => (
                        <Cell key={`cell-age-${index}`} fill={entry.color} />
                      ))}

                      <Label
                        position="center"
                        content={({ viewBox }) => {
                          if (!viewBox) return null;
                          const cx = Number(viewBox.cx);
                          const cy = Number(viewBox.cy);
                          if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

                          return (
                            <g>
                              <text
                                x={cx}
                                y={cy - 2}
                                textAnchor="middle"
                                style={{
                                  fontSize: "16px",
                                  fontWeight: 800,
                                  fill: "#111827",
                                }}
                              >
                                {totalPopulation}
                              </text>
                              <text
                                x={cx}
                                y={cy + 16}
                                textAnchor="middle"
                                style={{ fontSize: "11px", fill: "#6B7280" }}
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

              <div className="mini-legend">
                {populationStructureData.map((item) => {
                  const percent = Math.round((item.value / totalPopulation) * 100);
                  return (
                    <div key={item.name} className="mini-legend-row">
                      <div className="mini-legend-left">
                        <span className="mini-dot" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="mini-legend-right">
                        {item.value} ({percent}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="panel panel-pie">
            <div className="panel-head">
              <h3>Tình trạng cư trú</h3>
              <span className="panel-sub">Phân bố trạng thái</span>
            </div>

            <div className="panel-body pie-body">
              {isReady && (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={residencyPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {residencyPieData.map((entry, index) => (
                        <Cell key={`cell-res-${index}`} fill={entry.color} />
                      ))}

                      <Label
                        position="center"
                        content={({ viewBox }) => {
                          if (!viewBox) return null;
                          const cx = Number(viewBox.cx);
                          const cy = Number(viewBox.cy);
                          if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

                          return (
                            <g>
                              <text
                                x={cx}
                                y={cy - 2}
                                textAnchor="middle"
                                style={{
                                  fontSize: "16px",
                                  fontWeight: 800,
                                  fill: "#111827",
                                }}
                              >
                                {totalResidency}
                              </text>
                              <text
                                x={cx}
                                y={cy + 16}
                                textAnchor="middle"
                                style={{ fontSize: "11px", fill: "#6B7280" }}
                              >
                                Bản ghi
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}

              <div className="mini-legend">
                {residencyPieData.map((item) => {
                  const percent = Math.round((item.value / totalResidency) * 100);
                  return (
                    <div key={item.name} className="mini-legend-row">
                      <div className="mini-legend-left">
                        <span className="mini-dot" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="mini-legend-right">
                        {item.value} ({percent}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="panel panel-requests">
            <div className="panel-head">
              <h3>Yêu cầu / Hồ sơ</h3>
              <span className="panel-sub">Gần đây</span>
            </div>

            <div className="panel-body">
              <div className="req-row">
                <div className="req-main">
                  <div className="req-title">Xác nhận tạm trú</div>
                  <div className="req-sub">Hộ 277 West 11th Street</div>
                </div>
                <span className="pill inprogress">Đang xử lý</span>
              </div>

              <div className="req-row">
                <div className="req-main">
                  <div className="req-title">Cập nhật nhân khẩu</div>
                  <div className="req-sub">Hộ 123 Johnson Drive</div>
                </div>
                <span className="pill done">Hoàn tất</span>
              </div>

              <div className="req-row">
                <div className="req-main">
                  <div className="req-title">Khai báo chuyển đi</div>
                  <div className="req-sub">Hộ 44 Lock Brook</div>
                </div>
                <span className="pill overdue">Quá hạn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}