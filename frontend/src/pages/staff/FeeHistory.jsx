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
import "../../styles/staff/residentchange.css" // 🔥 dùng chung style
import { formatDateDMY } from "../../utils/date"

const API_BASE = "http://localhost:5000/api"

function authHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function money(v) {
  return new Intl.NumberFormat("vi-VN").format(Number(v || 0))
}

export default function FeeHistory() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  // filters
  const [search, setSearch] = useState("")
  const [method, setMethod] = useState("ALL")
  const [status, setStatus] = useState("ALL")

  // paging
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [total, setTotal] = useState(0)

  // detail popup
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)

  async function fetchData() {
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (search.trim()) params.q = search.trim()
      if (method !== "ALL") params.method = method
      if (status !== "ALL") params.status = status

      const res = await axios.get(`${API_BASE}/fee-history`, {
        headers: authHeaders(),
        params
      })

      setRows(res.data?.data || [])
      setTotal(res.data?.meta?.total || 0)
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
  }, [page, pageSize, method, status])

  useEffect(() => {
    if (selected) fetchDetail(selected.id)
    else setDetail(null)
  }, [selected])

  const stats = useMemo(() => {
    return {
      total,
      paid: rows.filter(r => r.status === 2).length,
      pending: rows.filter(r => r.status === 0).length,
      partial: rows.filter(r => r.status === 1).length
    }
  }, [rows, total])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const rangeText = useMemo(() => {
    if (!total) return `0 - 0 trên tổng số 0 bản ghi`
    const start = (page - 1) * pageSize + 1
    const end = Math.min(page * pageSize, total)
    return `${start} - ${end} trên tổng số ${total} bản ghi`
  }, [page, pageSize, total])

  const exportExcel = () => {
    const params = new URLSearchParams()
    if (search.trim()) params.append("q", search.trim())
    if (method !== "ALL") params.append("method", method)
    if (status !== "ALL") params.append("status", status)
    window.open(`${API_BASE}/fee-history/export-excel?${params.toString()}`)
  }

  const printInvoice = () => {
    if (!selected) return
    window.open(`${API_BASE}/fee-history/${selected.id}/invoice`, "_blank")
  }

  return (
    <div className="page-container rc-page">
      {/* ===== STATS STRIP ===== */}
      <div className="rc-stats-strip">
        {[
          { label: "Tất cả", value: stats.total, icon: <FaMoneyBill />, tone: "blue" },
          { label: "Đã nộp", value: stats.paid, icon: <FaCheckCircle />, tone: "green" },
          { label: "Chưa nộp", value: stats.pending, icon: <FaClock />, tone: "amber" },
          { label: "Nộp 1 phần", value: stats.partial, icon: <FaTimesCircle />, tone: "rose" }
        ].map(c => (
          <div key={c.label} className={`rc-mini-card tone-${c.tone}`}>
            <div className="rc-mini-ico">{c.icon}</div>
            <div className="rc-mini-meta">
              <div className="rc-mini-value">{c.value}</div>
              <div className="rc-mini-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== TABLE CARD ===== */}
      <div className="card rc-table-card">
        {/* Toolbar */}
        <div className="rc-table-toolbar">
          <div className="rc-toolbar-row">
            <div className="rc-toolbar-left">
              <select value={method} onChange={e => setMethod(e.target.value)}>
                <option value="ALL">Tất cả hình thức</option>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
              </select>

              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="ALL">Tất cả trạng thái</option>
                <option value="0">Chưa nộp</option>
                <option value="1">Nộp 1 phần</option>
                <option value="2">Đã nộp</option>
              </select>
            </div>

            <div className="rc-toolbar-right">
              <div className="rc-toolbar-search">
                <FaSearch />
                <input
                  placeholder="Tìm hộ / khoản thu / người thu"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <button className="rc-btn secondary" onClick={exportExcel}>
                <FaFileExcel /> Xuất Excel
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rc-table-wrapper">
          <table className="rc-table">
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
                  <td colSpan={7} className="rc-empty-row">
                    {loading ? "Đang tải..." : "Không có dữ liệu"}
                  </td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="rc-clickable" onClick={() => setSelected(r)}>
                    <td>{formatDateDMY(r.createdAt)}</td>
                    <td>
                      <b>{r.household?.householdCode}</b>
                      <div className="rc-sub-text">{r.household?.address}</div>
                    </td>
                    <td>{r.feeType?.name}</td>
                    <td>{money(r.amount)} đ</td>
                    <td>{r.method}</td>
                    <td>
                      <span className={`rc-badge ${r.status === 2 ? "as-approved" : r.status === 0 ? "as-pending" : "as-rejected"}`}>
                        {r.status === 2 ? "Đã nộp" : r.status === 1 ? "Nộp 1 phần" : "Chưa nộp"}
                      </span>
                    </td>
                    <td>{r.manager?.fullname || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="rc-table-footer">
          <div className="rc-footer-left">
            <span className="rc-muted">Số bản ghi</span>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>

          <div className="rc-footer-right">
            <span className="rc-muted">{rangeText}</span>
            <div className="rc-pager">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <FaChevronLeft />
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {selected && detail && (
        <div className="rc-modal-overlay" onClick={() => setSelected(null)}>
          <div className="rc-modal" onClick={e => e.stopPropagation()}>
            <div className="rc-modal-header">
              <h3>Chi tiết thu phí</h3>
              <button className="rc-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="rc-modal-body">
              <div className="rc-detail-grid">
                <div><b>Hộ:</b> {detail.household?.householdCode}</div>
                <div><b>Khoản thu:</b> {detail.feeType?.name}</div>
                <div><b>Số tiền:</b> {money(detail.amount)} đ</div>
                <div><b>Hình thức:</b> {detail.method}</div>
                <div><b>Trạng thái:</b> {detail.status === 2 ? "Đã nộp" : detail.status === 1 ? "Nộp 1 phần" : "Chưa nộp"}</div>
                <div><b>Người thu:</b> {detail.manager?.fullname}</div>
              </div>
            </div>

            <div className="rc-modal-footer">
              <button className="rc-btn secondary" onClick={() => setSelected(null)}>Đóng</button>
              <button className="rc-btn ok" onClick={printInvoice}>
                <FaPrint /> In hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
