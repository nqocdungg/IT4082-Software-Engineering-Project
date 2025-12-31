import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaFileExcel
} from "react-icons/fa"
 
import "../../styles/staff/layout.css"
import "../../styles/staff/residentchangehistory.css"
import { formatDateDMY } from "../../utils/date"
 
const API_BASE = "http://localhost:5000/api"
 
function authHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}
 
function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
 
const CHANGE_TYPES = {
  0: { label: "Khai sinh" },
  1: { label: "Tạm trú" },
  2: { label: "Tạm vắng" },
  3: { label: "Nhập hộ / Chuyển đến" },
  4: { label: "Chuyển đi" },
  5: { label: "Tách hộ" },
  6: { label: "Đổi chủ hộ" },
  7: { label: "Khai tử" }
}
 
const APPROVAL = {
  0: { label: "Chờ duyệt", className: "rch-approval-pending" },
  1: { label: "Đã duyệt", className: "rch-approval-approved" },
  2: { label: "Từ chối", className: "rch-approval-rejected" }
}
 
function getChangeTypeInfo(code) {
  return CHANGE_TYPES[Number(code)] || { label: "Không rõ" }
}
 
function getApprovalInfo(code) {
  return APPROVAL[Number(code)] || { label: "Không rõ", className: "" }
}
 
function money(v) {
  return new Intl.NumberFormat("vi-VN").format(Number(v || 0))
}
 
function isSameMonth(dateValue, ym) {
  if (!ym) return true
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return false
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}` === ym
}
 
function computeStats(list, monthFilter) {
  const s = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inMonth: 0
  }
  s.total = list.length
  for (const it of list) {
    if (it.approvalStatus === 0) s.pending++
    else if (it.approvalStatus === 1) s.approved++
    else if (it.approvalStatus === 2) s.rejected++
 
    const refDate = it.createdAt || it.fromDate
    if (monthFilter && refDate && isSameMonth(refDate, monthFilter)) s.inMonth++
  }
  return s
}
 
function safeJson(obj) {
  if (!obj) return "—"
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return "—"
  }
}
 
export default function ResidentChangeHistory() {
  const [items, setItems] = useState([])
 
  const [search, setSearch] = useState("")
  const [changeTypeFilter, setChangeTypeFilter] = useState("ALL")
  const [approvalFilter, setApprovalFilter] = useState("ALL")
  const [monthFilter, setMonthFilter] = useState("")
  const [sort, setSort] = useState("NEWEST")
 
  const debouncedSearch = useDebouncedValue(search, 350)
 
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)
 
  const [selected, setSelected] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
 
  const [exporting, setExporting] = useState(false)
 
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inMonth: 0
  })
 
  useEffect(() => {
    fetchHistory()
    setCurrentPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, changeTypeFilter, approvalFilter, monthFilter, sort])
 
  async function fetchHistory() {
    try {
      const params = {}
 
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
      if (changeTypeFilter !== "ALL") params.changeType = changeTypeFilter
      if (approvalFilter !== "ALL") params.approvalStatus = approvalFilter
      if (monthFilter) params.month = monthFilter
      if (sort) params.sort = sort
 
      // NOTE:
      // - Nếu BE của m đang mount route khác (vd: /resident-change-history), đổi chỗ này cho đúng.
      // - Mình giữ kiểu query params để khớp layout filter/search như m hay làm.
      const res = await axios.get(`${API_BASE}/resident-changes/history`, {
        headers: authHeaders(),
        params
      })
 
      const list = res.data?.data || []
      setItems(list)
      setStats(computeStats(list, monthFilter))
    } catch (err) {
      console.error(err)
      alert("Không tải được lịch sử biến động")
      setItems([])
      setStats(computeStats([], monthFilter))
    }
  }
 
  const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage))
 
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1)
  }, [totalPages, currentPage])
 
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return items.slice(start, start + rowsPerPage)
  }, [items, currentPage, rowsPerPage])
 
  const rangeText = useMemo(() => {
    const total = items.length
    if (total === 0) return `0 - 0 trên tổng số 0 bản ghi`
    const start = (currentPage - 1) * rowsPerPage + 1
    const end = Math.min(currentPage * rowsPerPage, total)
    return `${start} - ${end} trên tổng số ${total} bản ghi`
  }, [items.length, currentPage, rowsPerPage])
 
  const miniCards = useMemo(
    () => [
      { label: "Tổng bản ghi", value: stats.total, icon: <FaUsers />, tone: "blue" },
      { label: "Chờ duyệt", value: stats.pending, icon: <FaClock />, tone: "amber" },
      { label: "Đã duyệt", value: stats.approved, icon: <FaCheckCircle />, tone: "green" },
      { label: "Từ chối", value: stats.rejected, icon: <FaTimesCircle />, tone: "rose" },
      { label: monthFilter ? `Trong tháng ${monthFilter}` : "Trong tháng", value: stats.inMonth, icon: <FaUsers />, tone: "slate" }
    ],
    [stats, monthFilter]
  )
 
  const closeDetail = () => setSelected(null)
 
  const openDetail = async row => {
    setSelected(row)
    setLoadingDetail(true)
    try {
      const res = await axios.get(`${API_BASE}/resident-changes/history/${row.id}`, {
        headers: authHeaders()
      })
      setSelected(res.data?.data || row)
    } catch (e) {
      console.error(e)
      // fallback giữ row list
    } finally {
      setLoadingDetail(false)
    }
  }
 
  async function handleExportExcel() {
    if (exporting) return
    setExporting(true)
    try {
      const params = {
        search: debouncedSearch.trim() || undefined,
        changeType: changeTypeFilter !== "ALL" ? changeTypeFilter : undefined,
        approvalStatus: approvalFilter !== "ALL" ? approvalFilter : undefined,
        month: monthFilter || undefined,
        sort: sort || undefined
      }
 
      const res = await axios.get(`${API_BASE}/resident-changes/history/export-excel`, {
        headers: authHeaders(),
        responseType: "blob",
        params
      })
 
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      })
 
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `resident_change_history_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("Xuất Excel thất bại")
    } finally {
      setExporting(false)
    }
  }
 
  return (
    <div className="page-container residents-page rch-page">
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
            <div className="toolbar-left rch-toolbar-left">
              <div className="toolbar-select">
                <select
                  value={changeTypeFilter}
                  onChange={e => {
                    setCurrentPage(1)
                    setChangeTypeFilter(e.target.value)
                  }}
                >
                  <option value="ALL">Tất cả biến động</option>
                  {Object.keys(CHANGE_TYPES).map(k => (
                    <option key={k} value={k}>
                      {CHANGE_TYPES[k].label}
                    </option>
                  ))}
                </select>
              </div>
 
              <div className="toolbar-select">
                <select
                  value={approvalFilter}
                  onChange={e => {
                    setCurrentPage(1)
                    setApprovalFilter(e.target.value)
                  }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="0">Chờ duyệt</option>
                  <option value="1">Đã duyệt</option>
                  <option value="2">Từ chối</option>
                </select>
              </div>
 
             
 
              <div className="toolbar-select">
                <select
                  value={sort}
                  onChange={e => {
                    setCurrentPage(1)
                    setSort(e.target.value)
                  }}
                >
                  <option value="NEWEST">Mới nhất</option>
                  <option value="OLDEST">Cũ nhất</option>
                </select>
              </div>
            </div>
 
            <div className="toolbar-right">
              <button
                type="button"
                className="btn-primary-excel"
                onClick={handleExportExcel}
                disabled={exporting}
                style={{ marginRight: 10 }}
              >
                <FaFileExcel />
                {exporting ? "Đang xuất..." : "Xuất Excel"}
              </button>
 
              <div className="toolbar-search">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm theo tên/CCCD/mã hộ/địa chỉ..."
                  value={search}
                  onChange={e => {
                    setCurrentPage(1)
                    setSearch(e.target.value)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
 
        <div className="table-wrapper">
          <table className="resident-table rch-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Mã BD</th>
                <th>Loại biến động</th>
                <th>Nhân khẩu</th>
                <th>Hộ khẩu</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Người xử lý</th>
                <th>Ngày tạo</th>
                <th style={{ width: 90 }}>Thao tác</th>
              </tr>
            </thead>
 
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-row">
                    Không có dữ liệu nào để hiển thị
                  </td>
                </tr>
              ) : (
                pageItems.map(row => {
                  const typeInfo = getChangeTypeInfo(row.changeType)
                  const appr = getApprovalInfo(row.approvalStatus)
 
                  const residentName =
                    row?.resident?.fullname ||
                    row?.residentFullname ||
                    (row.residentId ? `NK #${row.residentId}` : "—")
 
                  const householdCode =
                    row?.resident?.household?.householdCode ||
                    row?.householdCode ||
                    (row?.resident?.householdId != null ? `HK #${row.resident.householdId}` : "—")
 
                  const managerName = row?.manager?.fullname || row?.managerName || (row.managerId ? `CB #${row.managerId}` : "—")
 
                  return (
                    <tr key={row.id} className="clickable-row" onClick={() => openDetail(row)}>
                      <td>#{row.id}</td>
                      <td>{typeInfo.label}</td>
                      <td>
                        {residentName}
                        {!!row?.resident?.residentCCCD && <div className="sub-text">CCCD: {row.resident.residentCCCD}</div>}
                      </td>
                      <td>
                        {householdCode}
                        {!!row?.resident?.household?.address && <div className="sub-text">{row.resident.household.address}</div>}
                      </td>
                      <td>
                        <div>{formatDateDMY(row.fromDate)}</div>
                        <div className="sub-text">{row.toDate ? `→ ${formatDateDMY(row.toDate)}` : "→ —"}</div>
                      </td>
                      <td>
                        <span className={`status-badge ${appr.className}`}>{appr.label}</span>
                      </td>
                      <td>{managerName}</td>
                      <td>{formatDateDMY(row.createdAt)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="row-actions">
                          <button type="button" title="Xem" onClick={() => openDetail(row)}>
                            <FaEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
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
              <option value={20}>20</option>
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
 
      {selected && (
        <div className="resident-modal-overlay" onClick={closeDetail}>
          <div className="resident-modal rch-modal" onClick={e => e.stopPropagation()}>
            <div className="resident-modal-header">
              <div>
                <h3 className="resident-modal-title">Chi tiết biến động</h3>
                <p className="resident-modal-sub">ID: #{selected.id}</p>
              </div>
 
              <button className="modal-close-btn" type="button" onClick={closeDetail}>
                ✕
              </button>
            </div>
 
            <div className="resident-modal-body">
              {loadingDetail ? (
                <div className="empty-row">Đang tải chi tiết...</div>
              ) : (
                <div className="detail-grid rch-detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Loại biến động</div>
                    <div className="detail-value">{getChangeTypeInfo(selected.changeType).label}</div>
                  </div>
 
                  <div className="detail-item">
                    <div className="detail-label">Trạng thái duyệt</div>
                    <div className="detail-value">
                      <span className={`status-badge ${getApprovalInfo(selected.approvalStatus).className}`}>
                        {getApprovalInfo(selected.approvalStatus).label}
                      </span>
                    </div>
                  </div>
 
                  <div className="detail-item">
                    <div className="detail-label">Nhân khẩu</div>
                    <div className="detail-value">
                      {selected?.resident?.fullname || selected?.residentFullname || (selected.residentId ? `NK #${selected.residentId}` : "—")}
                      {!!selected?.resident?.residentCCCD && <div className="sub-text">CCCD: {selected.resident.residentCCCD}</div>}
                    </div>
                  </div>
 
                  <div className="detail-item">
                    <div className="detail-label">Hộ khẩu</div>
                    <div className="detail-value">
                      {selected?.resident?.household?.householdCode ||
                        selected?.householdCode ||
                        (selected?.resident?.householdId != null ? `HK #${selected.resident.householdId}` : "—")}
                      {!!selected?.resident?.household?.address && <div className="sub-text">{selected.resident.household.address}</div>}
                    </div>
                  </div>
 
                  <div className="detail-item">
                    <div className="detail-label">Từ ngày</div>
                    <div className="detail-value">{formatDateDMY(selected.fromDate)}</div>
                  </div>
 
                  <div className="detail-item">
                    <div className="detail-label">Đến ngày</div>
                    <div className="detail-value">{selected.toDate ? formatDateDMY(selected.toDate) : "—"}</div>
                  </div>
 
                  <div className="detail-item detail-wide">
                    <div className="detail-label">Địa chỉ đi</div>
                    <div className="detail-value">{selected.fromAddress || "—"}</div>
                  </div>
 
                  <div className="detail-item detail-wide">
                    <div className="detail-label">Địa chỉ đến</div>
                    <div className="detail-value">{selected.toAddress || "—"}</div>
                  </div>
 
                  <div className="detail-item detail-wide">
                    <div className="detail-label">Lý do</div>
                    <div className="detail-value">{selected.reason || "—"}</div>
                  </div>
 
                  <div className="detail-item detail-wide">
                    <div className="detail-label">Người xử lý</div>
                    <div className="detail-value">
                      {selected?.manager?.fullname ||
                        selected?.managerName ||
                        (selected.managerId ? `CB #${selected.managerId}` : "—")}
                    </div>
                  </div>
 
 
                  <div className="detail-item">
                    <div className="detail-label">Ngày tạo</div>
                    <div className="detail-value">{formatDateDMY(selected.createdAt)}</div>
                  </div>
                </div>
              )}
            </div>
 
            <div className="resident-modal-footer">
              <button className="btn-secondary" type="button" onClick={closeDetail}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}