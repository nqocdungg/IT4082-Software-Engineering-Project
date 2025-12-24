import React, { useState, useMemo, useEffect } from "react"
import axios from "axios"
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

const API_BASE = "http://localhost:5000/api"

function authHeaders() {
  const token = localStorage.getItem("token")
  return { Authorization: `Bearer ${token}` }
}

// debounce nhỏ cho ô search (đỡ spam API)
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
  return CHANGE_TYPES[code]?.label || "Không rõ"
}

function getApprovalInfo(code) {
  return APPROVAL_STATUS[code] || { label: "Không rõ", className: "" }
}

function safeParseJSON(v) {
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

function computeStats(list) {
  const s = { total: 0, pending: 0, approved: 0, rejected: 0 }
  s.total = list.length
  for (const c of list) {
    if (c.approvalStatus === 0) s.pending++
    else if (c.approvalStatus === 1) s.approved++
    else if (c.approvalStatus === 2) s.rejected++
  }
  return s
}

export default function ResidentChange() {
  const [changes, setChanges] = useState([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const [selectedChange, setSelectedChange] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })

  // modal create
  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    changeType: "3",
    residentId: "",
    fromAddress: "",
    toAddress: "",
    fromDate: "",
    toDate: "",
    reason: "",
    extra_fullname: "",
    extra_dob: "",
    extra_householdId: "",
    extra_residentCCCD: ""
  })

  const debouncedSearch = useDebouncedValue(search, 350)

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
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.message || "Không tải được danh sách biến động")
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

  const closeDetail = () => setSelectedChange(null)

  const handleOpenDetail = async row => {
    setSelectedChange(row)
    setLoadingDetail(true)
    try {
      const res = await axios.get(`${API_BASE}/resident-changes/${row.id}`, {
        headers: authHeaders()
      })
      setSelectedChange(res.data?.data || row)
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

  // ===== create modal helpers =====
  const openCreateModal = () => setOpenCreate(true)
  const closeCreateModal = () => {
    setOpenCreate(false)
    setCreating(false)
  }

  const onCreateField = (key, val) => setCreateForm(prev => ({ ...prev, [key]: val }))

  async function handleCreateSubmit(e) {
    e.preventDefault()
    try {
      setCreating(true)

      const changeTypeNum = Number(createForm.changeType)

      const payload = {
        changeType: changeTypeNum,
        fromAddress: createForm.fromAddress || null,
        toAddress: createForm.toAddress || null,
        fromDate: createForm.fromDate || null,
        toDate: createForm.toDate || null,
        reason: createForm.reason || null
      }

      if (changeTypeNum === 0 || changeTypeNum === 3) {
        payload.extraData = {
          fullname: createForm.extra_fullname || undefined,
          dob: createForm.extra_dob || undefined,
          householdId: createForm.extra_householdId ? Number(createForm.extra_householdId) : undefined,
          residentCCCD: createForm.extra_residentCCCD || undefined
        }
      } else {
        payload.residentId = createForm.residentId ? Number(createForm.residentId) : null
      }

      await axios.post(`${API_BASE}/resident-changes`, payload, { headers: authHeaders() })

      alert("Tạo biến động thành công!")
      closeCreateModal()
      await fetchChanges()
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.message || "Tạo biến động thất bại")
    } finally {
      setCreating(false)
    }
  }

  const miniCards = [
    { label: "Tạo biến động", value: "＋", icon: <FaPlus />, tone: "violet", onClick: openCreateModal },
    { label: "Tất cả", value: stats.total, icon: <FaFolderOpen />, tone: "blue" },
    { label: "Chờ duyệt", value: stats.pending, icon: <FaClock />, tone: "amber" },
    { label: "Đã duyệt", value: stats.approved, icon: <FaCheck />, tone: "green" },
    { label: "Từ chối", value: stats.rejected, icon: <FaTimes />, tone: "rose" }
  ]

  const residentDisplay = c => {
    const r = c?.resident
    if (!r) return "—"
    const cccd = r.residentCCCD ? ` • ${r.residentCCCD}` : ""
    return `${r.fullname || "—"}${cccd}`
  }

  const householdDisplay = c => {
    const hh = c?.resident?.household
    if (hh?.householdCode) return hh.householdCode
    const hid = c?.resident?.householdId
    return hid != null ? `HK #${hid}` : "—"
  }

  const managerDisplay = c => {
    const m = c?.manager
    if (!m) return "—"
    return m.fullname || m.username || `#${m.id}`
  }

  const extraDataInReason = useMemo(() => {
    if (!selectedChange?.reason) return null
    const parsed = safeParseJSON(selectedChange.reason)
    return parsed && typeof parsed === "object" ? parsed : null
  }, [selectedChange?.reason])

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
                  placeholder="Tìm theo tên / CCCD / mã hộ khẩu..."
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
                        <div className="rc-sub-text">
                          {c?.resident?.gender === "M" ? "Nam" : c?.resident?.gender === "F" ? "Nữ" : "—"} •{" "}
                          {String(c?.resident?.dob || "").slice(0, 10) || "—"}
                        </div>
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

                      <td>{String(c.createdAt).slice(0, 10)}</td>

                      <td onClick={e => e.stopPropagation()}>
                        <div className="rc-row-actions">
                          <button type="button" title="Xem" onClick={() => handleOpenDetail(c)}>
                            <FaEye />
                          </button>

                          <button
                            type="button"
                            title="Duyệt"
                            className="ok"
                            disabled={c.approvalStatus !== 0}
                            onClick={() => handleApprove(c.id)}
                          >
                            <FaCheck />
                          </button>

                          <button
                            type="button"
                            title="Từ chối"
                            className="danger"
                            disabled={c.approvalStatus !== 0}
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

      {/* ===== CREATE MODAL ===== */}
      {openCreate && (
        <div className="rc-modal-overlay" onClick={closeCreateModal}>
          <div className="rc-modal" onClick={e => e.stopPropagation()}>
            <div className="rc-modal-header">
              <div>
                <h3 className="rc-modal-title">Tạo biến động</h3>
                <p className="rc-modal-sub">Nhập thông tin và bấm Tạo</p>
              </div>

              <button className="rc-modal-close" type="button" onClick={closeCreateModal}>
                ✕
              </button>
            </div>

            <form className="rc-modal-body" onSubmit={handleCreateSubmit}>
              <div className="rc-detail-grid">
                <div className="rc-detail-item">
                  <div className="rc-detail-label">Loại biến động</div>
                  <select className="rc-input" value={createForm.changeType} onChange={e => onCreateField("changeType", e.target.value)}>
                    {Object.entries(CHANGE_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {k} — {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ResidentId cho các loại khác 0/3 */}
                {!(Number(createForm.changeType) === 0 || Number(createForm.changeType) === 3) && (
                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Resident ID</div>
                    <input
                      className="rc-input"
                      value={createForm.residentId}
                      onChange={e => onCreateField("residentId", e.target.value)}
                      placeholder="VD: 12"
                    />
                  </div>
                )}

                {/* ExtraData cho type 0/3 */}
                {(Number(createForm.changeType) === 0 || Number(createForm.changeType) === 3) && (
                  <>
                    <div className="rc-detail-item">
                      <div className="rc-detail-label">Họ tên</div>
                      <input
                        className="rc-input"
                        value={createForm.extra_fullname}
                        onChange={e => onCreateField("extra_fullname", e.target.value)}
                        placeholder="Nguyễn Văn A"
                      />
                    </div>

                    <div className="rc-detail-item">
                      <div className="rc-detail-label">Ngày sinh</div>
                      <input
                        type="date"
                        className="rc-input"
                        value={createForm.extra_dob}
                        onChange={e => onCreateField("extra_dob", e.target.value)}
                      />
                    </div>

                    <div className="rc-detail-item">
                      <div className="rc-detail-label">Household ID</div>
                      <input
                        className="rc-input"
                        value={createForm.extra_householdId}
                        onChange={e => onCreateField("extra_householdId", e.target.value)}
                        placeholder="VD: 101"
                      />
                    </div>

                    <div className="rc-detail-item">
                      <div className="rc-detail-label">CCCD (nếu có)</div>
                      <input
                        className="rc-input"
                        value={createForm.extra_residentCCCD}
                        onChange={e => onCreateField("extra_residentCCCD", e.target.value)}
                        placeholder="012345678901"
                      />
                    </div>
                  </>
                )}

                <div className="rc-detail-item">
                  <div className="rc-detail-label">Từ địa chỉ</div>
                  <input className="rc-input" value={createForm.fromAddress} onChange={e => onCreateField("fromAddress", e.target.value)} placeholder="..." />
                </div>

                <div className="rc-detail-item">
                  <div className="rc-detail-label">Đến địa chỉ</div>
                  <input className="rc-input" value={createForm.toAddress} onChange={e => onCreateField("toAddress", e.target.value)} placeholder="..." />
                </div>

                <div className="rc-detail-item">
                  <div className="rc-detail-label">Từ ngày</div>
                  <input type="date" className="rc-input" value={createForm.fromDate} onChange={e => onCreateField("fromDate", e.target.value)} />
                </div>

                <div className="rc-detail-item">
                  <div className="rc-detail-label">Đến ngày (tuỳ chọn)</div>
                  <input type="date" className="rc-input" value={createForm.toDate} onChange={e => onCreateField("toDate", e.target.value)} />
                </div>

                <div className="rc-detail-item rc-wide">
                  <div className="rc-detail-label">Lý do</div>
                  <textarea
                    className="rc-input rc-textarea"
                    rows={3}
                    value={createForm.reason}
                    onChange={e => onCreateField("reason", e.target.value)}
                    placeholder="..."
                  />
                </div>
              </div>

              <div className="rc-modal-footer">
                <button className="rc-btn secondary" type="button" onClick={closeCreateModal}>
                  Đóng
                </button>

                <button className="rc-btn ok" type="submit" disabled={creating}>
                  <FaPlus /> {creating ? "Đang tạo..." : "Tạo biến động"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
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
                <div className="rc-empty-row">Đang tải chi tiết...</div>
              ) : (
                <div className="rc-detail-grid">
                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Loại biến động</div>
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
                    <div className="rc-detail-value">{residentDisplay(selectedChange)}</div>
                  </div>

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Hộ khẩu</div>
                    <div className="rc-detail-value">{householdDisplay(selectedChange)}</div>
                  </div>

                  <div className="rc-detail-item rc-wide">
                    <div className="rc-detail-label">Địa chỉ</div>
                    <div className="rc-detail-value">
                      <div className="rc-sub-text">
                        <b>Từ:</b> {selectedChange.fromAddress || "—"} &nbsp;&nbsp; <b>Đến:</b> {selectedChange.toAddress || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Từ ngày</div>
                    <div className="rc-detail-value">{String(selectedChange.fromDate).slice(0, 10)}</div>
                  </div>

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Đến ngày</div>
                    <div className="rc-detail-value">{selectedChange.toDate ? String(selectedChange.toDate).slice(0, 10) : "—"}</div>
                  </div>

                  <div className="rc-detail-item rc-wide">
                    <div className="rc-detail-label">Reason</div>
                    <div className="rc-detail-value">{selectedChange.reason || "—"}</div>

                    {extraDataInReason && (
                      <div className="rc-sub-text" style={{ marginTop: 6 }}>
                        <b>extraData (parse từ reason):</b>
                        <pre className="rc-pre">{JSON.stringify(extraDataInReason, null, 2)}</pre>
                      </div>
                    )}
                  </div>

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Người duyệt</div>
                    <div className="rc-detail-value">{managerDisplay(selectedChange)}</div>
                  </div>

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Ngày tạo</div>
                    <div className="rc-detail-value">{String(selectedChange.createdAt).slice(0, 10)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="rc-modal-footer">
              <button className="rc-btn secondary" type="button" onClick={closeDetail}>
                Đóng
              </button>

              <button className="rc-btn ok" type="button" disabled={selectedChange.approvalStatus !== 0} onClick={() => handleApprove(selectedChange.id)}>
                <FaCheck /> Duyệt
              </button>

              <button className="rc-btn danger" type="button" disabled={selectedChange.approvalStatus !== 0} onClick={() => handleReject(selectedChange.id)}>
                <FaTimes /> Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
