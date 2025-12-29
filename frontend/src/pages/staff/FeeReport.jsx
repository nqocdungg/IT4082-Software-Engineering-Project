// src/pages/staff/FeeReport.jsx
import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  FaChartLine,
  FaCoins,
  FaGlobe,
  FaWallet,
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEye
} from "react-icons/fa"

import "../../styles/staff/layout.css"
import "../../styles/staff/fees-report.css"
import { formatDateDMY } from "../../utils/date"

const API_BASE = "http://localhost:5000/api"

const API_PATHS = {
  summary: `${API_BASE}/fees/report/summary`,
  byFee: `${API_BASE}/fees/report/by-fee`,
  exportExcel: `${API_BASE}/fees/report/export-excel`
}

function authHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function money(v) {
  return new Intl.NumberFormat("vi-VN").format(Number(v || 0))
}

export default function FeeReport() {
  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [mandatoryFilter, setMandatoryFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const [summary, setSummary] = useState(null)
  const [byFee, setByFee] = useState([])
  const [loading, setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState("")

  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  async function fetchReport() {
    setLoading(true)
    setErrMsg("")
    try {
      const params = {
        mandatory: mandatoryFilter || "ALL",
        status: statusFilter || "ALL"
      }

      const [sRes, bRes] = await Promise.all([
        axios.get(API_PATHS.summary, { params, headers: authHeaders() }),
        axios.get(API_PATHS.byFee, {
          params: { mandatory: params.mandatory },
          headers: authHeaders()
        })
      ])

      setSummary(sRes.data?.data || null)
      setByFee(Array.isArray(bRes.data?.data) ? bRes.data.data : [])
      setPage(1)
    } catch (e) {
      console.error("fetchReport error:", e)
      setSummary(null)
      setByFee([])
      setErrMsg(e?.response?.data?.message || "Không tải được báo cáo")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [mandatoryFilter, statusFilter])

  function resetFilters() {
    setSearch("")
    setMandatoryFilter("ALL")
    setStatusFilter("ALL")
  }

  const cards = useMemo(() => {
    const s = summary || {
      totalTransactions: 0,
      totalCollected: 0,
      online: { transactions: 0, collected: 0 },
      offline: { transactions: 0, collected: 0 }
    }

    return [
      {
        label: "Tổng giao dịch",
        value: s.totalTransactions || 0,
        sub: "Số lần thu",
        tone: "blue",
        icon: <FaChartLine />
      },
      {
        label: "Tổng đã thu",
        value: `${money(s.totalCollected)} đ`,
        sub: "Online + Offline",
        tone: "green",
        icon: <FaCoins />
      },
      {
        label: "Online",
        value: `${money(s.online?.collected)} đ`,
        sub: `${s.online?.transactions || 0} giao dịch`,
        tone: "amber",
        icon: <FaGlobe />
      },
      {
        label: "Offline",
        value: `${money(s.offline?.collected)} đ`,
        sub: `${s.offline?.transactions || 0} giao dịch`,
        tone: "slate",
        icon: <FaWallet />
      }
    ]
  }, [summary])

  const filteredByFee = useMemo(() => {
    const list = Array.isArray(byFee) ? byFee : []
    const q = search.trim().toLowerCase()

    return list.filter(r => {
      const matchSearch = !q || (r.feeName || "").toLowerCase().includes(q)
      const matchMandatory =
        mandatoryFilter === "ALL" ||
        (mandatoryFilter === "MANDATORY" && !!r.isMandatory) ||
        (mandatoryFilter === "OPTIONAL" && !r.isMandatory)
      return matchSearch && matchMandatory
    })
  }, [byFee, search, mandatoryFilter])

  useEffect(() => {
    setPage(1)
  }, [search, mandatoryFilter, statusFilter, rowsPerPage])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((filteredByFee?.length || 0) / rowsPerPage))
  }, [filteredByFee, rowsPerPage])

  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])

  const pageRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return (filteredByFee || []).slice(start, start + rowsPerPage)
  }, [filteredByFee, page, rowsPerPage])

  const rangeText = useMemo(() => {
    const total = filteredByFee?.length || 0
    if (!total) return `0 - 0 trên tổng số 0 bản ghi`
    const start = (page - 1) * rowsPerPage + 1
    const end = Math.min(page * rowsPerPage, total)
    return `${start} - ${end} trên tổng số ${total} bản ghi`
  }, [filteredByFee, page, rowsPerPage])

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams()

      if (mandatoryFilter && mandatoryFilter !== "ALL") params.append("mandatory", mandatoryFilter)
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter)
      if (search.trim()) params.append("search", search.trim())

      const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
      const url = `${API_PATHS.exportExcel}?${params.toString()}`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const ct = res.headers.get("content-type") || ""

      // ✅ nếu BE trả JSON lỗi → đọc message và alert, không download
      if (!res.ok || ct.includes("application/json")) {
        let msg = "Không thể xuất file Excel"
        try {
          const j = await res.json()
          msg = j?.message || j?.error || msg
        } catch { }
        alert(msg)
        return
      }

      const blob = await res.blob()

      const cd = res.headers.get("content-disposition") || ""
      const m = cd.match(/filename="([^"]+)"/i)
      const filename = m?.[1] || "fee_report.xlsx"

      const link = document.createElement("a")
      link.href = window.URL.createObjectURL(blob)
      link.download = filename
      link.click()
      window.URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error(err)
      alert("Không thể xuất file Excel")
    }
  }


  return (
    <div className="page-container revenues-page fee-report-page">
      <div className="stats-strip fee-report-stats">
        {cards.map(c => (
          <div key={c.label} className={`mini-card tone-${c.tone}`}>
            <div className="mini-ico">{c.icon}</div>
            <div className="mini-meta">
              <div className="mini-value">{c.value}</div>
              <div className="mini-label">{c.label}</div>
              <div className="sub-text">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card table-card">
        <div className="table-toolbar">
          <div className="toolbar-row">
            <div className="toolbar-left">
              <div className="toolbar-select">
                <select
                  value={statusFilter}
                  onChange={e => {
                    setPage(1)
                    setStatusFilter(e.target.value)
                  }}
                >
                  <option value="ALL">Tất cả trạng thái giao dịch</option>
                  <option value="0">Chưa nộp (0)</option>
                  <option value="1">Nộp 1 phần (1)</option>
                  <option value="2">Đã nộp (2)</option>
                  <option value="3">Online (3)</option>
                </select>
              </div>

              <div className="toolbar-select">
                <select
                  value={mandatoryFilter}
                  onChange={e => {
                    setPage(1)
                    setMandatoryFilter(e.target.value)
                  }}
                >
                  <option value="ALL">Tất cả loại khoản thu</option>
                  <option value="MANDATORY">Bắt buộc</option>
                  <option value="OPTIONAL">Tự nguyện</option>
                </select>
              </div>

              {(search.trim() || mandatoryFilter !== "ALL" || statusFilter !== "ALL") && (
                <button className="btn-ghost compact" onClick={resetFilters} title="Xóa bộ lọc">
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="toolbar-right">
              <button className="btn-secondary" onClick={handleExportExcel}>
                Xuất Excel
              </button>

              <div className="toolbar-search">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm theo tên khoản thu..."
                  value={search}
                  onChange={e => {
                    setPage(1)
                    setSearch(e.target.value)
                  }}
                />
              </div>

              {errMsg ? (
                <span className="sub-text" style={{ color: "#b91c1c", fontWeight: 800 }}>
                  {errMsg}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="resident-table revenues-table">
            <thead>
              <tr>
                <th>Khoản thu</th>
                <th>Loại</th>
                <th>Thời gian áp dụng</th>
                <th>Tổng thu</th>
                <th>Giao dịch</th>
                <th>Online</th>
                <th>Offline</th>
                <th style={{ width: 130 }}>Truy soát</th>
              </tr>
            </thead>

            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-row">
                    {loading ? "Đang tải dữ liệu..." : "Không có dữ liệu báo cáo"}
                  </td>
                </tr>
              ) : (
                pageRows.map(r => (
                  <tr key={r.feeTypeId}>
                    <td className="col-name">
                      <div className="fee-name">{r.feeName}</div>
                      <div className="sub-text">Đơn giá: {r.unitPrice == null ? "—" : `${money(r.unitPrice)} đ`}</div>
                    </td>

                    <td>
                      <span className={r.isMandatory ? "fee-tag fee-tag-mandatory" : "fee-tag fee-tag-optional"}>
                        {r.isMandatory ? "Bắt buộc" : "Tự nguyện"}
                      </span>
                    </td>

                    <td className="col-date">
                      <span className={r.fromDate || r.toDate ? "fee-date-range" : "fee-date-range fee-date-none"}>
                        {r.fromDate || r.toDate
                          ? `${r.fromDate ? formatDateDMY(r.fromDate) : "—"} – ${r.toDate ? formatDateDMY(r.toDate) : "—"}`
                          : "Không thời hạn"}
                      </span>
                      <div className="sub-text">{r.isActive ? "Đang áp dụng" : "Đã khóa"}</div>
                    </td>

                    <td className="money-cell">{money(r.totalCollected)} đ</td>
                    <td>{r.transactions}</td>

                    <td className="money-cell">
                      {money(r.onlineCollected)} đ
                      <div className="sub-text">{r.onlineTransactions} gd</div>
                    </td>

                    <td className="money-cell">
                      {money(r.offlineCollected)} đ
                      <div className="sub-text">{r.offlineTransactions} gd</div>
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          title={r.isMandatory ? "Xem hộ còn thiếu" : "Chỉ truy soát khoản bắt buộc"}
                          disabled={!r.isMandatory}
                          onClick={() => navigate(`/fees-report/${r.feeTypeId}`)}
                        >
                          <FaEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div className="footer-left">
            <span className="footer-muted">Số bản ghi</span>
            <select
              value={rowsPerPage}
              onChange={e => {
                setPage(1)
                setRowsPerPage(Number(e.target.value))
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>

          <div className="footer-right">
            <span className="footer-muted">{rangeText}</span>
            <div className="pager">
              <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <FaChevronLeft />
              </button>
              <button type="button" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
