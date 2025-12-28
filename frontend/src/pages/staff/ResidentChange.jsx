import React, { useEffect, useMemo, useState } from "react"
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

function findMemberName(list, id) {
  const x = (list || []).find(m => Number(m.id) === Number(id))
  if (!x) return `#${id}`
  const cccd = x.residentCCCD ? ` • ${x.residentCCCD}` : ""
  return `${x.fullname || "—"}${cccd}`
}

/* =========================
 * ✅ ROLE: lấy trực tiếp từ JWT
 * ========================= */
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
    extra_residentCCCD: "",
    extra_dob: "",
    extra_gender: "",
    extra_ethnicity: "",
    extra_religion: "",
    extra_nationality: "",
    extra_hometown: "",
    extra_householdId: "",
    extra_relationToOwner: ""
  })

  const [residentSearch, setResidentSearch] = useState("")
  const [residentResult, setResidentResult] = useState(null)
  const [residentOptions, setResidentOptions] = useState([])
  const debouncedResidentSearch = useDebouncedValue(residentSearch, 300)

  const [householdSearch, setHouseholdSearch] = useState("")
  const [householdOptions, setHouseholdOptions] = useState([])
  const [selectedHousehold, setSelectedHousehold] = useState(null)
  const debouncedHouseholdSearch = useDebouncedValue(householdSearch, 300)

  const debouncedSearch = useDebouncedValue(search, 350)

  // ===== NHÓM NGHIỆP VỤ =====
  const ctNum = Number(createForm.changeType)

  const CREATE_RESIDENT_TYPES = [0, 1, 3]
  const USE_RESIDENT_TYPES = [2, 4, 7]
  const HOUSEHOLD_OP_TYPES = [5, 6]

  const isCreateResident = CREATE_RESIDENT_TYPES.includes(ctNum)
  const isUseResident = USE_RESIDENT_TYPES.includes(ctNum)
  const isHouseholdOp = HOUSEHOLD_OP_TYPES.includes(ctNum)

  const isDeath = ctNum === 7
  const isTempStay = ctNum === 1

  // ===== TÁCH HỘ / ĐỔI CHỦ HỘ =====
  const [splitMembers, setSplitMembers] = useState([])
  const [newOwnerId, setNewOwnerId] = useState(null)
  const [householdMembers, setHouseholdMembers] = useState([])

  // members riêng cho modal detail
  const [detailMembers, setDetailMembers] = useState([])

  // ✅ fallback extraData khi pending ct 0/1/3
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
    const dobText = dob ? String(dob).slice(0, 10) : "—"
    return `${genderLabel} • ${dobText}`
  }

  // ✅ fallback householdId từ extraData
  const householdDisplay = c => {
    const hh = c?.resident?.household
    if (hh?.householdCode) return hh.householdCode
    const exHid = c?.extraData?.householdId
    if (exHid != null) return `HK #${exHid}`
    const hid = c?.resident?.householdId
    return hid != null ? `HK #${hid}` : "—"
  }

  const managerDisplay = c => {
    const m = c?.manager
    if (!m) return "—"
    return m.fullname || m.username || `#${m.id}`
  }

  const miniCards = [
    { label: "Tạo biến động", value: "＋", icon: <FaPlus />, tone: "violet", onClick: () => setOpenCreate(true) },
    { label: "Tất cả", value: stats.total, icon: <FaFolderOpen />, tone: "blue" },
    { label: "Chờ duyệt", value: stats.pending, icon: <FaClock />, tone: "amber" },
    { label: "Đã duyệt", value: stats.approved, icon: <FaCheck />, tone: "green" },
    { label: "Từ chối", value: stats.rejected, icon: <FaTimes />, tone: "rose" }
  ]

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

  const closeDetail = () => {
    setSelectedChange(null)
    setLoadingDetail(false)
    setDetailMembers([])
  }

  const handleOpenDetail = async row => {
    setSelectedChange(row)
    setLoadingDetail(true)
    setDetailMembers([])

    try {
      const res = await axios.get(`${API_BASE}/resident-changes/${row.id}`, {
        headers: authHeaders()
      })
      const detail = res.data?.data || row
      setSelectedChange(detail)

      if (detail?.changeType === 5 || detail?.changeType === 6) {
        const hhId =
          detail?.changeType === 5 ? detail?.extraData?.oldHouseholdId : detail?.extraData?.householdId

        if (hhId) {
          try {
            const memRes = await axios.get(`${API_BASE}/households/${hhId}/members`, {
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

  const closeCreateModal = () => {
    setOpenCreate(false)
    setCreating(false)

    setResidentSearch("")
    setResidentResult(null)
    setResidentOptions([])

    setHouseholdSearch("")
    setSelectedHousehold(null)
    setHouseholdOptions([])

    setSplitMembers([])
    setNewOwnerId(null)
    setHouseholdMembers([])

    setCreateForm(prev => ({
      ...prev,
      residentId: "",
      fromAddress: "",
      toAddress: "",
      fromDate: "",
      toDate: "",
      reason: "",
      extra_fullname: "",
      extra_residentCCCD: "",
      extra_dob: "",
      extra_gender: "",
      extra_ethnicity: "",
      extra_religion: "",
      extra_nationality: "",
      extra_hometown: "",
      extra_householdId: "",
      extra_relationToOwner: ""
    }))
  }

  const onCreateField = (key, val) => setCreateForm(prev => ({ ...prev, [key]: val }))

  // search resident suggestions
  useEffect(() => {
    if (debouncedResidentSearch.trim().length < 2) {
      setResidentOptions([])
      return
    }

    const fetch = async () => {
      try {
        const res = await axios.get(`${API_BASE}/residents/search`, {
          headers: authHeaders(),
          params: { q: debouncedResidentSearch.trim() }
        })
        const data = res.data?.data
        setResidentOptions(Array.isArray(data) ? data : data ? [data] : [])
      } catch {
        setResidentOptions([])
      }
    }

    fetch()
  }, [debouncedResidentSearch])

  // search household suggestions
  useEffect(() => {
    if (!debouncedHouseholdSearch.trim()) {
      setHouseholdOptions([])
      return
    }

    const fetch = async () => {
      try {
        const res = await axios.get(`${API_BASE}/households/search`, {
          headers: authHeaders(),
          params: { q: debouncedHouseholdSearch.trim() }
        })
        const data = res.data?.data
        setHouseholdOptions(Array.isArray(data) ? data : data ? [data] : [])
      } catch {
        setHouseholdOptions([])
      }
    }

    fetch()
  }, [debouncedHouseholdSearch])

  // reset theo loại biến động
  useEffect(() => {
    setResidentSearch("")
    setResidentResult(null)
    setResidentOptions([])
    onCreateField("residentId", "")

    setHouseholdSearch("")
    setSelectedHousehold(null)
    setHouseholdOptions([])
    onCreateField("extra_householdId", "")

    setSplitMembers([])
    setNewOwnerId(null)
    setHouseholdMembers([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createForm.changeType])

  // load members khi chọn hộ (phục vụ ct 5/6)
  useEffect(() => {
    if (![5, 6].includes(ctNum)) return
    if (!selectedHousehold?.id) return

    axios
      .get(`${API_BASE}/households/${selectedHousehold.id}/members`, {
        headers: authHeaders()
      })
      .then(res => {
        setHouseholdMembers(res.data?.data || [])
        setSplitMembers([])
        setNewOwnerId(null)
      })
      .catch(() => {
        setHouseholdMembers([])
        setSplitMembers([])
        setNewOwnerId(null)
      })
  }, [ctNum, selectedHousehold])

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

      if (isCreateResident) {
        if (!isTempStay && !selectedHousehold?.id) {
          alert("Vui lòng chọn hộ khẩu")
          setCreating(false)
          return
        }

        payload.extraData = {
          fullname: createForm.extra_fullname || undefined,
          residentCCCD: createForm.extra_residentCCCD || undefined,
          dob: createForm.extra_dob || undefined,
          gender: createForm.extra_gender || undefined,
          ethnicity: createForm.extra_ethnicity || undefined,
          religion: createForm.extra_religion || undefined,
          nationality: createForm.extra_nationality || undefined,
          hometown: createForm.extra_hometown || undefined,

          // ✅ gửi relationToOwner
          relationToOwner: createForm.extra_relationToOwner || undefined,

          // ✅ tạm trú: cho null
          householdId: isTempStay ? null : (selectedHousehold?.id || null)
        }
      }

      if (isUseResident) {
        if (!residentResult?.id) {
          alert("Vui lòng chọn nhân khẩu")
          setCreating(false)
          return
        }
        payload.residentId = residentResult.id
      }

      if (ctNum === 5) {
        if (!selectedHousehold?.id) {
          alert("Vui lòng chọn hộ khẩu")
          setCreating(false)
          return
        }
        if (splitMembers.length < 1) {
          alert("Vui lòng chọn ít nhất 1 thành viên để tách hộ")
          setCreating(false)
          return
        }
        if (!newOwnerId) {
          alert("Vui lòng chọn chủ hộ mới")
          setCreating(false)
          return
        }

        payload.residentId = null
        payload.extraData = {
          oldHouseholdId: selectedHousehold.id,
          memberIds: splitMembers,
          newOwnerId
        }
      }

      if (ctNum === 6) {
        if (!selectedHousehold?.id) {
          alert("Vui lòng chọn hộ khẩu")
          setCreating(false)
          return
        }
        if (!newOwnerId) {
          alert("Vui lòng chọn chủ hộ mới")
          setCreating(false)
          return
        }

        payload.residentId = null
        payload.extraData = {
          householdId: selectedHousehold.id,
          oldOwnerId: householdMembers.find(m => m.relationToOwner === "Chủ hộ")?.id,
          newOwnerId
        }
      }

      await axios.post(`${API_BASE}/resident-changes`, payload, {
        headers: authHeaders()
      })

      await fetchChanges()
      closeCreateModal()
      alert("Tạo thành công!")
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.message || "Tạo thất bại")
    } finally {
      setCreating(false)
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

                      <td>{String(c.createdAt).slice(0, 10)}</td>

                      <td onClick={e => e.stopPropagation()}>
                        <div className="rc-row-actions">
                          <button type="button" title="Xem" onClick={() => handleOpenDetail(c)}>
                            <FaEye />
                          </button>

                          <button
                            type="button"
                            title={
                              !canApprove
                                ? "Bạn không có quyền duyệt"
                                : isPending
                                  ? "Duyệt"
                                  : "Chỉ duyệt khi chờ duyệt"
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
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
       *  ✅ MODAL CREATE (FULL)
       * ========================= */}
      {openCreate && (
        <div className="rc-modal-overlay" onClick={closeCreateModal}>
          <div className="rc-modal" onClick={e => e.stopPropagation()}>
            <div className="rc-modal-header">
              <div>
                <h3 className="rc-modal-title">Tạo biến động</h3>
                <p className="rc-modal-sub">Nhập thông tin và bấm Tạo</p>
              </div>
              <button className="rc-modal-close" onClick={closeCreateModal} type="button">
                ✕
              </button>
            </div>

            <form className="rc-modal-body" onSubmit={handleCreateSubmit}>
              <div className="rc-detail-grid">
                <div className="rc-detail-item rc-wide">
                  <div className="rc-detail-label">Loại biến động</div>
                  <select
                    className="rc-input"
                    value={createForm.changeType}
                    onChange={e => onCreateField("changeType", e.target.value)}
                  >
                    {Object.entries(CHANGE_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {k} — {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(isCreateResident || isHouseholdOp) && (
                  <div className="rc-detail-item rc-wide rc-suggest-wrap">
                    <div className="rc-detail-label">
                      Hộ khẩu {isTempStay && isCreateResident ? "(không bắt buộc)" : ""}
                    </div>
                    <input
                      className="rc-input"
                      value={householdSearch}
                      onChange={e => setHouseholdSearch(e.target.value)}
                      placeholder="Nhập mã hộ khẩu / địa chỉ"
                    />

                    {householdOptions.length > 0 && (
                      <div className="rc-suggest-list">
                        {householdOptions.map(h => (
                          <button
                            key={h.id}
                            type="button"
                            className="rc-suggest-item"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              setSelectedHousehold(h)
                              setHouseholdSearch(h.householdCode || `HK #${h.id}`)
                              setHouseholdOptions([])
                            }}
                          >
                            <span className="rc-suggest-main">{h.householdCode || `HK #${h.id}`}</span>
                            <span className="rc-suggest-sub">{h.address || "—"}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedHousehold?.id && (
                      <div className="rc-sub-text" style={{ marginTop: 6 }}>
                        Đã chọn: <b>{selectedHousehold.householdCode || `HK #${selectedHousehold.id}`}</b>
                        {selectedHousehold.address ? ` • ${selectedHousehold.address}` : ""}
                      </div>
                    )}
                  </div>
                )}

                {isCreateResident && (
                  <>
                    <div className="rc-detail-item">
                      <div className="rc-detail-label">Họ và tên</div>
                      <input
                        className="rc-input"
                        value={createForm.extra_fullname}
                        onChange={e => onCreateField("extra_fullname", e.target.value)}
                      />
                    </div>

                    <div className="rc-detail-item">
                      <div className="rc-detail-label">CCCD</div>
                      <input
                        className="rc-input"
                        value={createForm.extra_residentCCCD}
                        onChange={e => onCreateField("extra_residentCCCD", e.target.value)}
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
                      <div className="rc-detail-label">Giới tính</div>
                      <select
                        className="rc-input"
                        value={createForm.extra_gender}
                        onChange={e => onCreateField("extra_gender", e.target.value)}
                      >
                        <option value="">--</option>
                        <option value="M">Nam</option>
                        <option value="F">Nữ</option>
                      </select>
                    </div>

                    <div className="rc-detail-item rc-wide">
                      <div className="rc-detail-label">
                        Quan hệ với chủ hộ <span className="rc-muted">(tuỳ chọn)</span>
                      </div>
                      <input
                        className="rc-input"
                        placeholder="Ví dụ: Con, Vợ, Cháu, Anh ruột, ..."
                        value={createForm.extra_relationToOwner}
                        onChange={e => onCreateField("extra_relationToOwner", e.target.value)}
                      />
                    </div>
                  </>
                )}

                {ctNum === 5 && (
                  <div className="rc-detail-item rc-wide">
                    <div className="rc-detail-label">Tách hộ – chọn thành viên</div>

                    {!selectedHousehold?.id ? (
                      <div className="rc-sub-text">Vui lòng chọn hộ khẩu trước</div>
                    ) : householdMembers.length === 0 ? (
                      <div className="rc-sub-text">Hộ khẩu này chưa có thành viên</div>
                    ) : (
                      <div className="rc-split-box">
                        {householdMembers.map(m => {
                          const checked = splitMembers.includes(m.id)
                          return (
                            <label key={m.id} className="rc-split-row">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSplitMembers(prev => [...prev, m.id])
                                  } else {
                                    setSplitMembers(prev => prev.filter(id => id !== m.id))
                                    if (newOwnerId === m.id) setNewOwnerId(null)
                                  }
                                }}
                              />

                              <span className="rc-split-info">
                                <b>{m.fullname}</b>
                                {m.residentCCCD && ` • ${m.residentCCCD}`}
                                <span className="rc-sub-text">
                                  {m.gender === "M" ? "Nam" : m.gender === "F" ? "Nữ" : "—"} •{" "}
                                  {String(m.dob).slice(0, 10)}
                                </span>
                              </span>

                              {checked && (
                                <button
                                  type="button"
                                  className={`rc-chip ${newOwnerId === m.id ? "active" : ""}`}
                                  onClick={() => setNewOwnerId(m.id)}
                                >
                                  {newOwnerId === m.id ? "✓ Chủ hộ mới" : "Đặt làm chủ hộ"}
                                </button>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {selectedHousehold?.id && splitMembers.length > 0 && !newOwnerId && (
                      <div className="rc-sub-text" style={{ color: "#b45309" }}>
                        ⚠️ Vui lòng chọn chủ hộ mới
                      </div>
                    )}
                  </div>
                )}

                {ctNum === 6 && (
                  <div className="rc-detail-item rc-wide">
                    <div className="rc-detail-label">Đổi chủ hộ – chọn chủ hộ mới</div>

                    {!selectedHousehold?.id ? (
                      <div className="rc-sub-text">Vui lòng chọn hộ khẩu trước</div>
                    ) : householdMembers.length === 0 ? (
                      <div className="rc-sub-text">Hộ khẩu này chưa có thành viên</div>
                    ) : (
                      <div className="rc-split-box">
                        {householdMembers.map(m => (
                          <div
                            key={m.id}
                            className={`rc-split-row rc-click-row ${newOwnerId === m.id ? "selected" : ""}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => setNewOwnerId(m.id)}
                            onKeyDown={e => e.key === "Enter" && setNewOwnerId(m.id)}
                          >
                            <span className={`rc-dot ${newOwnerId === m.id ? "on" : ""}`} />
                            <span className="rc-split-info">
                              <b>{m.fullname}</b>
                              {m.residentCCCD && ` • ${m.residentCCCD}`}
                              <span className="rc-sub-text">{m.relationToOwner ? `Quan hệ: ${m.relationToOwner}` : ""}</span>
                            </span>

                            {newOwnerId === m.id && <span className="rc-tag">Chủ hộ mới</span>}
                          </div>

                        ))}
                      </div>
                    )}

                    {selectedHousehold?.id && !newOwnerId && (
                      <div className="rc-sub-text" style={{ color: "#b45309" }}>
                        ⚠️ Vui lòng chọn chủ hộ mới
                      </div>
                    )}
                  </div>
                )}

                {isUseResident && (
                  <>
                    <div className="rc-detail-item rc-wide rc-suggest-wrap">
                      <div className="rc-detail-label">Nhân khẩu</div>
                      <input
                        className="rc-input"
                        value={residentSearch}
                        onChange={e => setResidentSearch(e.target.value)}
                        placeholder="Nhập họ tên / CCCD"
                      />

                      {residentOptions.length > 0 && (
                        <div className="rc-suggest-list">
                          {residentOptions.map(r => (
                            <button
                              key={r.id}
                              type="button"
                              className="rc-suggest-item"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => {
                                setResidentResult(r)
                                setResidentSearch(`${r.fullname || "—"} • ${r.residentCCCD || "—"}`)
                                setResidentOptions([])
                              }}
                            >
                              <span className="rc-suggest-main">{r.fullname || "—"}</span>
                              <span className="rc-suggest-sub">{r.residentCCCD || "—"}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {!isDeath && (
                      <>
                        <div className="rc-detail-item">
                          <div className="rc-detail-label">Từ địa chỉ</div>
                          <input
                            className="rc-input"
                            value={createForm.fromAddress}
                            onChange={e => onCreateField("fromAddress", e.target.value)}
                          />
                        </div>

                        <div className="rc-detail-item">
                          <div className="rc-detail-label">Đến địa chỉ</div>
                          <input
                            className="rc-input"
                            value={createForm.toAddress}
                            onChange={e => onCreateField("toAddress", e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="rc-detail-item">
                  <div className="rc-detail-label">Từ ngày</div>
                  <input
                    type="date"
                    className="rc-input"
                    value={createForm.fromDate}
                    onChange={e => onCreateField("fromDate", e.target.value)}
                  />
                </div>

                <div className="rc-detail-item">
                  <div className="rc-detail-label">Đến ngày</div>
                  <input
                    type="date"
                    className="rc-input"
                    value={createForm.toDate}
                    onChange={e => onCreateField("toDate", e.target.value)}
                  />
                </div>

                <div className="rc-detail-item rc-wide">
                  <div className="rc-detail-label">Lý do</div>
                  <textarea
                    className="rc-input rc-textarea"
                    rows={3}
                    value={createForm.reason}
                    onChange={e => onCreateField("reason", e.target.value)}
                  />
                </div>
              </div>

              <div className="rc-modal-footer">
                <button type="button" className="rc-btn secondary" onClick={closeCreateModal}>
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

      {/* =========================
       *  ✅ MODAL DETAIL (FULL)
       * ========================= */}
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
                    <div className="rc-detail-value">{householdDisplay(selectedChange)}</div>
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
                    <div className="rc-detail-value">{String(selectedChange.fromDate).slice(0, 10)}</div>
                  </div>

                  <div className="rc-detail-item">
                    <div className="rc-detail-label">Đến ngày</div>
                    <div className="rc-detail-value">
                      {selectedChange.toDate ? String(selectedChange.toDate).slice(0, 10) : "—"}
                    </div>
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
                              <li key={id}>{findMemberName(detailMembers, id)}</li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <b>Chủ hộ mới:</b> {findMemberName(detailMembers, selectedChange.extraData.newOwnerId)}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedChange.changeType === 6 && selectedChange.extraData && (
                    <div className="rc-detail-item rc-wide">
                      <div className="rc-detail-label">Chi tiết đổi chủ hộ</div>
                      <div className="rc-detail-value">
                        <div>
                          <b>Chủ hộ cũ:</b> {findMemberName(detailMembers, selectedChange.extraData.oldOwnerId)}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <b>Chủ hộ mới:</b> {findMemberName(detailMembers, selectedChange.extraData.newOwnerId)}
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
                    <div className="rc-detail-value">{String(selectedChange.createdAt).slice(0, 10)}</div>
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
