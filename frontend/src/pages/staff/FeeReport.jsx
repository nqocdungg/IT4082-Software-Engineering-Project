import { useEffect, useState } from "react"
import axios from "axios"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"

import "../../styles/staff/fee-report.css"

const API_BASE = "http://localhost:5000/api"

function authHeaders() {
  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function money(v) {
  return Number(v || 0).toLocaleString("vi-VN")
}

function getCurrentYear() {
  return new Date().getFullYear().toString()
}

function getCurrentMonth() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${d.getFullYear()}-${m}`
}

export default function FeeReport() {
  const [loading, setLoading] = useState(false)

  // ===== Filters =====
  const [year, setYear] = useState(getCurrentYear())
  const [month, setMonth] = useState(getCurrentMonth())
  const [comparisonType, setComparisonType] = useState("month")

async function handleExport() {
  if (loading) return

  try {
    const res = await axios.get(
      `${API_BASE}/fee-report/export`,
      {
        params: { month },
        headers: authHeaders(),
        responseType: "blob",
      }
    )

    const blob = new Blob([res.data])
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `bao-cao-tai-chinh-${month}.xlsx`
    document.body.appendChild(a)
    a.click()

    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error("Export failed:", err)
    alert("Không thể xuất báo cáo. Vui lòng kiểm tra quyền truy cập.")
  }
}

  // ===== Data =====
  const [overview, setOverview] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [householdStatus, setHouseholdStatus] = useState(null)
  const [comparison, setComparison] = useState(null)

  // ===== Pie =====
  const pieColors = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#64748b", 
]


  const pieData = feeTypes
    .filter(f => Number(f.totalCollected) > 0)
    .map((f) => ({
      name: f.name,
      value: Number(f.totalCollected),
    }))

  const totalPieValue = pieData.reduce((s, i) => s + i.value, 0)

  useEffect(() => {
    fetchOverview()
    fetchFeeType()
  }, [month])

  useEffect(() => {
    fetchHouseholdStatus()
  }, [month])


  useEffect(() => {
    fetchMonthly()
  }, [year])

  useEffect(() => {
    fetchComparison()
  }, [month, comparisonType])

  useEffect(() => {
    console.log("feeTypes:", feeTypes)
  }, [feeTypes])

async function fetchOverview() {
  const res = await axios.get(`${API_BASE}/fee-report/overview`, {
    params: { month },
    headers: authHeaders(),
  })
  setOverview(res.data)
}

async function fetchFeeType() {
  const res = await axios.get(`${API_BASE}/fee-report/by-fee-type`, {
    params: { month },
    headers: authHeaders(),
  })
  setFeeTypes(Array.isArray(res.data) ? res.data : [])
}

async function fetchMonthly() {
  const res = await axios.get(`${API_BASE}/fee-report/monthly`, {
    params: { year },
    headers: authHeaders(),
  })
  setMonthly(Array.isArray(res.data) ? res.data : [])
}

async function fetchHouseholdStatus() {
  const res = await axios.get(`${API_BASE}/fee-report/household-status`, {
    params: { month },
    headers: authHeaders(),
  })
  setHouseholdStatus(res.data)
}

async function fetchComparison() {
  const res = await axios.get(`${API_BASE}/fee-report/comparison`, {
    params: {
      type: comparisonType,
      current: comparisonType === "month" ? month : year,
    },
    headers: authHeaders(),
  })
  setComparison(res.data)
}




  const sortedFeeTypes = [...feeTypes].sort((a, b) => {
    if (b.totalCollected !== a.totalCollected)
      return b.totalCollected - a.totalCollected
    return b.paidHouseholds - a.paidHouseholds
  })


  return (
    <div className="fee-report">
      <div className="fee-report-container">
        {/* HEADER */}
        <div className="report-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Báo cáo – Thống kê Tài chính</h1>
              <p>Tổng hợp và phân tích tình hình thu phí trong khu dân cư</p>
            </div>
            <button
              className="export-btn"
              onClick={handleExport}
              disabled={loading}
              style={{
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Đang xử lý..." : "Xuất báo cáo"}
            </button>

          </div>
        </div>

        {loading && <div>Đang tải dữ liệu...</div>}

        {/* ===== OVERVIEW ===== */}
        {!loading && overview && (

          <section className="report-section">
            <h2 className="section-title">Tổng quan</h2>

            <div className="overview-grid">
              <div className="overview-card">
                <p className="card-label">Tổng số tiền phải thu</p>
                <p className="card-value">{money(overview.totalRequired)} đ</p>
              </div>

              <div className="overview-card">
                <p className="card-label">Đã thu</p>
                <p className="card-value card-value-primary">
                  {money(overview.totalCollected)} đ
                </p>
              </div>

              <div className="overview-card">
                <p className="card-label">Còn nợ</p>
                <p className="card-value">{money(overview.totalDebt)} đ</p>
              </div>

              <div className="overview-card">
                <p className="card-label">Tỷ lệ hoàn thành</p>
                <p className="card-value card-value-primary">
                  {overview.completionRate}%
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ===== MONTHLY BAR ===== */}
        <section className="report-section">
          <div className="card">
            <div className="card-header">
              <h2>Thu phí theo thời gian</h2>
              <select
                className="filter-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </div>

            <div className="chart-container" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="fixedFee" name="Thu bắt buộc" fill="#3b82f6" />
                  <Bar
                    dataKey="voluntaryFee"
                    name="Đóng góp"
                    fill="#10b981"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ===== FEE TYPE ===== */}
        <section className="report-section">
          <div className="card">
            <h2 className="card-title">Thống kê theo loại phí</h2>

            <div className="fee-type-grid">
              {/* TABLE */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Khoản thu</th>
                      <th className="text-center">Hộ đã đóng</th>
                      <th className="text-right">Tổng thu</th>
                      <th className="text-center">Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(sortedFeeTypes) && sortedFeeTypes.map((f, index) => (
                      <tr key={`${f.name}-${index}`}>
                        <td>{f.name}</td>
                        <td className="text-center">
                          {f.paidHouseholds}/{f.totalHouseholds}
                        </td>
                        <td className="text-right">
                          {money(f.totalCollected)} đ
                        </td>
                        <td className="text-center">
                          <div className="progress-cell">
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                      width: `${Math.min(100, Math.max(0, f.completionRate))}%`
                                    }}

                              />
                            </div>
                            <span className="progress-text">
                              {f.completionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PIE */}
              <div className="fee-type-pie">
                {pieData.length > 0 && totalPieValue > 0 ? (
                  <PieChart width={260} height={260}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={105}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieData.map((f, i) => (
                        <Cell
                          key={i}
                          fill={
                            f.name === "Các loại phí khác"
                              ? "#64748b"
                              : pieColors[i % pieColors.length]
                          }
                        />
                      ))}
                    </Pie>

                    <text x="50%" y="48%" textAnchor="middle" fontSize="20" fontWeight="600">
                      {(totalPieValue / 1_000_000).toFixed(0)} Tr
                    </text>
                    <text x="50%" y="58%" textAnchor="middle" fontSize="12" fill="#6b7280">
                      Tổng thu
                    </text>
                  </PieChart>
                ) : (
                  <div className="pie-empty">Chưa có dữ liệu</div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* ===== HOUSEHOLD ===== */}
        {householdStatus && (
          <section className="report-section">
            <div className="card">
              <h2 className="card-title">Tình trạng thanh toán hộ dân</h2>

              <div className="household-stats-grid">
                <div className="status-item">
                  <span className="status-badge success">Hoàn thành</span>
                  <span>{householdStatus.completed} hộ</span>
                </div>

                <div className="status-item">
                  <span className="status-badge warning">Chưa đủ</span>
                  <span>{householdStatus.incomplete} hộ</span>
                </div>

                <div className="status-item">
                  <span className="status-badge danger">Chưa đóng</span>
                  <span>{householdStatus.notPaid} hộ</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {comparison?.totalCollected?.current !== undefined && (
          <section className="report-section">
            <div className="card comparison-card">
              <div className="comparison-header">
                <h2>So sánh – Đối chiếu</h2>

                <select
                  value={comparisonType}
                  onChange={(e) => setComparisonType(e.target.value)}
                  className="filter-select"
                >
                  <option value="month">Tháng này ↔ Tháng trước</option>
                  <option value="year">Năm nay ↔ Năm trước</option>
                </select>
              </div>

              <div className="comparison-grid">
                {/* ===== TOTAL COLLECTED ===== */}
                <div className="comparison-block">
                  <p className="comparison-title">Tổng thu</p>

                  <div className="comparison-cards">
                    <div className="mini-card active">
                      <span>Tháng này</span>
                      <strong>{money(comparison.totalCollected.current)} đ</strong>
                    </div>
                    <div className="mini-card">
                      <span>Tháng trước</span>
                      <strong>{money(comparison.totalCollected.previous)} đ</strong>
                    </div>
                  </div>

                  <div className="comparison-change positive">
                    {comparison.totalCollected.change === null
                      ? "— Không có dữ liệu kỳ trước"
                      : `▲ +${comparison.totalCollected.change}% so với kỳ trước`}
                  </div>

                </div>

                {/* ===== COMPLETION RATE ===== */}
                <div className="comparison-block">
                  <p className="comparison-title">Tỷ lệ hoàn thành</p>

                  <div className="comparison-cards">
                    <div className="mini-card active">
                      <span>Tháng này</span>
                      <strong>{comparison.completionRate.current}%</strong>
                    </div>
                    <div className="mini-card">
                      <span>Tháng trước</span>
                      <strong>{comparison.completionRate.previous}%</strong>
                    </div>
                  </div>

                  <div className="comparison-change positive">
                    {comparison.completionRate.change === 0
                      ? "— Không thay đổi"
                      : `${comparison.completionRate.change > 0 ? "▲ +" : "▼ "}${comparison.completionRate.change}% so với kỳ trước`}
                  </div>

                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
