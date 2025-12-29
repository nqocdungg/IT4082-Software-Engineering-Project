import React, { useState, useMemo, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  FaPlus,
  FaSearch,
  FaMoneyBillWave,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaEye
} from "react-icons/fa"

import "../../styles/staff/fees.css"
import "../../styles/staff/layout.css"
import { formatDateDMY } from "../../utils/date"

const API_BASE = "http://localhost:5000/api"

const emptyFeeForm = {
  name: "",
  shortDescription: "",
  longDescription: "",
  isMandatory: false,
  unitPrice: "",
  status: "1",
  fromDate: "",
  toDate: ""
}

function authHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function toStartOfDay(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  d.setHours(0, 0, 0, 0)
  return d
}

function toEndOfDay(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  d.setHours(23, 59, 59, 999)
  return d
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd
}

export default function RevenuesManagement() {
  const navigate = useNavigate()

  const [fees, setFees] = useState([])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [mandatoryFilter, setMandatoryFilter] = useState("ALL")

  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")

  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false)
  const [feeForm, setFeeForm] = useState(emptyFeeForm)

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  useEffect(() => {
    fetchFees()
  }, [])

  async function fetchFees() {
    try {
      const res = await axios.get(`${API_BASE}/fees/list`, {
        headers: authHeaders()
      })
      const list = Array.isArray(res.data) ? res.data : []
      setFees(list)
    } catch (err) {
      console.error("fetchFees error:", err)
      setFees([])
      alert("Không tải được danh sách khoản thu")
    }
  }

  const filteredFees = useMemo(() => {
    const list = Array.isArray(fees) ? fees : []

    const fFrom = toStartOfDay(dateFromFilter)
    const fTo = toEndOfDay(dateToFilter)

    const hasDateFilter = !!(fFrom || fTo)
    const filterStart = fFrom || new Date(-8640000000000000)
    const filterEnd = fTo || new Date(8640000000000000)

    return list.filter(f => {
      const matchSearch =
        !search.trim() || (f.name || "").toLowerCase().includes(search.toLowerCase())

      const matchStatus =
        statusFilter === "ALL" || String(f.status) === String(statusFilter)

      const matchMandatory =
        mandatoryFilter === "ALL" ||
        (mandatoryFilter === "MANDATORY" && !!f.isMandatory) ||
        (mandatoryFilter === "OPTIONAL" && !f.isMandatory)

      let matchDate = true
      if (hasDateFilter) {
        const feeHasFrom = !!f.fromDate
        const feeHasTo = !!f.toDate

        if (!feeHasFrom && !feeHasTo) {
          matchDate = true
        } else {
          const feeStart = feeHasFrom ? new Date(f.fromDate) : new Date(-8640000000000000)
          const feeEnd = feeHasTo ? new Date(f.toDate) : new Date(8640000000000000)
          matchDate = rangesOverlap(feeStart, feeEnd, filterStart, filterEnd)
        }
      }

      return matchSearch && matchStatus && matchMandatory && matchDate
    })
  }, [fees, search, statusFilter, mandatoryFilter, dateFromFilter, dateToFilter])

  const stats = useMemo(() => {
    const list = Array.isArray(fees) ? fees : []
    const total = list.length
    const mandatory = list.filter(f => !!f.isMandatory).length
    const optional = list.filter(f => !f.isMandatory).length
    const active = list.filter(f => f.status === 1).length
    const inactive = list.filter(f => f.status === 0).length
    return { total, mandatory, optional, active, inactive }
  }, [fees])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, mandatoryFilter, dateFromFilter, dateToFilter])

  const totalPages = Math.max(1, Math.ceil(filteredFees.length / rowsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1)
  }, [totalPages, currentPage])

  const pageFees = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredFees.slice(start, start + rowsPerPage)
  }, [filteredFees, currentPage, rowsPerPage])

  const rangeText = useMemo(() => {
    const total = filteredFees.length
    if (total === 0) return `0 - 0 trên tổng số 0 bản ghi`
    const start = (currentPage - 1) * rowsPerPage + 1
    const end = Math.min(currentPage * rowsPerPage, total)
    return `${start} - ${end} trên tổng số ${total} bản ghi`
  }, [filteredFees.length, currentPage, rowsPerPage])

  function getStatusLabel(status) {
    if (status === 1) return "Đang hoạt động"
    if (status === 0) return "Ngừng áp dụng"
    return "Khác"
  }

  function getDateRangeLabel(fee) {
    const hasFrom = !!fee.fromDate
    const hasTo = !!fee.toDate

    if (!hasFrom && !hasTo) return "Không thời hạn"

    const fromStr = hasFrom ? formatDateDMY(fee.fromDate) : ""
    const toStr = hasTo ? formatDateDMY(fee.toDate) : ""

    if (hasFrom && hasTo) return `${fromStr} – ${toStr}`
    if (hasFrom && !hasTo) return `Từ ${fromStr}`
    return `Đến ${toStr}`
  }

  function openAddFee() {
    setFeeForm({ ...emptyFeeForm, status: "1" })
    setIsAddFeeOpen(true)
  }

  function closeAddFee() {
    setIsAddFeeOpen(false)
  }

  function handleFeeFormChange(e) {
    const { name, value, type, checked } = e.target
    setFeeForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  async function handleAddFeeSubmit(e) {
    e.preventDefault()
    try {
      const payload = {
        name: feeForm.name.trim(),
        shortDescription: feeForm.shortDescription.trim(),
        longDescription: feeForm.longDescription.trim(),
        isMandatory: feeForm.isMandatory,
        unitPrice:
          feeForm.unitPrice === "" || feeForm.unitPrice == null
            ? null
            : parseFloat(feeForm.unitPrice),
        fromDate: feeForm.fromDate || null,
        toDate: feeForm.toDate || null
      }

      if (!payload.name) return alert("Tên khoản thu không được để trống")

      const res = await axios.post(`${API_BASE}/fees/create`, payload, {
        headers: authHeaders()
      })

      const created = res.data?.data
      if (created) setFees(prev => [created, ...(Array.isArray(prev) ? prev : [])])
      else await fetchFees()

      setIsAddFeeOpen(false)
      setFeeForm(emptyFeeForm)
    } catch (err) {
      console.error("handleAddFeeSubmit error:", err)
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Thêm khoản thu thất bại"
      )
    }
  }

  async function handleDeleteFee(id) {
    if (!window.confirm("Bạn có chắc muốn xóa khoản thu ID " + id + " ?")) return
    try {
      await axios.delete(`${API_BASE}/fees/delete/${id}`, {
        headers: authHeaders()
      })
      setFees(prev => (Array.isArray(prev) ? prev.filter(f => f.id !== id) : []))
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Xóa khoản thu thất bại"
      alert(message)
    }
  }

  const miniCards = [
    { label: "Tổng khoản thu", value: stats.total, icon: <FaMoneyBillWave />, tone: "blue" },
    { label: "Bắt buộc", value: stats.mandatory, icon: <FaPlus />, tone: "green" },
    { label: "Tự nguyện", value: stats.optional, icon: <FaPlus />, tone: "amber" },
    { label: "Đang áp dụng", value: stats.active, icon: <FaMoneyBillWave />, tone: "slate" },
    { label: "Ngừng áp dụng", value: stats.inactive, icon: <FaTrash />, tone: "rose" }
  ]

  return (
    <div className="page-container revenues-page">
      <div className="stats-strip">
        {miniCards.map(c => (
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
              <div className="toolbar-select">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="1">Đang hoạt động</option>
                  <option value="0">Ngừng áp dụng</option>
                </select>
              </div>

              <div className="toolbar-select">
                <select value={mandatoryFilter} onChange={e => setMandatoryFilter(e.target.value)}>
                  <option value="ALL">Tất cả loại khoản thu</option>
                  <option value="MANDATORY">Bắt buộc</option>
                  <option value="OPTIONAL">Tự nguyện</option>
                </select>
              </div>
            </div>

            <div className="toolbar-right">
              <div className="toolbar-search">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm theo tên khoản thu..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <button className="btn-primary compact" onClick={openAddFee}>
                <FaPlus /> Thêm khoản thu
              </button>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="resident-table revenues-table">
            <thead>
              <tr>
                <th>Tên khoản thu</th>
                <th>Loại</th>
                <th>Đơn giá</th>
                <th className="col-date">Thời gian áp dụng</th>
                <th>Trạng thái</th>
                <th style={{ width: 130 }}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {pageFees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-row">
                    Không có khoản thu phù hợp
                  </td>
                </tr>
              ) : (
                pageFees.map(f => (
                  <tr key={f.id} className="clickable-row">
                    <td className="col-name">
                      <div className="fee-name">{f.name}</div>
                        {f.shortDescription && (
                          <div className="fee-sub">{f.shortDescription}</div>
                        )}
                    </td>

                    <td>
                      <span className={f.isMandatory ? "fee-tag fee-tag-mandatory" : "fee-tag fee-tag-optional"}>
                        {f.isMandatory ? "Bắt buộc" : "Tự nguyện"}
                      </span>
                    </td>

                    <td className="money-cell">
                      {f.unitPrice != null
                        ? `${new Intl.NumberFormat("vi-VN").format(f.unitPrice)} đ`
                        : <span className="fee-muted">Tự nguyện</span>}
                    </td>


                    <td className="col-date">
                      <span className={f.fromDate || f.toDate ? "fee-date-range" : "fee-date-range fee-date-none"}>
                        {getDateRangeLabel(f)}
                      </span>
                    </td>

                    <td>
                      <span className={f.status === 1 ? "fee-status-badge fee-status-active" : "fee-status-badge fee-status-inactive"}>
                        {getStatusLabel(f.status)}
                      </span>
                    </td>

                    <td>
                      <div className="row-actions">
                        <button type="button" title="Xem chi tiết" onClick={() => navigate(`/revenues/${f.id}`)}>
                          <FaEye />
                        </button>

                        <button type="button" title="Xóa" className="danger" onClick={() => handleDeleteFee(f.id)}>
                          <FaTrash />
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
                setCurrentPage(1)
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
              <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <FaChevronLeft />
              </button>
              <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isAddFeeOpen && (
        <div className="fee-modal-overlay" onClick={closeAddFee}>
          <div className="fee-modal" onClick={e => e.stopPropagation()}>
            <div className="fee-modal-header">
              <div>
                <h3 className="fee-modal-title">Thêm khoản thu mới</h3>
                <p className="fee-modal-sub">Tạo mới khoản thu</p>
              </div>

              <button className="fee-modal-close-btn" type="button" onClick={closeAddFee}>
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleAddFeeSubmit} className="fee-modal-body">
              <div className="detail-grid">
                <div className="detail-item detail-wide">
                  <div className="detail-label">Tên khoản thu</div>
                  <div className="detail-value">
                    <input name="name" value={feeForm.name} onChange={handleFeeFormChange} required />
                  </div>
                </div>

                <div className="detail-row3">
                  <div className="detail-item">
                    <div className="detail-label">Đơn giá</div>
                    <div className="detail-value">
                      <input
                        name="unitPrice"
                        type="number"
                        min="0"
                        value={feeForm.unitPrice}
                        onChange={handleFeeFormChange}
                        placeholder="Để trống nếu không có"
                      />
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Loại khoản thu</div>
                    <div className="detail-value">
                      <select
                        name="isMandatory"
                        value={feeForm.isMandatory ? "1" : "0"}
                        onChange={e =>
                          setFeeForm(prev => ({
                            ...prev,
                            isMandatory: e.target.value === "1"
                          }))
                        }
                      >
                        <option value="1">Bắt buộc</option>
                        <option value="0">Tự nguyện</option>
                      </select>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Trạng thái</div>
                    <div className="detail-value">
                      <input value="Đang hoạt động" disabled />
                    </div>
                  </div>
                </div>

                <div className="detail-row2">
                  <div className="detail-item">
                    <div className="detail-label">Ngày bắt đầu</div>
                    <div className="detail-value">
                      <input type="date" name="fromDate" value={feeForm.fromDate} onChange={handleFeeFormChange} />
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Ngày kết thúc</div>
                    <div className="detail-value">
                      <input type="date" name="toDate" value={feeForm.toDate} onChange={handleFeeFormChange} />
                    </div>
                  </div>
                </div>

                <div className="detail-item detail-wide">
                  <div className="detail-label">Mô tả ngắn</div>
                  <textarea
                    className="fee-description"
                    name="shortDescription"
                    value={feeForm.shortDescription}
                    onChange={handleFeeFormChange}
                    placeholder="Hiển thị ngắn gọn trong danh sách khoản thu"
                  />
                </div>

                <div className="detail-item detail-wide">
                  <div className="detail-label">Mô tả chi tiết</div>
                  <textarea
                    className="fee-description"
                    name="longDescription"
                    value={feeForm.longDescription}
                    onChange={handleFeeFormChange}
                    placeholder="Nội dung chi tiết, mục đích, ý nghĩa khoản thu"
                    rows={6}
                  />
                </div>

              </div>

              <div className="fee-modal-footer">
                <button className="btn-secondary" type="button" onClick={closeAddFee}>
                  Hủy
                </button>
                <button className="btn-primary" type="submit">
                  Thêm khoản thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
