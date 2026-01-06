import { useEffect, useMemo, useState } from "react"
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
  Cell
} from "recharts"

import { FaFileExcel } from "react-icons/fa"

import "../../styles/staff/fee-report.css"

const API_BASE = "http://localhost:5000/api"
const NOW = new Date(2025, 11, 31, 0, 0, 0, 0) // 31/12/2025 local


function authHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function money(v) {
  return Number(v || 0).toLocaleString("vi-VN")
}

function getCurrentYear() {
  return NOW.getFullYear().toString()
}

function getCurrentMonth() {
  const m = String(NOW.getMonth() + 1).padStart(2, "0")
  return `${NOW.getFullYear()}-${m}`
}


function formatTrieu(total) {
  const tr = Number(total || 0) / 1_000_000
  const digits = tr >= 100 ? 0 : 1
  return tr.toLocaleString("vi-VN", { maximumFractionDigits: digits })
}

export default function FeeReport() {
  const [loading, setLoading] = useState(false)

  const [year, setYear] = useState(getCurrentYear())
  const [month, setMonth] = useState(getCurrentMonth())
  const [comparisonType, setComparisonType] = useState("month")

  const [overview, setOverview] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [householdStatus, setHouseholdStatus] = useState(null)
  const [comparison, setComparison] = useState(null)

  const [feeTypeId, setFeeTypeId] = useState("ALL")

  useEffect(() => {
    setMonth((prev) => {
      const safe = typeof prev === "string" && /^\d{4}-\d{2}$/.test(prev) ? prev : getCurrentMonth()
      const mm = safe.slice(5, 7)
      return `${year}-${mm}`
    })
  }, [year])

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mm = String(i + 1).padStart(2, "0")
      const value = `${year}-${mm}`
      const label = `Tháng ${mm}/${year}`
      return { value, label }
    })
  }, [year])

  async function handleExport() {
    if (loading) return
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/fee-report/export`, {
        params: { month },
        headers: authHeaders(),
        responseType: "blob"
      })

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
    } finally {
      setLoading(false)
    }
  }

  const pieColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  const topFeeTypes = useMemo(() => {
    const list = Array.isArray(feeTypes) ? feeTypes : []
    return list
      .filter((f) => Number(f?.totalCollected || 0) > 0 && f?.name !== "Các loại phí khác")
      .sort((a, b) => {
        if (Number(b.totalCollected) !== Number(a.totalCollected)) return Number(b.totalCollected) - Number(a.totalCollected)
        return Number(b.paidHouseholds || 0) - Number(a.paidHouseholds || 0)
      })
      .slice(0, 6)
  }, [feeTypes])

  const sortedFeeTypes = useMemo(() => {
    return [...(feeTypes || [])].sort((a, b) => {
      const aOther = a.name === "Các loại phí khác"
      const bOther = b.name === "Các loại phí khác"
      if (aOther !== bOther) return aOther ? 1 : -1

      if (Number(b.totalCollected) !== Number(a.totalCollected))
        return Number(b.totalCollected) - Number(a.totalCollected)

      return Number(b.paidHouseholds || 0) - Number(a.paidHouseholds || 0)
    })
  }, [feeTypes])


  const pieData = useMemo(() => {
    return topFeeTypes.map((f) => ({
      name: f.name,
      value: Number(f.totalCollected || 0)
    }))
  }, [topFeeTypes])

  const totalPieValue = useMemo(() => {
    return pieData.reduce((s, i) => s + Number(i.value || 0), 0)
  }, [pieData])

  const totalPieCenter = useMemo(() => {
    return totalPieValue
  }, [totalPieValue])

  const pieLegendItems = useMemo(() => {
    return pieData
  }, [pieData])

  useEffect(() => {
    fetchOverview()
    fetchFeeTypeAllTime()
  }, [])

  useEffect(() => {
    fetchMonthly()
  }, [year])

  useEffect(() => {
    fetchHouseholdStatus()
  }, [month, feeTypeId])

  useEffect(() => {
    fetchComparison()
  }, [month, comparisonType, year])

  async function fetchOverview() {
    try {
      const res = await axios.get(`${API_BASE}/fee-report/overview`, { headers: authHeaders() })
      setOverview(res.data)
    } catch (e) {
      console.error(e)
      setOverview(null)
    }
  }

  async function fetchFeeTypeAllTime() {
    try {
      const res = await axios.get(`${API_BASE}/fee-report/by-fee-type`, { headers: authHeaders() })
      setFeeTypes(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error(e)
      setFeeTypes([])
    }
  }

  async function fetchMonthly() {
    try {
      const res = await axios.get(`${API_BASE}/fee-report/monthly`, {
        params: { year },
        headers: authHeaders()
      })
      setMonthly(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error(e)
      setMonthly([])
    }
  }

  async function fetchHouseholdStatus() {
    try {
      const res = await axios.get(`${API_BASE}/fee-report/household-status`, {
        params: { month, feeTypeId },
        headers: authHeaders()
      })
      setHouseholdStatus(res.data)
    } catch (e) {
      console.error(e)
      setHouseholdStatus(null)
    }
  }

  async function fetchComparison() {
    try {
      const res = await axios.get(`${API_BASE}/fee-report/comparison`, {
        params: {
          type: comparisonType,
          current: comparisonType === "month" ? month : year
        },
        headers: authHeaders()
      })
      setComparison(res.data)
    } catch (e) {
      console.error(e)
      setComparison(null)
    }
  }

  const feeTypeSelectOptions = useMemo(() => {
    return (feeTypes || []).filter((f) => (f.feeTypeId || f.id) && f.name !== "Các loại phí khác")
  }, [feeTypes])

  return (
    <div className="fee-report">
      <div className="fee-report-container">
        <div className="report-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Báo cáo – Thống kê Tài chính</h1>
              <p>Tổng hợp và phân tích tình hình thu phí trong khu dân cư</p>
            </div>
            <button className="btn-primary-excel" onClick={handleExport} disabled={loading}>
              <FaFileExcel /> {loading ? "Đang xử lý..." : "Xuất báo cáo"}
            </button>
          </div>
        </div>

        {loading && <div>Đang tải dữ liệu...</div>}

        {!loading && overview && (
          <section className="report-section">
            <h2 className="section-title">Tổng quan</h2>

            <div className="overview-grid">
              <div className="overview-card">
                <p className="card-label">Tổng số tiền đã thu</p>
                <p className="card-value card-value-primary">{money(overview.totalCollected)} đ</p>
              </div>

              <div className="overview-card">
                <p className="card-label">Tổng số tiền đã thu (bắt buộc)</p>
                <p className="card-value">{money(overview.collectedMandatory)} đ</p>
              </div>

              <div className="overview-card">
                <p className="card-label">Tổng số tiền đã đóng góp</p>
                <p className="card-value">{money(overview.collectedVoluntary)} đ</p>
              </div>

              <div className="overview-card">
                <p className="card-label">Tỷ lệ hoàn thành (bắt buộc)</p>
                <p className="card-value card-value-primary">{overview.completionRate}%</p>
              </div>
            </div>

            <div className="overview-mini">
              <div className="mini-item">
                <span className="mini-label">Cần thu bắt buộc</span>
                <span className="mini-value">{money(overview.mandatoryExpected)} đ</span>
              </div>

              <div className="mini-divider" />

              <div className="mini-item danger">
                <span className="mini-label">Còn thiếu</span>
                <span className="mini-value">{money(overview.mandatoryRemaining)} đ</span>
              </div>
            </div>
          </section>
        )}

        <section className="report-section">
          <div className="card">
            <div className="card-header card-header-inline">
              <h2>Thu phí theo thời gian</h2>
              <select className="filter-select filter-select-auto" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="fixedFee" name="Thu bắt buộc" fill="#3b82f6" />
                  <Bar dataKey="voluntaryFee" name="Đóng góp" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="report-section">
          <div className="card">
            <h2 className="card-title">Thống kê theo loại phí</h2>

            <div className="fee-type-grid">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tên khoản thu</th>
                      <th className="text-center">Số hộ phải đóng</th>
                      <th className="text-center">Số hộ đã đóng</th>
                      <th className="text-right">Tổng tiền</th>
                      <th className="text-center">Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFeeTypes.map((f, index) => (
                      <tr key={`${f.feeTypeId || f.id || f.name}-${index}`}>
                        <td>{f.name}</td>
                        <td className="text-center">{f.totalHouseholds}</td>
                        <td className="text-center">{f.paidHouseholds}</td>
                        <td className="text-right">{money(f.totalCollected)} đ</td>
                        <td className="text-center">
                          <div className="progress-cell">
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${Math.min(100, Math.max(0, Number(f.completionRate) || 0))}%`
                                }}
                              />
                            </div>
                            <span className="progress-text">{f.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sortedFeeTypes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center">
                          Chưa có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="fee-type-pie">
                {pieData.length > 0 && totalPieValue > 0 ? (
                  <div className="pie-wrap">
                    <div className="pie-stage">
                      <PieChart width={360} height={260}>
                        <Tooltip formatter={(value, name) => [`${money(value)} đ`, name]} separator=": " />
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={72}
                          outerRadius={108}
                          dataKey="value"
                          paddingAngle={2}
                          label={false}
                          labelLine={false}
                          isAnimationActive
                        >
                          {pieData.map((f, i) => (
                            <Cell key={`${f.name}-${i}`} fill={pieColors[i % pieColors.length]} />
                          ))}
                        </Pie>

                        <text x="50%" y="48%" textAnchor="middle" className="pie-center-label">
                          {formatTrieu(totalPieCenter)} Tr
                        </text>
                        <text x="50%" y="58%" textAnchor="middle" className="pie-center-sub">
                          Tổng thu (6 khoản)
                        </text>
                      </PieChart>
                    </div>

                    <div className="pie-legend-grid pie-legend-6">
                      {pieLegendItems.map((item, i) => (
                        <div key={`${item.name}-lg-${i}`} className="pie-legend-item">
                          <span className="pie-legend-swatch" style={{ background: pieColors[i % pieColors.length] }} />
                          <span className="pie-legend-text" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pie-empty">Chưa có dữ liệu</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {householdStatus && (
          <section className="report-section">
            <div className="card">
              <div className="card-header card-header-inline">
                <h2 className="card-title">Tình trạng thanh toán hộ dân</h2>

                <div className="header-filters">
                  <select className="filter-select filter-select-auto" value={month} onChange={(e) => setMonth(e.target.value)}>
                    {monthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <select className="filter-select filter-select-auto" value={feeTypeId} onChange={(e) => setFeeTypeId(e.target.value)}>
                    <option value="ALL">Tất cả phí bắt buộc</option>
                    {feeTypeSelectOptions.map((f) => (
                      <option key={f.feeTypeId || f.id} value={f.feeTypeId || f.id}>
                        {f.name}
                      </option>
                    ))}
                    <option value="OTHER">Các loại phí khác</option>
                  </select>
                </div>
              </div>

              <div className="household-two-col">
                <div className="household-left">
                  <div className="household-total">
                    <div className="muted">Tổng số hộ dân</div>
                    <div className="big">{householdStatus.totalHouseholds} hộ</div>
                  </div>

                  <div className="household-lines">
                    <div className="line">
                      <span className="status-badge success">Đã hoàn thành</span>
                      <span>{householdStatus.completed} hộ</span>
                      <span className="muted">{householdStatus.rates?.completed ?? 0}%</span>
                    </div>

                    <div className="line">
                      <span className="status-badge warning">Chưa hoàn thành</span>
                      <span>{householdStatus.incomplete} hộ</span>
                      <span className="muted">{householdStatus.rates?.incomplete ?? 0}%</span>
                    </div>

                    <div className="line">
                      <span className="status-badge danger">Chưa đóng</span>
                      <span>{householdStatus.notPaid} hộ</span>
                      <span className="muted">{householdStatus.rates?.notPaid ?? 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="household-right">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Trạng thái</th>
                        <th className="text-right">Số hộ</th>
                        <th className="text-right">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <span className="status-badge success">Đã hoàn thành</span>
                        </td>
                        <td className="text-right">{householdStatus.completed}</td>
                        <td className="text-right">{householdStatus.rates?.completed ?? 0}%</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="status-badge warning">Chưa hoàn thành</span>
                        </td>
                        <td className="text-right">{householdStatus.incomplete}</td>
                        <td className="text-right">{householdStatus.rates?.incomplete ?? 0}%</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="status-badge danger">Chưa đóng</span>
                        </td>
                        <td className="text-right">{householdStatus.notPaid}</td>
                        <td className="text-right">{householdStatus.rates?.notPaid ?? 0}%</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Tổng cộng</strong>
                        </td>
                        <td className="text-right">
                          <strong>{householdStatus.totalHouseholds}</strong>
                        </td>
                        <td className="text-right">
                          <strong>100%</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
                <select value={comparisonType} onChange={(e) => setComparisonType(e.target.value)} className="filter-select filter-select-auto">
                  <option value="month">Tháng này ↔ Tháng trước</option>
                  <option value="year">Năm nay ↔ Năm trước</option>
                </select>
              </div>

              <div className="comparison-grid">
                <div className="comparison-block">
                  <p className="comparison-title">Tổng thu</p>

                  <div className="comparison-cards">
                    <div className="mini-card active">
                      <span>Kỳ hiện tại</span>
                      <strong>{money(comparison.totalCollected.current)} đ</strong>
                    </div>
                    <div className="mini-card">
                      <span>Kỳ trước</span>
                      <strong>{money(comparison.totalCollected.previous)} đ</strong>
                    </div>
                  </div>

                  <div className="comparison-change positive">
                    {comparison.totalCollected.change === null
                      ? "— Không có dữ liệu kỳ trước"
                      : `▲ +${comparison.totalCollected.change}% so với kỳ trước`}
                  </div>
                </div>

                <div className="comparison-block">
                  <p className="comparison-title">Tỷ lệ hoàn thành (bắt buộc)</p>

                  <div className="comparison-cards">
                    <div className="mini-card active">
                      <span>Kỳ hiện tại</span>
                      <strong>{comparison.completionRate.current}%</strong>
                    </div>
                    <div className="mini-card">
                      <span>Kỳ trước</span>
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
