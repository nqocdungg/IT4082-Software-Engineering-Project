import React, { useState, useMemo, useEffect } from "react"
import axios from "axios"
import {
  FaSearch,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaUsers,
  FaUserCheck,
  FaUserSlash,
  FaSkull,
  FaCross
} from "react-icons/fa"
import { GiCoffin } from "react-icons/gi";
import { HiOutlineLogin, HiOutlineLogout } from "react-icons/hi"

import "../styles/residents.css"
import "../styles/layout.css"

const API_BASE = "http://localhost:5000/api"

const RESIDENCY_STATUS = {
  0: { label: "Thường trú", className: "status-thuong_tru" },
  1: { label: "Tạm trú", className: "status-tam_tru" },
  2: { label: "Tạm vắng", className: "status-tam_vang" },
  3: { label: "Đã chuyển đi", className: "status-da_chuyen_di" },
  4: { label: "Đã qua đời", className: "status-da_qua_doi" }
}

function getResidencyStatusInfo(code) {
  return RESIDENCY_STATUS[code] || { label: "Không rõ", className: "" }
}

function authHeaders() {
  const token = localStorage.getItem("token")
  return { Authorization: `Bearer ${token}` }
}

function calcAge(dob) {
  if (!dob) return ""
  const now = new Date()
  const birth = new Date(dob)
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function computeStats(list) {
  const s = {
    total: 0,
    thuongTru: 0,
    tamTru: 0,
    tamVang: 0,
    daChuyenDi: 0,
    daQuaDoi: 0
  }

  s.total = list.length
  for (const r of list) {
    if (r.status === 0) s.thuongTru++
    else if (r.status === 1) s.tamTru++
    else if (r.status === 2) s.tamVang++
    else if (r.status === 3) s.daChuyenDi++
    else if (r.status === 4) s.daQuaDoi++
  }
  return s
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

export default function ResidentManagement() {
  const [residents, setResidents] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [genderFilter, setGenderFilter] = useState("ALL")

  const [householdIdFilter, setHouseholdIdFilter] = useState("")

  const [selectedResident, setSelectedResident] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  const [stats, setStats] = useState({
    total: 0,
    thuongTru: 0,
    tamTru: 0,
    tamVang: 0,
    daChuyenDi: 0,
    daQuaDoi: 0
  })

  const debouncedSearch = useDebouncedValue(search, 350)

  // ✅ Backend mới: GET /residents có query search + gender + householdId
  useEffect(() => {
    fetchResidents()
    // reset trang khi đổi filter server-side
    setCurrentPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, genderFilter, householdIdFilter])

  async function fetchResidents() {
    try {
      const params = {}

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
      if (genderFilter !== "ALL") params.gender = genderFilter // backend nhận "Nam"/"Nữ"
      if (String(householdIdFilter).trim()) params.householdId = String(householdIdFilter).trim()

      const res = await axios.get(`${API_BASE}/residents`, {
        headers: authHeaders(),
        params
      })

      const list = res.data?.data || []
      setResidents(list)
      setStats(computeStats(list))
    } catch (err) {
      console.error(err)
      alert("Không tải được danh sách nhân khẩu")
      setResidents([])
      setStats(computeStats([]))
    }
  }

  // ✅ statusFilter backend chưa hỗ trợ -> lọc client-side
  const filteredResidents = useMemo(() => {
    return residents.filter(r => {
      const matchStatus = statusFilter === "ALL" || String(r.status) === String(statusFilter)
      return matchStatus
    })
  }, [residents, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredResidents.length / rowsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1)
  }, [totalPages, currentPage])

  const pageResidents = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredResidents.slice(start, start + rowsPerPage)
  }, [filteredResidents, currentPage, rowsPerPage])

  const rangeText = useMemo(() => {
    const total = filteredResidents.length
    if (total === 0) return `0 - 0 trên tổng số 0 bản ghi`
    const start = (currentPage - 1) * rowsPerPage + 1
    const end = Math.min(currentPage * rowsPerPage, total)
    return `${start} - ${end} trên tổng số ${total} bản ghi`
  }, [filteredResidents.length, currentPage, rowsPerPage])

  const householdDisplay = r => {
    // backend trả householdCode + address (có thể null)
    if (r.householdId == null && !r.householdCode) return "—"
    if (r.householdCode) return `${r.householdCode}`
    return `HK #${r.householdId}`
  }

  const closeDetail = () => setSelectedResident(null)

  const handleOpenDetail = async resident => {
    setSelectedResident(resident)
    setLoadingDetail(true)
    try {
      const res = await axios.get(`${API_BASE}/residents/${resident.id}`, {
        headers: authHeaders()
      })
      setSelectedResident(res.data.data)
    } catch {
      alert("Không tải được chi tiết nhân khẩu")
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc muốn xóa nhân khẩu ID " + id + " ?")) return
    try {
      await axios.delete(`${API_BASE}/residents/${id}`, { headers: authHeaders() })

      // xoá ở local + update stats + nếu đang mở detail thì đóng
      setResidents(prev => {
        const next = prev.filter(r => r.id !== id)
        setStats(computeStats(next))
        return next
      })
      if (selectedResident?.id === id) closeDetail()
    } catch {
      alert("Xóa nhân khẩu thất bại")
    }
  }

  const miniCards = [
    { label: "Tất cả", value: stats.total, icon: <FaUsers />, tone: "blue" },
    { label: "Thường trú", value: stats.thuongTru, icon: <FaUserCheck />, tone: "green" },
    { label: "Tạm trú", value: stats.tamTru, icon: <HiOutlineLogin />, tone: "amber" },
    { label: "Đã chuyển đi", value: stats.daChuyenDi, icon: <HiOutlineLogout />, tone: "rose" },
    { label: "Đã qua đời", value: stats.daQuaDoi, icon: <GiCoffin />, tone: "slate" }
  ]

  return (
    <div className="page-container residents-page">
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
                <select
                  value={statusFilter}
                  onChange={e => {
                    setCurrentPage(1)
                    setStatusFilter(e.target.value)
                  }}
                >
                  <option value="ALL">Tất cả tình trạng</option>
                  <option value="0">Thường trú</option>
                  <option value="1">Tạm trú</option>
                  <option value="2">Tạm vắng</option>
                  <option value="3">Đã chuyển đi</option>
                  <option value="4">Đã qua đời</option>
                </select>
              </div>

              <div className="toolbar-select">
                <select
                  value={genderFilter}
                  onChange={e => {
                    setCurrentPage(1)
                    setGenderFilter(e.target.value)
                  }}
                >
                  <option value="ALL">Giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              {/* Nếu m không cần lọc householdId thì xoá block này */}
              {/* <div className="toolbar-search" style={{ maxWidth: 220 }}>
                <input
                  type="text"
                  placeholder="Household ID..."
                  value={householdIdFilter}
                  onChange={e => setHouseholdIdFilter(e.target.value)}
                />
              </div> */}
            </div>

            <div className="toolbar-right">
              <div className="toolbar-search">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
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
          <table className="resident-table">
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>Giới tính</th>
                <th>Ngày sinh / Tuổi</th>
                <th>CCCD</th>
                <th>Hộ khẩu</th>
                <th>Tình trạng cư trú</th>
                <th>Ngày đăng ký</th>
                <th style={{ width: 110 }}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {pageResidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-row">
                    Không có dữ liệu nào để hiển thị
                  </td>
                </tr>
              ) : (
                pageResidents.map(r => {
                  const info = getResidencyStatusInfo(r.status)
                  const age = calcAge(r.dob)

                  return (
                    <tr key={r.id} className="clickable-row" onClick={() => handleOpenDetail(r)}>
                      <td>
                        {r.fullname}
                      </td>

                      <td>{r.gender === "M" ? "Nam" : "Nữ"}</td>

                      <td>
                        {String(r.dob).slice(0, 10)}
                        <div className="sub-text">{age} tuổi</div>
                      </td>

                      <td className="cccd-cell">{r.residentCCCD || "—"}</td>

                      <td>{householdDisplay(r)}</td>

                      <td>
                        <span className={`status-badge ${info.className}`}>{info.label}</span>
                      </td>

                      <td>{String(r.createdAt).slice(0, 10)}</td>

                      <td onClick={e => e.stopPropagation()}>
                        <div className="row-actions">
                          <button type="button" title="Xem" onClick={() => handleOpenDetail(r)}>
                            <FaEye />
                          </button>
                          <button
                            type="button"
                            title="Xóa"
                            className="danger"
                            onClick={() => handleDelete(r.id)}
                          >
                            <FaTrash />
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
            </select>
          </div>

          <div className="footer-right">
            <span className="footer-muted">{rangeText}</span>

            <div className="pager">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
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

      {selectedResident && (
        <div className="resident-modal-overlay" onClick={closeDetail}>
          <div className="resident-modal" onClick={e => e.stopPropagation()}>
            <div className="resident-modal-header">
              <div>
                <h3 className="resident-modal-title">Chi tiết nhân khẩu</h3>
                <p className="resident-modal-sub">ID: #{selectedResident.id}</p>
              </div>

              <button className="modal-close-btn" type="button" onClick={closeDetail}>
                ✕
              </button>
            </div>

            <div className="resident-modal-body">
              {loadingDetail ? (
                <div className="empty-row">Đang tải chi tiết...</div>
              ) : (
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Họ và tên</div>
                    <div className="detail-value">{selectedResident.fullname}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Ngày sinh / Tuổi</div>
                    <div className="detail-value">
                      {String(selectedResident.dob).slice(0, 10)}{" "}
                      <span className="sub-text">({calcAge(selectedResident.dob)} tuổi)</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Giới tính</div>
                    <div className="detail-value">
                      {selectedResident.gender === "M" ? "Nam" : "Nữ"}
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">CCCD</div>
                    <div className="detail-value">{selectedResident.residentCCCD || "—"}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Quan hệ chủ hộ</div>
                    <div className="detail-value">{selectedResident.relationToOwner || "—"}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Hộ khẩu</div>
                    <div className="detail-value">
                      {selectedResident.householdCode
                        ? `${selectedResident.householdCode}`
                        : selectedResident.householdId != null
                          ? `HK #${selectedResident.householdId}`
                          : "—"}
                      {!!selectedResident.address && (
                        <div className="sub-text">{selectedResident.address}</div>
                      )}
                    </div>
                  </div>

                  <div className="detail-item detail-wide">
                    <div className="detail-label">Tình trạng cư trú</div>
                    <div className="detail-value">
                      <span
                        className={`status-badge ${getResidencyStatusInfo(selectedResident.status).className
                          }`}
                      >
                        {getResidencyStatusInfo(selectedResident.status).label}
                      </span>
                    </div>
                  </div>

                  {/* ✅ Field mới từ backend (có thể null) */}
                  <div className="detail-item">
                    <div className="detail-label">Dân tộc</div>
                    <div className="detail-value">{selectedResident.ethnicity || "—"}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Tôn giáo</div>
                    <div className="detail-value">{selectedResident.religion || "—"}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Quốc tịch</div>
                    <div className="detail-value">{selectedResident.nationality || "—"}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Quê quán</div>
                    <div className="detail-value">{selectedResident.hometown || "—"}</div>
                  </div>

                  <div className="detail-item detail-wide">
                    <div className="detail-label">Nghề nghiệp</div>
                    <div className="detail-value">{selectedResident.occupation || "—"}</div>
                  </div>

                  {/* Nếu m muốn show lịch sử biến động (changes) */}
                  {/* <div className="detail-item detail-wide">
                    <div className="detail-label">Lịch sử biến động</div>
                    <div className="detail-value">
                      {Array.isArray(selectedResident.changes) && selectedResident.changes.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {selectedResident.changes.slice(0, 5).map(ch => (
                            <li key={ch.id}>
                              {String(ch.createdAt).slice(0, 10)} — {ch.type || ch.action || "Biến động"}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div> */}
                </div>
              )}
            </div>

            <div className="resident-modal-footer">
              <button className="btn-secondary" type="button" onClick={closeDetail}>
                Đóng
              </button>
              <button
                className="btn-danger"
                type="button"
                onClick={() => handleDelete(selectedResident.id)}
              >
                <FaTrash /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
