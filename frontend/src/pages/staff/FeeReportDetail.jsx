import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useNavigate, useParams } from "react-router-dom"
import { FaArrowLeft, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa"

import "../../styles/staff/layout.css"
import "../../styles/staff/fees-report.css"

const API_BASE = "http://localhost:5000/api"
const API_PATHS = {
  outstanding: `${API_BASE}/fees/report/outstanding`
}

function authHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function money(v) {
  return new Intl.NumberFormat("vi-VN").format(Number(v || 0))
}

export default function FeeReportDetail() {
  const navigate = useNavigate()
  const { feeTypeId } = useParams()

  const [loading, setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState("")
  const [data, setData] = useState(null)

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  useEffect(() => {
    async function run() {
      setLoading(true)
      setErrMsg("")
      setData(null)
      try {
        const res = await axios.get(API_PATHS.outstanding, {
          params: { feeTypeId: Number(feeTypeId) },
          headers: authHeaders()
        })
        setData(res.data?.data || null)
        setPage(1)
      } catch (e) {
        console.error("FeeReportDetail error:", e)
        setErrMsg(e?.response?.data?.message || "Không tải được danh sách còn thiếu")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [feeTypeId])

  const head = data?.feeType

  const filteredRows = useMemo(() => {
    const list = Array.isArray(data?.households) ? data.households : []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(h => {
      const a = (h.address || "").toLowerCase()
      const c = String(h.householdCode || "").toLowerCase()
      return a.includes(q) || c.includes(q)
    })
  }, [data, search])

  useEffect(() => {
    setPage(1)
  }, [search, rowsPerPage])

  const totalPages = useMemo(() => Math.max(1, Math.ceil((filteredRows.length || 0) / rowsPerPage)), [filteredRows, rowsPerPage])

  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [page, totalPages])

  const pageRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, page, rowsPerPage])

  const rangeText = useMemo(() => {
    const total = filteredRows.length || 0
    if (!total) return `0 - 0 trên tổng số 0 bản ghi`
    const start = (page - 1) * rowsPerPage + 1
    const end = Math.min(page * rowsPerPage, total)
    return `${start} - ${end} trên tổng số ${total} bản ghi`
  }, [filteredRows, page, rowsPerPage])

  return (
    <div className="page-container revenues-page fee-report-page">
      <div className="card table-card">
        <div className="table-toolbar">
          <div className="toolbar-row">
            <div className="toolbar-left">
              <button className="btn-secondary" onClick={() => navigate(-1)} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <FaArrowLeft /> Quay lại
              </button>
            </div>

            <div className="toolbar-right">
              <div className="toolbar-search">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm theo mã hộ / địa chỉ..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 16px", borderBottom: "1px solid #eef0f6" }}>
          <div className="fee-name" style={{ fontSize: 16 }}>
            {head?.name || "Truy soát hộ còn thiếu"}
          </div>
          <div className="sub-text" style={{ marginTop: 6 }}>
            FeeTypeId: {feeTypeId} • Đơn giá: {head?.unitPrice == null ? "—" : `${money(head.unitPrice)} đ / nhân khẩu`} • Tổng hộ còn thiếu: {filteredRows.length}
          </div>

          {errMsg ? (
            <div className="fee-records-empty" style={{ borderStyle: "solid", color: "#b91c1c", marginTop: 10 }}>
              {errMsg}
            </div>
          ) : null}
        </div>

        <div className="table-wrapper">
          <table className="resident-table revenues-table">
            <thead>
              <tr>
                <th>Mã hộ</th>
                <th>Địa chỉ</th>
                <th>Nhân khẩu</th>
                <th>Cần đóng</th>
                <th>Đã đóng</th>
                <th>Còn thiếu</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="empty-row">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-row">
                    Không còn hộ nào thiếu khoản này
                  </td>
                </tr>
              ) : (
                pageRows.map(h => (
                  <tr key={h.householdId}>
                    <td className="fr-owner">{h.householdCode}</td>
                    <td>
                      <div className="fr-note">{h.address}</div>
                    </td>
                    <td>{h.persons}</td>
                    <td className="money-cell">{money(h.expected)} đ</td>
                    <td className="money-cell">{money(h.paid)} đ</td>
                    <td className="money-cell" style={{ fontWeight: 900 }}>
                      {money(h.remaining)} đ
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
