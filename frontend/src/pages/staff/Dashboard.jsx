import React, { useState, useEffect, useMemo } from "react"
import { FaHome, FaUserFriends, FaFolderOpen } from "react-icons/fa"
import { MdOutlineAttachMoney } from "react-icons/md"
import CountUp from "react-countup"

import "../../styles/staff/dashboard.css"

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
  YAxis
} from "recharts"

function getChangeLabel(ct) {
  switch (ct) {
    case 0: return "Khai sinh"
    case 1: return "Đăng ký tạm trú"
    case 3: return "Khai báo thường trú"
    case 5: return "Tách hộ"
    case 6: return "Đổi chủ hộ"
    case 2: return "Đăng ký tạm vắng"
    case 4: return "Chuyển đi"
    case 7: return "Khai tử"
    default: return "Hồ sơ dân cư"
  }
}

export default function Dashboard() {
  const [isReady, setIsReady] = useState(false)
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("http://localhost:5000/api/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.message || "Dashboard request failed")
        }

        setDashboard(data)
      } catch (e) {
        console.error("Dashboard fetch error:", e)
        setDashboard(null)
      } finally {
        setIsReady(true)
      }
    }
    fetchDashboard()
  }, [])

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]

  const fixedFee = dashboard
    ? dashboard.feeByMonth.map(m => m.mandatoryTotal)
    : [3.2, 3.1, 3.3, 3.2, 3.4, 3.3, 3.5, 3.6, 3.4, 3.5, 3.6, 3.8]

  const contribution = dashboard
    ? dashboard.feeByMonth.map(m => m.contributionTotal)
    : [0.6, 1.1, 0.9, 1.4, 1.0, 1.3, 1.2, 1.8, 1.1, 1.6, 1.0, 2.2]

  const totalFixedFee = fixedFee[fixedFee.length - 1]
  const totalContribution = contribution[contribution.length - 1]
  const totalRevenue = totalFixedFee + totalContribution

  const fixedPct = totalRevenue > 0 ? (totalFixedFee / totalRevenue) * 100 : 0
  const contribPct = totalRevenue > 0 ? (totalContribution / totalRevenue) * 100 : 0

  const feeChartData = useMemo(() => {
    return months.map((month, index) => ({
      month,
      fixedFee: fixedFee[index],
      contribution: contribution[index]
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard])

  const populationStructureData = dashboard
    ? [
        { name: "Trẻ em (<15)", value: dashboard.ageStats.count.children, color: "#22C55E" },
        { name: "Thanh niên (15–35)", value: dashboard.ageStats.count.youth, color: "#0EA5E9" },
        { name: "Trung niên (36–60)", value: dashboard.ageStats.count.middle, color: "#F97316" },
        { name: "Cao tuổi (>60)", value: dashboard.ageStats.count.elderly, color: "#A855F7" }
      ]
    : [
        { name: "Trẻ em (<15)", value: 620, color: "#22C55E" },
        { name: "Thanh niên (15–35)", value: 1450, color: "#0EA5E9" },
        { name: "Trung niên (36–60)", value: 980, color: "#F97316" },
        { name: "Cao tuổi (>60)", value: 518, color: "#A855F7" }
      ]


  const totalPopulation = dashboard?.cards?.totalResidents ?? 0



  const residencyPieData = dashboard
    ? [
        { name: "Thường trú", value: dashboard.residenceStats.count.permanent, color: "#16A34A" },
        { name: "Tạm trú", value: dashboard.residenceStats.count.temporary, color: "#F59E0B" },
        { name: "Tạm vắng", value: dashboard.residenceStats.count.absent, color: "#3B82F6" }
      ]
    : [
        { name: "Thường trú", value: 2100, color: "#16A34A" },
        { name: "Tạm trú", value: 680, color: "#F59E0B" },
        { name: "Tạm vắng", value: 420, color: "#3B82F6" }
      ]


  const totalResidency = dashboard
  ? dashboard.residenceStats.count.permanent
    + dashboard.residenceStats.count.temporary
    + dashboard.residenceStats.count.absent
  : 0


  const totalHouseholds = dashboard?.cards.totalHouseholds ?? 0
  const totalResidents = dashboard?.cards.totalResidents ?? 0
  const pendingProfiles = dashboard?.cards.pendingProfiles ?? 0

  const MAX_REVENUE = 1_000_000

  const fixedWidthPct = Math.min(
    (totalFixedFee / MAX_REVENUE) * 100,
    100
  )

  const contribWidthPct = Math.min(
    (totalContribution / MAX_REVENUE) * 100,
    100
  )

  const formatMoney = v =>
    Math.round(v).toLocaleString("vi-VN")

  const unpaidHouseholds = dashboard?.currentMonthPayment.unpaidHouseholds ?? 0
  const paymentRate = dashboard?.currentMonthPayment.paymentRate ?? 0

  const paymentRateChange =
    dashboard?.currentMonthPayment.paymentRateChange ?? 0

  const unpaidHouseholdsChange =
    dashboard?.currentMonthPayment.unpaidHouseholdsChange ?? 0


  const unpaidRate =
    totalHouseholds > 0
      ? Math.round((unpaidHouseholds / totalHouseholds) * 100)
      : 0

  if (!isReady) return null
  if (!dashboard) return <div style={{ padding: 24 }}>Không có dữ liệu dashboard</div>


  return (
    <div className="dashboard">
      <div className="top-cards">
        <div className="card card-revenue">
          <div className="card-content">

            <h4>Tổng thu trong tháng</h4>

            {/* Tổng tiền */}
            <div className="value-row revenue-total-row">
              <span className="icon-container money"><MdOutlineAttachMoney /></span>
              <span className="value revenue-value">
                {formatMoney(totalRevenue)} VND
              </span>
            </div>

            {/* Thu cố định */}
            <div className="revenue-bar">
              <div
                className="revenue-bar-fill fixed"
                style={{ width: `${fixedWidthPct}%` }}
              />
              <div className="revenue-bar-content">
                <span className="bar-label">Thu cố định</span>
                <span className="bar-value">
                  {formatMoney(totalFixedFee)} VND
                </span>
              </div>
            </div>

            {/* Đóng góp */}
            <div className="revenue-bar">
              <div
                className="revenue-bar-fill contrib"
                style={{ width: `${contribWidthPct}%` }}
              />
              <div className="revenue-bar-content">
                <span className="bar-label">Đóng góp</span>
                <span className="bar-value">
                  {formatMoney(totalContribution)} VND
                </span>
              </div>
            </div>


          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <h4>Tổng số hộ gia đình</h4>
              <div className="value-row value-row-metric">
                <span className="icon-container blue"><FaHome /></span>
                <div className="value-with-unit">
                  <span className="value-number">{totalHouseholds}</span>
                  <span className="value-unit">hộ</span>
                </div>
              </div>

            <div className="card-sub">Hộ đang hoạt động</div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <h4 className="card-title">Tổng số nhân khẩu</h4>
            <div className="value-row value-row-metric">
              <span className="icon-container green"><FaUserFriends /></span>
              <div className="value-with-unit">
                <span className="value-number">{totalResidents}</span>
                <span className="value-unit">nhân khẩu</span>
              </div>
            </div>

            <div className="card-sub">
              Thường trú · Tạm trú · Tạm vắng
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <h4>Hồ sơ cần xử lý</h4>
            <div className="value-row value-row-metric">
              <span className="icon-container purple"><FaFolderOpen /></span>
              <div className="value-with-unit">
                <span className="value-number">{pendingProfiles}</span>
                <span className="value-unit">hồ sơ</span>
              </div>
            </div>

            <div className="card-sub">
              Đang chờ duyệt
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel panel-bars">
          <div className="panel-head panel-head-custom">
            {/* Title + sub: căn trái */}
            <div className="panel-title-group">
              <h3>Thu phí theo tháng</h3>
              <span className="panel-sub">Thu cố định & Đóng góp</span>
            </div>

            {/* 2 pill RIÊNG BIỆT – CENTER – có chấm màu */}
            <div className="legend-center">
              <span className="legend-pill active fixed">
                <span className="legend-dot fixed" />
                Thu cố định
              </span>

              <span className="legend-pill contrib">
                <span className="legend-dot contrib" />
                Đóng góp
              </span>
            </div>
          </div>

          <div className="panel-body">
            {isReady && (
              <ResponsiveContainer width="100%" height={220}>
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
                      padding: 10
                    }}
                    labelStyle={{ fontSize: 12, fontWeight: 700 }}
                    formatter={(value, name, props) => [
                      `${Number(value).toFixed(1)} VND`,
                      props.dataKey === "fixedFee" ? "Thu cố định" : "Đóng góp"
                    ]}
                  />

                  {/*<RechartsLegend
                    verticalAlign="top"
                    height={32}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingBottom: 6 }}
                  /> */}

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
              <div className="mini-row">
                <div className="mini-label-col">
                  <span className="mini-label">Tỷ lệ đóng phí</span>
                </div>

                <div className="mini-main-col">
                  <div className="mini-value">
                    <span className="mini-number">
                      <CountUp end={paymentRate} duration={0.8} />
                    </span>
                    <span className="mini-unit">%</span>
                  </div>


                  <div className="progress-bar">
                    <div
                      className="progress-fill green"
                      style={{ width: `${paymentRate}%` }}
                    />
                  </div>

                  <div className="mini-trend">
                    {paymentRateChange !== 0 ? (
                      <span className={paymentRateChange > 0 ? "up" : "down"}>
                        {paymentRateChange > 0 ? "▲" : "▼"} {Math.abs(paymentRateChange)}%
                      </span>
                    ) : (
                      <span className="neutral">—</span>
                    )}
                    <span className="trend-sub">so với tháng trước</span>
                  </div>

                </div>

                <div className="mini-side">
                  <div className="mini-side-value">
                    {totalHouseholds - unpaidHouseholds} / {totalHouseholds}
                  </div>
                  <div className="mini-side-label">
                    hộ đã đóng
                  </div>
                </div>

              </div>
            </div>
    



            <div className="mini-card">
              <div className="mini-row">
                <div className="mini-label-col">
                  <span className="mini-label">Hộ còn nợ phí</span>
                </div>

                <div className="mini-main-col">
                  <div className="mini-value">
                    <CountUp end={unpaidHouseholds} duration={0.8} />
                    <span className="mini-unit">hộ</span>
                  </div>


                  <div className="progress-bar">
                    <div
                      className="progress-fill red"
                      style={{ width: `${unpaidRate}%` }}
                    />
                  </div>

                  <div className="mini-trend">
                    {unpaidHouseholdsChange !== 0 ? (
                      <span className={unpaidHouseholdsChange > 0 ? "up" : "down"}>
                        {unpaidHouseholdsChange > 0 ? "▲" : "▼"} {Math.abs(unpaidHouseholdsChange)}%
                      </span>
                    ) : (
                      <span className="neutral">—</span>
                    )}
                    <span className="trend-sub">so với tháng trước</span>
                  </div>
                </div>

                <div className="mini-side">
                  <div className="mini-side-value">
                    {unpaidHouseholds} / {totalHouseholds} 
                  </div>
                  <div className="mini-side-label">
                    hộ chưa hoàn thành
                  </div>
                </div>

              </div>
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
                        <Cell key={index} fill={entry.color} />
                      ))}

                      <Label
                        position="center"
                        content={({ viewBox }) => {
                          if (!viewBox) return null
                          const cx = Number(viewBox.cx)
                          const cy = Number(viewBox.cy)
                          if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null
                          return (
                            <g>
                              <text
                                x={cx}
                                y={cy - 2}
                                textAnchor="middle"
                                style={{ fontSize: "16px", fontWeight: 800, fill: "#111827" }}
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
                          )
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}

              <div className="mini-legend">
                {populationStructureData.map(item => {
                  const percent = totalPopulation > 0 ? Math.round((item.value / totalPopulation) * 100) : 0
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
                  )
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
                        <Cell key={index} fill={entry.color} />
                      ))}

                      <Label
                        position="center"
                        content={({ viewBox }) => {
                          if (!viewBox) return null
                          const cx = Number(viewBox.cx)
                          const cy = Number(viewBox.cy)
                          if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null
                          return (
                            <g>
                              <text
                                x={cx}
                                y={cy - 2}
                                textAnchor="middle"
                                style={{ fontSize: "16px", fontWeight: 800, fill: "#111827" }}
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
                          )
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}

              <div className="mini-legend">
                {residencyPieData.map(item => {
                  const percent = totalResidency > 0 ? Math.round((item.value / totalResidency) * 100) : 0
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
                  )
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
              {dashboard?.recentRequests?.length > 0
                ? dashboard.recentRequests.map(r => (
                    <div key={r.id} className="req-row">
                      <div className="req-main">
                        <div className="req-title">
                          {r.resident?.fullname
                            ?? r.extraData?.fullname
                            ?? "Hồ sơ dân cư"}
                        </div>
                        <div className="req-sub">
                          {[
                            r.resident?.residentCCCD ?? r.extraData?.residentCCCD,
                            getChangeLabel(r.changeType)
                          ].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <span className="pill inprogress">Đang xử lý</span>
                    </div>
                  ))
                : (
                    <div className="req-empty">
                      Chưa có hồ sơ chờ xử lý
                    </div>
                  )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
