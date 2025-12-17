import React, { useState, useMemo, useEffect } from "react"
import axios from "axios"
import {
  FaPlus,
  FaSearch,
  FaUserFriends,
  FaUserEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa"
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

function toInputDate(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
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

const emptyForm = {
  residentCCCD: "",
  fullname: "",
  dob: "",
  gender: "M",
  relationToOwner: "HEAD",
  householdId: "" // input string, gửi lên Number hoặc null
}

export default function ResidentManagement() {
  const [residents, setResidents] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [genderFilter, setGenderFilter] = useState("ALL")

  const [selectedResident, setSelectedResident] = useState(null)
  const [detailMode, setDetailMode] = useState("view") // view | edit
  const [isAddOpen, setIsAddOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 4

  const [stats, setStats] = useState({
    total: 0,
    thuongTru: 0,
    tamTru: 0,
    tamVang: 0,
    daChuyenDi: 0,
    daQuaDoi: 0
  })

  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editForm, setEditForm] = useState(emptyForm)
  const [addForm, setAddForm] = useState(emptyForm)

  useEffect(() => {
    fetchResidents()
    fetchResidentStats()
  }, [])

  async function fetchResidents() {
    try {
      const res = await axios.get(`${API_BASE}/residents`, {
        headers: authHeaders()
      })
      setResidents(res.data.data || [])
    } catch {
      alert("Không tải được danh sách nhân khẩu")
    }
  }

  async function fetchResidentStats() {
    try {
      const res = await axios.get(`${API_BASE}/residents/stats`, {
        headers: authHeaders()
      })
      setStats(res.data.data)
    } catch {
      console.error("Không tải được thống kê nhân khẩu")
    }
  }

  const filteredResidents = useMemo(() => {
    return residents.filter(r => {
      const cccd = (r.residentCCCD || "").toString()

      const matchSearch =
        !search.trim() ||
        r.fullname?.toLowerCase().includes(search.toLowerCase()) ||
        cccd.includes(search)

      const matchStatus =
        statusFilter === "ALL" || String(r.status) === String(statusFilter)

      const matchGender =
        genderFilter === "ALL" ||
        (genderFilter === "Nam" && r.gender === "M") ||
        (genderFilter === "Nữ" && r.gender === "F")

      return matchSearch && matchStatus && matchGender
    })
  }, [residents, search, statusFilter, genderFilter])

  const totalPages = Math.max(1, Math.ceil(filteredResidents.length / rowsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1)
  }, [totalPages])

  const pageResidents = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredResidents.slice(start, start + rowsPerPage)
  }, [filteredResidents, currentPage])

  const householdDisplay = r => {
    if (r.householdId != null) return `HK #${r.householdId}` // đúng ý m: lấy id
    return "Không rõ"
  }

  const closeDetail = () => {
    if (saving) return
    setSelectedResident(null)
    setDetailMode("view")
  }

  const handleOpenDetail = async (resident, mode = "view") => {
    setDetailMode(mode)
    setSelectedResident(resident)
    setLoadingDetail(true)
    try {
      const res = await axios.get(`${API_BASE}/residents/${resident.id}`, {
        headers: authHeaders()
      })
      const full = res.data.data
      setSelectedResident(full)

      setEditForm({
        residentCCCD: full.residentCCCD || "",
        fullname: full.fullname || "",
        dob: toInputDate(full.dob),
        gender: full.gender || "M",
        relationToOwner: full.relationToOwner || "HEAD",
        householdId: full.householdId != null ? String(full.householdId) : ""
      })
    } catch {
      alert("Không tải được chi tiết nhân khẩu")
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc muốn xóa nhân khẩu ID " + id + " ?")) return
    try {
      await axios.delete(`${API_BASE}/residents/${id}`, {
        headers: authHeaders()
      })
      setResidents(prev => prev.filter(r => r.id !== id))
      fetchResidentStats()
      if (selectedResident?.id === id) closeDetail()
    } catch {
      alert("Xóa nhân khẩu thất bại")
    }
  }

  async function submitEdit() {
    if (!selectedResident) return

    if (!editForm.fullname.trim() || !editForm.dob || !editForm.relationToOwner.trim()) {
      alert("Thiếu: Họ tên / Ngày sinh / Quan hệ chủ hộ")
      return
    }

    setSaving(true)
    try {
      const payload = {
        residentCCCD: editForm.residentCCCD.trim() || null,
        fullname: editForm.fullname.trim(),
        dob: editForm.dob,
        gender: editForm.gender,
        relationToOwner: editForm.relationToOwner.trim(),
        householdId: editForm.householdId ? Number(editForm.householdId) : null
      }

      const res = await axios.put(
        `${API_BASE}/residents/${selectedResident.id}`,
        payload,
        { headers: authHeaders() }
      )

      const updated = res.data.data

      setResidents(prev => prev.map(r => (r.id === updated.id ? { ...r, ...updated } : r)))
      setSelectedResident(prev => (prev ? { ...prev, ...updated } : prev))

      fetchResidentStats()
      setDetailMode("view")
    } catch (e) {
      alert(e?.response?.data?.message || "Cập nhật thất bại")
    } finally {
      setSaving(false)
    }
  }

  async function submitAdd() {
    if (!addForm.fullname.trim() || !addForm.dob || !addForm.relationToOwner.trim()) {
      alert("Thiếu: Họ tên / Ngày sinh / Quan hệ chủ hộ")
      return
    }

    setSaving(true)
    try {
      const payload = {
        residentCCCD: addForm.residentCCCD.trim() || null,
        fullname: addForm.fullname.trim(),
        dob: addForm.dob,
        gender: addForm.gender,
        relationToOwner: addForm.relationToOwner.trim(),
        householdId: addForm.householdId ? Number(addForm.householdId) : null
      }

      const res = await axios.post(`${API_BASE}/residents`, payload, {
        headers: authHeaders()
      })

      const created = res.data.data
      setResidents(prev => [created, ...prev])
      fetchResidentStats()

      setIsAddOpen(false)
      setAddForm(emptyForm)
    } catch (e) {
      alert(e?.response?.data?.message || "Thêm nhân khẩu thất bại")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container residents-page">
      <div className="page-header">
        <h2 className="page-title">
          <FaUserFriends className="page-title-icon" />
          Quản lý nhân khẩu
        </h2>

        <button
          className="btn-primary"
          onClick={() => {
            setIsAddOpen(true)
            setAddForm(emptyForm)
          }}
        >
          <FaPlus /> Thêm nhân khẩu
        </button>
      </div>

      <div className="card filter-card">
        <div className="filter-grid basic-3">
          <div className="filter-input search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm theo họ tên hoặc CCCD..."
              value={search}
              onChange={e => {
                setCurrentPage(1)
                setSearch(e.target.value)
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => {
              setCurrentPage(1)
              setStatusFilter(e.target.value)
            }}
          >
            <option value="ALL">Tất cả tình trạng cư trú</option>
            <option value="0">Thường trú</option>
            <option value="1">Tạm trú</option>
            <option value="2">Tạm vắng</option>
            <option value="3">Đã chuyển đi</option>
            <option value="4">Đã qua đời</option>
          </select>

          <select
            value={genderFilter}
            onChange={e => {
              setCurrentPage(1)
              setGenderFilter(e.target.value)
            }}
          >
            <option value="ALL">Giới tính (tất cả)</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>
      </div>

      <div className="stats-mini">
        <div className="stat-card">
          <p className="stat-label">Tổng nhân khẩu</p>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Thường trú</p>
          <p className="stat-value">{stats.thuongTru}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Tạm trú</p>
          <p className="stat-value">{stats.tamTru}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Đã chuyển đi</p>
          <p className="stat-value">{stats.daChuyenDi}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Đã qua đời</p>
          <p className="stat-value">{stats.daQuaDoi}</p>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-header">
          Danh sách nhân khẩu ({filteredResidents.length} bản ghi)
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
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {pageResidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-row">
                    Không có nhân khẩu phù hợp
                  </td>
                </tr>
              ) : (
                pageResidents.map(r => {
                  const info = getResidencyStatusInfo(r.status)
                  const age = calcAge(r.dob)

                  return (
                    <tr
                      key={r.id}
                      className="clickable-row"
                      onClick={() => handleOpenDetail(r, "view")}
                    >
                      <td>{r.fullname}</td>
                      <td>{r.gender === "M" ? "Nam" : "Nữ"}</td>

                      <td>
                        {String(r.dob).slice(0, 10)}
                        <div className="sub-text">{age} tuổi</div>
                      </td>

                      <td className="cccd-cell">{r.residentCCCD}</td>

                      <td>{householdDisplay(r)}</td>

                      <td>
                        <span className={`status-badge ${info.className}`}>
                          {info.label}
                        </span>
                      </td>

                      <td>{String(r.createdAt).slice(0, 10)}</td>

                      <td onClick={e => e.stopPropagation()}>
                        <div className="row-actions">
                          <button onClick={() => handleOpenDetail(r, "edit")}>
                            <FaUserEdit />
                          </button>
                          <button className="danger" onClick={() => handleDelete(r.id)}>
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
      </div>

      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
          <FaChevronLeft />
        </button>

        <span>
          Trang {currentPage} / {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          <FaChevronRight />
        </button>
      </div>

      {/* ===== ADD MODAL ===== */}
      {isAddOpen && (
        <div className="resident-modal-overlay" onClick={() => !saving && setIsAddOpen(false)}>
          <div className="resident-modal" onClick={e => e.stopPropagation()}>
            <div className="resident-modal-header">
              <div>
                <p className="resident-modal-label">POPUP</p>
                <h3 className="resident-modal-title">Thêm nhân khẩu</h3>
                <p className="resident-modal-sub">Nhập thông tin và bấm Thêm</p>
              </div>

              <button className="modal-close-btn" onClick={() => !saving && setIsAddOpen(false)}>
                ✕
              </button>
            </div>

            <div className="resident-modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Họ và tên *</div>
                  <div className="detail-value">
                    <input
                      value={addForm.fullname}
                      onChange={e => setAddForm(f => ({ ...f, fullname: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Ngày sinh *</div>
                  <div className="detail-value">
                    <input
                      type="date"
                      value={addForm.dob}
                      onChange={e => setAddForm(f => ({ ...f, dob: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Giới tính</div>
                  <div className="detail-value">
                    <select
                      value={addForm.gender}
                      onChange={e => setAddForm(f => ({ ...f, gender: e.target.value }))}
                    >
                      <option value="M">Nam</option>
                      <option value="F">Nữ</option>
                    </select>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">CCCD</div>
                  <div className="detail-value">
                    <input
                      value={addForm.residentCCCD}
                      onChange={e => setAddForm(f => ({ ...f, residentCCCD: e.target.value }))}
                      placeholder="Có thể để trống"
                    />
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Quan hệ chủ hộ *</div>
                  <div className="detail-value">
                    <input
                      value={addForm.relationToOwner}
                      onChange={e => setAddForm(f => ({ ...f, relationToOwner: e.target.value }))}
                      placeholder="HEAD / WIFE / SON..."
                    />
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Mã hộ khẩu (Household.id)</div>
                  <div className="detail-value">
                    <input
                      value={addForm.householdId}
                      onChange={e => setAddForm(f => ({ ...f, householdId: e.target.value }))}
                      placeholder="VD: 12 (trống nếu tạm trú)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="resident-modal-footer">
              <button className="btn-secondary" disabled={saving} onClick={() => setIsAddOpen(false)}>
                Hủy
              </button>
              <button className="btn-primary" disabled={saving} onClick={submitAdd}>
                {saving ? "Đang lưu..." : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DETAIL MODAL (VIEW/EDIT) ===== */}
      {selectedResident && (
        <div className="resident-modal-overlay" onClick={closeDetail}>
          <div className="resident-modal" onClick={e => e.stopPropagation()}>
            <div className="resident-modal-header">
              <div>
                <p className="resident-modal-label">
                  {detailMode === "edit" ? "EDIT" : "VIEW"}
                </p>
                <h3 className="resident-modal-title">
                  {detailMode === "edit" ? "Chỉnh sửa nhân khẩu" : "Chi tiết nhân khẩu"}
                </h3>
                <p className="resident-modal-sub">ID: #{selectedResident.id}</p>
              </div>

              <button className="modal-close-btn" onClick={closeDetail}>
                ✕
              </button>
            </div>

            <div className="resident-modal-body">
              {loadingDetail ? (
                <div className="empty-row">Đang tải chi tiết...</div>
              ) : detailMode === "view" ? (
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
                    <div className="detail-value">{selectedResident.relationToOwner}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Mã hộ khẩu</div>
                    <div className="detail-value">
                      {selectedResident.householdId != null
                        ? `HK #${selectedResident.householdId}`
                        : "Không rõ"}
                    </div>
                  </div>

                  <div className="detail-item detail-wide">
                    <div className="detail-label">Tình trạng cư trú</div>
                    <div className="detail-value">
                      <span
                        className={`status-badge ${
                          getResidencyStatusInfo(selectedResident.status).className
                        }`}
                      >
                        {getResidencyStatusInfo(selectedResident.status).label}
                      </span>
                    </div>
                  </div>

                  <div className="detail-item detail-wide">
                    <div className="detail-label">Tạm trú đang hoạt động</div>
                    <div className="detail-value">
                      {selectedResident.temporaryResidences?.length ? (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {selectedResident.temporaryResidences.map(t => (
                            <li key={t.id}>
                              {t.address}{" "}
                              <span className="sub-text">
                                ({String(t.fromDate).slice(0, 10)} →{" "}
                                {t.toDate ? String(t.toDate).slice(0, 10) : "—"})
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="sub-text">Không có</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Họ và tên *</div>
                    <div className="detail-value">
                      <input
                        value={editForm.fullname}
                        onChange={e => setEditForm(f => ({ ...f, fullname: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Ngày sinh *</div>
                    <div className="detail-value">
                      <input
                        type="date"
                        value={editForm.dob}
                        onChange={e => setEditForm(f => ({ ...f, dob: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Giới tính</div>
                    <div className="detail-value">
                      <select
                        value={editForm.gender}
                        onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                      >
                        <option value="M">Nam</option>
                        <option value="F">Nữ</option>
                      </select>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">CCCD</div>
                    <div className="detail-value">
                      <input
                        value={editForm.residentCCCD}
                        onChange={e =>
                          setEditForm(f => ({ ...f, residentCCCD: e.target.value }))
                        }
                        placeholder="Có thể để trống"
                      />
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Quan hệ chủ hộ *</div>
                    <div className="detail-value">
                      <input
                        value={editForm.relationToOwner}
                        onChange={e =>
                          setEditForm(f => ({ ...f, relationToOwner: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Mã hộ khẩu (Household.id)</div>
                    <div className="detail-value">
                      <input
                        value={editForm.householdId}
                        onChange={e => setEditForm(f => ({ ...f, householdId: e.target.value }))}
                        placeholder="Trống nếu tạm trú"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="resident-modal-footer">
              {detailMode === "view" ? (
                <>
                  <button className="btn-secondary" onClick={closeDetail}>
                    Đóng
                  </button>
                  <button className="btn-primary" onClick={() => setDetailMode("edit")}>
                    <FaUserEdit /> Sửa
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-secondary"
                    disabled={saving}
                    onClick={() => setDetailMode("view")}
                  >
                    Hủy
                  </button>
                  <button className="btn-primary" disabled={saving} onClick={submitEdit}>
                    {saving ? "Đang lưu..." : "Lưu"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
