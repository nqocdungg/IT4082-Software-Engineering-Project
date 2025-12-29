import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaCheck,
  FaTimes,
  FaFolderOpen,
  FaClock,
  FaPlus
} from "react-icons/fa"

import "../../styles/staff/layout.css"
import "../../styles/staff/residentchange.css"
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

const APPROVAL_STATUS = {
  0: { label: "Chờ duyệt", className: "as-pending" },
  1: { label: "Đã duyệt", className: "as-approved" },
  2: { label: "Từ chối", className: "as-rejected" }
}

function getTypeLabel(code) {
  return CHANGE_TYPES[Number(code)]?.label || "Không rõ"
}

function getApprovalInfo(code) {
  return APPROVAL_STATUS[Number(code)] || { label: "Không rõ", className: "" }
}

function computeStats(list) {
  const s = { total: 0, pending: 0, approved: 0, rejected: 0 }
  const arr = Array.isArray(list) ? list : []
  s.total = arr.length
  for (const c of arr) {
    const st = Number(c.approvalStatus)
    if (st === 0) s.pending++
    else if (st === 1) s.approved++
    else if (st === 2) s.rejected++
  }
  return s
}

/* ✅ CHỈ SỬA HÀM NÀY: ưu tiên detailMembers -> fallback sang changes(resident) -> cuối cùng mới #id */
function findMemberName(list, id, allChanges) {
  const x = (list || []).find(m => Number(m.id) === Number(id))
  if (x) {
    const cccd = x.residentCCCD ? ` • ${x.residentCCCD}` : ""
    return `${x.fullname || "—"}${cccd}`
  }

  for (const c of allChanges || []) {
    if (c?.resident && Number(c.resident.id) === Number(id)) {
      const cccd = c.resident.residentCCCD ? ` • ${c.resident.residentCCCD}` : ""
      return `${c.resident.fullname || "—"}${cccd}`
    }
  }

  return `#${id}`
}

function getJwtPayload() {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  if (!token) return null
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export default function ResidentChange() {
  const navigate = useNavigate()

  const jwtPayload = getJwtPayload()
  const role = jwtPayload?.role || null
  const canApprove = role === "HEAD" || role === "DEPUTY"

  const [changes, setChanges] = useState([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const [selectedChange, setSelectedChange] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })

  const [detailMembers, setDetailMembers] = useState([])
  const [detailHouseholdCode, setDetailHouseholdCode] = useState(null)

  const debouncedSearch = useDebouncedValue(search, 350)

  const residentDisplay = c => {
    const r = c?.resident
    if (r) {
      const cccd = r.residentCCCD ? ` • ${r.residentCCCD}` : ""
      return `${r.fullname || "—"}${cccd}`
    }
    const ex = c?.extraData
    if (ex?.fullname) {
      const cccd = ex.residentCCCD ? ` • ${ex.residentCCCD}` : ""
      return `${ex.fullname}${cccd}`
    }
    return "—"
  }

  const residentSubInfo = c => {
    const g = c?.resident?.gender ?? c?.extraData?.gender
    const dob = c?.resident?.dob ?? c?.extraData?.dob
    const genderLabel = g === "M" ? "Nam" : g === "F" ? "Nữ" : "—"
    const dobText = dob ? formatDateDMY(dob) : "—"
    return `${genderLabel} • ${dobText}`
  }

  const managerDisplay = c => {
    const m = c?.manager
    if (!m) return "—"
    return m.fullname || m.username || `#${m.id}`
  }

  useEffect(() => {
    fetchChanges()
    setCurrentPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, typeFilter, statusFilter])

  async function fetchChanges() {
    try {
      const params = {}
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
      if (typeFilter !== "ALL") params.changeType = String(typeFilter)
      if (statusFilter !== "ALL") params.approvalStatus = String(statusFilter)

      const res = await axios.get(`${API_BASE}/resident-changes`, {
        headers: authHeaders(),
        params
      })

      const list = res.data?.data || []
      setChanges(list)
      setStats(computeStats(list))
    } catch {
      setChanges([])
      setStats(computeStats([]))
    }
  }

  const filteredChanges = useMemo(() => {
    return changes.filter(c => {
      const matchType = typeFilter === "ALL" || String(c.changeType) === String(typeFilter)
      const matchStatus = statusFilter === "ALL" || String(c.approvalStatus) === String(statusFilter)
      return matchType && matchStatus
    })
  }, [changes, typeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredChanges.length / rowsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1)
  }, [totalPages, currentPage])

  const pageChanges = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredChanges.slice(start, start + rowsPerPage)
  }, [filteredChanges, currentPage, rowsPerPage])

  const rangeText = useMemo(() => {
    const total = filteredChanges.length
    if (total === 0) return `0 - 0 trên tổng số 0 bản ghi`
    const start = (currentPage - 1) * rowsPerPage + 1
    const end = Math.min(currentPage * rowsPerPage, total)
    return `${start} - ${end} trên tổng số ${total} bản ghi`
  }, [filteredChanges.length, currentPage, rowsPerPage])

  const householdDisplay = c => {
    const ex = c?.extraData || {}

    if (ex.newHouseholdCode) return ex.newHouseholdCode
    if (ex.oldHouseholdCode) return ex.oldHouseholdCode
    if (ex.householdCode) return ex.householdCode

    const hh = c?.resident?.household
    if (hh?.householdCode) return hh.householdCode

    return "—"
  }

  const miniCards = [
    {
      label: "Tạo biến động",
      value: "＋",
      icon: <FaPlus />,
      tone: "violet",
      onClick: () => navigate("/staff/resident-changes/create")
    },
    { label: "Tất cả", value: stats.total, icon: <FaFolderOpen />, tone: "blue" },
    { label: "Chờ duyệt", value: stats.pending, icon: <FaClock />, tone: "amber" },
    { label: "Đã duyệt", value: stats.approved, icon: <FaCheck />, tone: "green" },
    { label: "Từ chối", value: stats.rejected, icon: <FaTimes />, tone: "rose" }
  ]

  const closeDetail = () => {
    setSelectedChange(null)
    setLoadingDetail(false)
    setDetailMembers([])
    setDetailHouseholdCode(null)
  }

  const handleOpenDetail = async row => {
    setSelectedChange(row)
    setLoadingDetail(true)
    setDetailMembers([])
    setDetailHouseholdCode(null)

    try {
      const res = await axios.get(`${API_BASE}/resident-changes/${row.id}`, {
        headers: authHeaders()
      })
      const detail = res.data?.data || row
      setSelectedChange(detail)

      const ex = detail?.extraData || {}
      const code =
        ex.newHouseholdCode || ex.oldHouseholdCode || ex.householdCode || detail?.resident?.household?.householdCode || null
      setDetailHouseholdCode(code)

      if (detail?.changeType === 5 || detail?.changeType === 6) {
        const hhIdForMembers =
          detail?.changeType === 5 ? detail?.extraData?.oldHouseholdId : detail?.extraData?.householdId

        if (hhIdForMembers) {
          try {
            const memRes = await axios.get(`${API_BASE}/households/${hhIdForMembers}/members`, {
              headers: authHeaders()
            })
            setDetailMembers(memRes.data?.data || [])
          } catch (e2) {
            console.error("load detail members failed:", e2)
            setDetailMembers([])
          }
        }
      }
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || "Không tải được chi tiết biến động")
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleApprove(id) {
    if (!window.confirm(`Duyệt thủ tục #${id}?`)) return
    try {
      await axios.post(`${API_BASE}/resident-changes/${id}/approve`, {}, { headers: authHeaders() })
      await fetchChanges()
      if (selectedChange?.id === id) {
        const res = await axios.get(`${API_BASE}/resident-changes/${id}`, { headers: authHeaders() })
        setSelectedChange(res.data?.data || null)
      }
      alert("Duyệt thành công!")
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || "Duyệt thất bại")
    }
  }

  async function handleReject(id) {
    if (!window.confirm(`Từ chối thủ tục #${id}?`)) return
    try {
      await axios.post(`${API_BASE}/resident-changes/${id}/reject`, {}, { headers: authHeaders() })
      await fetchChanges()
      if (selectedChange?.id === id) {
        const res = await axios.get(`${API_BASE}/resident-changes/${id}`, { headers: authHeaders() })
        setSelectedChange(res.data?.data || null)
      }
      alert("Từ chối thành công!")
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || "Từ chối thất bại")
    }
  }

  return (
    <div className="page-container rc-page">
      <div className="rc-stats-strip">
        {miniCards.map(c => (
          <button
            key={c.label}
            type="button"
            className={`rc-mini-card tone-${c.tone} ${c.onClick ? "rc-mini-card-click" : ""}`}
            onClick={c.onClick}
            disabled={!c.onClick}
          >
            <div className="rc-mini-ico">{c.icon}</div>
            <div className="rc-mini-meta">
              <div className="rc-mini-value">{c.value ?? 0}</div>
              <div className="rc-mini-label">{c.label}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="card rc-table-card">
        <div className="rc-table-toolbar">
          <div className="rc-toolbar-row">
            <div className="rc-toolbar-left">
              <div className="rc-toolbar-select">
                <select
                  value={typeFilter}
                  onChange={e => {
                    setCurrentPage(1)
                    setTypeFilter(e.target.value)
                  }}
                >
                  <option value="ALL">Tất cả loại biến động</option>
                  {Object.entries(CHANGE_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {k} — {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rc-toolbar-select">
                <select
                  value={statusFilter}
                  onChange={e => {
                    setCurrentPage(1)
                    setStatusFilter(e.target.value)
                  }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="0">Chờ duyệt</option>
                  <option value="1">Đã duyệt</option>
                  <option value="2">Từ chối</option>
                </select>
              </div>
            </div>

            <div className="rc-toolbar-right">
              <div className="rc-toolbar-search">
                <FaSearch className="rc-search-icon" />
                <input
                  type="text"
                  placeholder="Tìm theo tên / CCCD / mã hộ khẩu."
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

        <div className="rc-table-wrapper">
          <table className="rc-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Loại biến động</th>
                <th>Nhân khẩu</th>
                <th>Hộ khẩu</th>
                <th>Trạng thái</th>
                <th>Người duyệt</th>
                <th>Ngày tạo</th>
                <th style={{ width: 150 }}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {pageChanges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="rc-empty-row">
                    Không có dữ liệu nào để hiển thị
                  </td>
                </tr>
              ) : (
                pageChanges.map(c => {
                  const aInfo = getApprovalInfo(c.approvalStatus)
                  const isPending = Number(c.approvalStatus) === 0

                  return (
                    <tr key={c.id} className="rc-clickable" onClick={() => handleOpenDetail(c)}>
                      <td>#{c.id}</td>

                      <td>
                        <div className="rc-strong">{getTypeLabel(c.changeType)}</div>
                        <div className="rc-sub-text">
                          {c.fromAddress || c.toAddress ? `${c.fromAddress || "—"} → ${c.toAddress || "—"}` : "—"}
                        </div>
                      </td>

                      <td>
                        {residentDisplay(c)}
                        <div className="rc-sub-text">{residentSubInfo(c)}</div>
                      </td>

                      <td>
                        {householdDisplay(c)}
                        {!!c?.resident?.household?.address && (
                          <div className="rc-sub-text">{c.resident.household.address}</div>
                        )}
                      </td>

                      <td>
                        <span className={`rc-badge ${aInfo.className}`}>{aInfo.label}</span>
                      </td>

                      <td>{managerDisplay(c)}</td>

                      <td>{formatDateDMY(c.createdAt)}</td>

                      <td onClick={e => e.stopPropagation()}>
                        <div className="rc-row-actions">
                          <button type="button" title="Xem" onClick={() => handleOpenDetail(c)}>
                            <FaEye />
                          </button>

                          <button
                            type="button"
                            title={
                              !canApprove ? "Bạn không có quyền duyệt" : isPending ? "Duyệt" : "Chỉ duyệt khi chờ duyệt"
                            }
                            className="ok"
                            disabled={!canApprove || !isPending}
                            onClick={() => handleApprove(c.id)}
                          >
                            <FaCheck />
                          </button>

                          <button
                            type="button"
                            title={
                              !canApprove
                                ? "Bạn không có quyền từ chối"
                                : isPending
                                  ? "Từ chối"
                                  : "Chỉ từ chối khi chờ duyệt"
                            }
                            className="danger"
                            disabled={!canApprove || !isPending}
                            onClick={() => handleReject(c.id)}
                          >
                            <FaTimes />
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

        <div className="rc-table-footer">
          <div className="rc-footer-left">
            <span className="rc-muted">Số bản ghi</span>
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

          <div className="rc-footer-right">
            <span className="rc-muted">{rangeText}</span>

            <div className="rc-pager">
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

      {selectedChange && (
        <div className="rc-modal-overlay" onClick={closeDetail}>
          <div className="rc-modal" onClick={e => e.stopPropagation()}>
            <div className="rc-modal-header">
              <div>
                <h3 className="rc-modal-title">Chi tiết biến động</h3>
                <p className="rc-modal-sub">ID: #{selectedChange.id}</p>
              </div>

              <button className="rc-modal-close" type="button" onClick={closeDetail}>
                ✕
              </button>
            </div>

            <div className="rc-modal-body">
              {loadingDetail ? (
                <div className="rc-empty-row">Đang tải chi tiết.</div>
              ) : (
                <div className="rc-detail-grid">
                  <div className="rc-detail-item">
                    <div className="rc-detail-label rc-wide">Loại biến động</div>
                    <div className="rc-detail-value">{getTypeLabel(selectedChange.changeType)}</div>
                  </div>

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Trạng thái</div>
                    <div className="rc-detail-value">
                      <span className={`rc-badge ${getApprovalInfo(selectedChange.approvalStatus).className}`}>
                        {getApprovalInfo(selectedChange.approvalStatus).label}
                      </span>
                    </div>
                  </div>

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Nhân khẩu</div>
                    <div className="rc-detail-value">
                      {residentDisplay(selectedChange)}
                      <div className="rc-sub-text" style={{ marginTop: 4 }}>
                        {residentSubInfo(selectedChange)}
                      </div>
                    </div>
                  </div>

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Hộ khẩu</div>
                    <div className="rc-detail-value">
                      {selectedChange?.resident?.household?.householdCode ||
                        detailHouseholdCode ||
                        householdDisplay(selectedChange)}
                    </div>
                  </div>

                  <div className="rc-detail-item rc-wide">
                    <div className="rc-detail-label">Địa chỉ</div>
                    <div className="rc-detail-value">
                      <div className="rc-sub-text">
                        <b>Từ:</b> {selectedChange.fromAddress || "—"} &nbsp;&nbsp; <b>Đến:</b>{" "}
                        {selectedChange.toAddress || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Từ ngày</div>
                    <div className="rc-detail-value">{formatDateDMY(selectedChange.fromDate)}</div>
                  </div>

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Đến ngày</div>
                    <div className="rc-detail-value">{selectedChange.toDate ? formatDateDMY(selectedChange.toDate) : "—"}</div>
                  </div>

                  <div className="rc-detail-item rc-wide">
                    <div className="rc-detail-label">Lý do</div>
                    <div className="rc-detail-value">{selectedChange.reason || "—"}</div>
                  </div>

                  {selectedChange.changeType === 5 && selectedChange.extraData && (
                    <div className="rc-detail-item rc-wide">
                      <div className="rc-detail-label">Chi tiết tách hộ</div>
                      <div className="rc-detail-value">
                        <div>
                          <b>Thành viên tách:</b>
                          <ul style={{ margin: "6px 0 0 18px" }}>
                            {(selectedChange.extraData.memberIds || []).map(id => (
                              <li key={id}>{findMemberName(detailMembers, id, changes)}</li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <b>Chủ hộ mới:</b> {findMemberName(detailMembers, selectedChange.extraData.newOwnerId, changes)}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedChange.changeType === 6 && selectedChange.extraData && (
                    <div className="rc-detail-item rc-wide">
                      <div className="rc-detail-label">Chi tiết đổi chủ hộ</div>
                      <div className="rc-detail-value">
                        <div>
                          <b>Chủ hộ cũ:</b> {findMemberName(detailMembers, selectedChange.extraData.oldOwnerId, changes)}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <b>Chủ hộ mới:</b> {findMemberName(detailMembers, selectedChange.extraData.newOwnerId, changes)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Người duyệt</div>
                    <div className="rc-detail-value">{managerDisplay(selectedChange)}</div>
                  </div>

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Ngày tạo</div>
                    <div className="rc-detail-value">{formatDateDMY(selectedChange.createdAt)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="rc-modal-footer">
              <button className="rc-btn secondary" type="button" onClick={closeDetail}>
                Đóng
              </button>

              <button
                className="rc-btn ok"
                type="button"
                disabled={!canApprove || Number(selectedChange.approvalStatus) !== 0}
                onClick={() => handleApprove(selectedChange.id)}
              >
                <FaCheck /> Duyệt
              </button>

              <button
                className="rc-btn danger"
                type="button"
                disabled={!canApprove || Number(selectedChange.approvalStatus) !== 0}
                onClick={() => handleReject(selectedChange.id)}
              >
                <FaTimes /> Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
