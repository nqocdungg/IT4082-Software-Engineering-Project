// frontend/src/pages/staff/FeeHistory.jsx
import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFileExcel,
  FaPrint,
  FaMoneyBill,
  FaCheckCircle,
  FaClock,
  FaTimesCircle
} from "react-icons/fa"
 
import "../../styles/staff/layout.css"
import "../../styles/staff/fees-history.css"
import { formatDateDMY } from "../../utils/date"
 
const API_BASE = "http://localhost:5000/api"
 
function authHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}
 
function money(v) {
  return new Intl.NumberFormat("vi-VN").format(Number(v || 0))
}
 
function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
 
function getCurrentMonth() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${d.getFullYear()}-${m}`
}
 
export default function FeeHistory() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
 
  const [search, setSearch] = useState("")
  const [method, setMethod] = useState("ALL")
  const [status, setStatus] = useState("ALL")
  const [sort, setSort] = useState("desc")
  const [month, setMonth] = useState("")


  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [total, setTotal] = useState(0)
 
  // ✅ stats global theo filter (q/method/month) nhưng bỏ status để card không bị vô nghĩa
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, partial: 0 })
 
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
 
  const debouncedSearch = useDebouncedValue(search, 350)
 
  async function fetchData() {
    setLoading(true)
    try {
      const params = { page, pageSize, sort }
 
      if (debouncedSearch.trim()) params.q = debouncedSearch.trim()
      if (method !== "ALL") params.method = method
      if (status !== "ALL") params.status = status
      if (month) params.month = month
 
      const res = await axios.get(`${API_BASE}/fee-history`, {
        headers: authHeaders(),
        params
      })
 
      setRows(res.data?.data || [])
      setTotal(res.data?.meta?.total || 0)
 
      const s = res.data?.meta?.stats
      if (s) {
        setStats({
          total: Number(s.total || 0),
          paid: Number(s.paid || 0),
          pending: Number(s.pending || 0),
          partial: Number(s.partial || 0)
        })
      } else {
        setStats({ total: 0, paid: 0, pending: 0, partial: 0 })
      }
    } finally {
      setLoading(false)
    }
  }
 
  async function fetchDetail(id) {
    const res = await axios.get(`${API_BASE}/fee-history/${id}`, {
      headers: authHeaders()
    })
    setDetail(res.data?.data)
  }
 
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, method, status, debouncedSearch, sort, month])
 
  useEffect(() => {
    if (selected) fetchDetail(selected.id)
    else setDetail(null)
  }, [selected])
 
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
 
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])
 
  const rangeText = useMemo(() => {
    if (!total) return `0 - 0 trên tổng số 0 bản ghi`
    const start = (page - 1) * pageSize + 1
    const end = Math.min(page * pageSize, total)
    return `${start} - ${end} trên tổng số ${total} bản ghi`
  }, [page, pageSize, total])
 
  const exportExcel = async () => {
    try {
      const params = { sort }
      if (debouncedSearch.trim()) params.q = debouncedSearch.trim()
      if (method !== "ALL") params.method = method
      if (status !== "ALL") params.status = status
      if (month) params.month = month
 
      const res = await axios.get(`${API_BASE}/fee-history/export-excel`, {
        headers: authHeaders(),
        params,
        responseType: "blob"
      })
 
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      })
 
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fee_history_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error("export excel error:", e)
      alert("Không xuất được Excel")
    }
  }
 
  const printInvoice = async () => {
    if (!selected) return
    try {
      const res = await axios.get(`${API_BASE}/fee-history/${selected.id}/invoice`, {
        headers: authHeaders(),
        responseType: "blob"
      })
 
      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      window.open(url, "_blank")
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      console.error("print invoice error:", e)
      alert("Không in/xuất được hóa đơn PDF")
    }
  }
 
  const statusBadgeClass = s => {
    if (s === 2) return "status-thuong_tru"
    if (s === 0) return "status-tam_tru"
    return "status-tam_vang"
  }
 
  const collectorName = r => {
    if (String(r?.method || "").toUpperCase() === "ONLINE") return "HỆ THỐNG"
    return r?.manager?.fullname || "—"
  }
 
  return (
    <div className="page-container fee-history-page">
      <div className="stats-strip">
        {[
          { label: "Tất cả", value: stats.total, icon: <FaMoneyBill />, tone: "blue" },
          { label: "Đã nộp", value: stats.paid, icon: <FaCheckCircle />, tone: "green" },
          { label: "Chưa nộp", value: stats.pending, icon: <FaClock />, tone: "amber" },
          { label: "Nộp 1 phần", value: stats.partial, icon: <FaTimesCircle />, tone: "rose" }
        ].map(c => (
          <div key={c.label} className={`mini-card tone-${c.tone}`}>
            <div className="mini-ico">{c.icon}</div>
            <div className="mini-meta">
              <div className="mini-value">{c.value ?? 0}</div>
              <div className="mini-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>
 
      <div className="card table-card">
        <div className="table-toolbar">
          <div className="toolbar-row">
            <div className="toolbar-left">
              <div className="toolbar-field">
                <select
                  value={method}
                  onChange={e => {
                    setPage(1)
                    setMethod(e.target.value)
                  }}
                >
                  <option value="ALL">Tất cả</option>
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </div>
 
              <div className="toolbar-field">
                <select
                  value={status}
                  onChange={e => {
                    setPage(1)
                    setStatus(e.target.value)
                  }}
                >
                  <option value="ALL">Tất cả</option>
                  <option value="0">Chưa nộp</option>
                  <option value="1">Nộp 1 phần</option>
                  <option value="2">Đã nộp</option>
                </select>
              </div>
 
              <div className="toolbar-field">
                <input
                  type="month"
                  value={month}
                  onChange={e => {
                    setPage(1)
                    setMonth(e.target.value)
                  }}
                />
              </div>
 
              <div className="toolbar-field">
                <select
                  value={sort}
                  onChange={e => {
                    setPage(1)
                    setSort(e.target.value)
                  }}
                >
                  <option value="desc">Mới nhất</option>
                  <option value="asc">Cũ nhất</option>
                </select>
              </div>
            </div>
          </div>
 
          <div className="toolbar-row">
            <div className="toolbar-left">
              <button type="button" className="btn-primary-excel" onClick={exportExcel}>
                <FaFileExcel /> Xuất Excel
              </button>
            </div>
 
            <div className="toolbar-right">
              <div className="toolbar-search">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm hộ / khoản thu / người thu"
                  value={search}
                  onChange={e => {
                    setPage(1)
                    setSearch(e.target.value)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
 
        <div className="table-wrapper">
          <table className="resident-table fee-history-table">
            <thead>
              <tr>
                <th>Ngày thu</th>
                <th>Hộ khẩu</th>
                <th>Khoản thu</th>
                <th>Số tiền</th>
                <th>Hình thức</th>
                <th>Trạng thái</th>
                <th>Người thu</th>
              </tr>
            </thead>
 
            <tbody>
              {loading || rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-row">
                    {loading ? "Đang tải..." : "Không có dữ liệu nào để hiển thị"}
                  </td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="clickable-row" onClick={() => setSelected(r)}>
                    <td>{formatDateDMY(r.createdAt)}</td>
                    <td>
                      <b>{r.household?.householdCode}</b>
                      <div className="sub-text">{r.household?.address}</div>
                    </td>
                    <td>{r.feeType?.name}</td>
                    <td>{money(r.amount)} đ</td>
                    <td>{r.method}</td>
                    <td>
                      <span className={`status-badge ${statusBadgeClass(r.status)}`}>
                        {r.status === 2 ? "Đã nộp" : r.status === 1 ? "Nộp 1 phần" : "Chưa nộp"}
                      </span>
                    </td>
                    <td>{collectorName(r)}</td>
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
              value={pageSize}
              onChange={e => {
                setPage(1)
                setPageSize(Number(e.target.value))
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
 
      {selected && detail && (
        <div className="resident-modal-overlay" onClick={() => setSelected(null)}>
          <div className="resident-modal" onClick={e => e.stopPropagation()}>
            <div className="resident-modal-header">
              <div>
                <h3 className="resident-modal-title">Chi tiết thu phí</h3>
                <p className="resident-modal-sub">ID: #{selected.id}</p>
              </div>
              <button className="modal-close-btn" type="button" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>
 
            <div className="resident-modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Hộ</div>
                  <div className="detail-value">{detail.household?.householdCode || "—"}</div>
                </div>
 
                <div className="detail-item">
                  <div className="detail-label">Khoản thu</div>
                  <div className="detail-value">{detail.feeType?.name || "—"}</div>
                </div>
 
                <div className="detail-item">
                  <div className="detail-label">Số tiền</div>
                  <div className="detail-value">{money(detail.amount)} đ</div>
                </div>
 
                <div className="detail-item">
                  <div className="detail-label">Hình thức</div>
                  <div className="detail-value">{detail.method || "—"}</div>
                </div>
 
                <div className="detail-item detail-wide">
                  <div className="detail-label">Trạng thái</div>
                  <div className="detail-value">
                    <span className={`status-badge ${statusBadgeClass(detail.status)}`}>
                      {detail.status === 2 ? "Đã nộp" : detail.status === 1 ? "Nộp 1 phần" : "Chưa nộp"}
                    </span>
                  </div>
                </div>
 
                <div className="detail-item detail-wide">
                  <div className="detail-label">Người thu</div>
                  <div className="detail-value">
                    {String(detail?.method || "").toUpperCase() === "ONLINE"
                      ? "HỆ THỐNG"
                      : detail.manager?.fullname || "—"}
                  </div>
                </div>
              </div>
            </div>
 
            <div className="resident-modal-footer">
              <button className="btn-secondary" type="button" onClick={() => setSelected(null)}>
                Đóng
              </button>
              <button className="btn-primary" type="button" onClick={printInvoice}>
                <FaPrint /> In hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
