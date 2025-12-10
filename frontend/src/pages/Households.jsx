import React, { useState, useMemo, useEffect } from "react"
import Header from "../components/Header.jsx"
import SideBar from "../components/SideBar.jsx"
import axios from "axios"
import {
  FaHome,
  FaPlus,
  FaSearch,
  FaUserEdit,
  FaTrash,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEye
} from "react-icons/fa"
import "../styles/households.css"

const currentRole = localStorage.getItem("role") || "HEAD"

const HOUSEHOLD_STATUS_MAP = {
  0: { label: "Đang hoạt động", className: "status-hk-thuong_tru" },
  1: { label: "Tạm trú", className: "status-hk-tam_tru" },
  2: { label: "Đã chuyển đi", className: "status-hk-da_chuyen_di" }
}

function getHouseholdStatusInfo(code) {
  return (
    HOUSEHOLD_STATUS_MAP[Number(code)] || {
      label: "Không rõ",
      className: ""
    }
  )
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái hộ khẩu" },
  { value: "0", label: "Đang hoạt động" },
  { value: "1", label: "Tạm trú" },
  { value: "2", label: "Đã chuyển đi" }
]

const SORT_OPTIONS = [
  { value: "NEWEST", label: "Sắp xếp: Đăng ký mới nhất" },
  { value: "OLDEST", label: "Sắp xếp: Đăng ký cũ nhất" },
  { value: "MEMBERS_DESC", label: "Số nhân khẩu: Giảm dần" },
  { value: "MEMBERS_ASC", label: "Số nhân khẩu: Tăng dần" }
]

const emptyHouseholdForm = {
  address: "",
  ownerName: "",
  ownerCCCD: "",
  ownerDob: "",
  ownerGender: "M"
}

const emptyResidentForm = {
  residentCCCD: "",
  fullname: "",
  dob: "",
  gender: "M",
  relationToOwner: ""
}

function AddHouseholdModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(emptyHouseholdForm)

  useEffect(() => {
    if (open) setForm(emptyHouseholdForm)
  }, [open])

  if (!open) return null

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      address: form.address,
      ownerCCCD: form.ownerCCCD,
      ownerName: form.ownerName,
      ownerDob: form.ownerDob,
      ownerGender: form.ownerGender || "M"
    }
    await onCreate(payload)
    onClose()
  }

  return (
    <div className="resident-modal-overlay" onClick={onClose}>
      <div className="resident-modal" onClick={(e) => e.stopPropagation()}>
        <div className="resident-modal-header">
          <div>
            <p className="resident-modal-label">Thêm hộ khẩu</p>
            <h3 className="resident-modal-title">Hộ khẩu mới</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes size={14} />
          </button>
        </div>

        <form className="resident-modal-body" onSubmit={handleSubmit}>
          <div className="detail-grid">
            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ *</span>
              <div className="detail-value">
                <input
                  required
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Tên chủ hộ *</span>
              <div className="detail-value">
                <input
                  required
                  value={form.ownerName}
                  onChange={(e) => handleChange("ownerName", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">CCCD chủ hộ *</span>
              <div className="detail-value">
                <input
                  required
                  value={form.ownerCCCD}
                  onChange={(e) => handleChange("ownerCCCD", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Ngày sinh chủ hộ</span>
              <div className="detail-value">
                <input
                  type="date"
                  value={form.ownerDob || ""}
                  onChange={(e) => handleChange("ownerDob", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Giới tính chủ hộ</span>
              <div className="detail-value">
                <select
                  value={form.ownerGender || "M"}
                  onChange={(e) => handleChange("ownerGender", e.target.value)}
                >
                  <option value="M">Nam</option>
                  <option value="F">Nữ</option>
                </select>
              </div>
            </div>
          </div>

          <div className="resident-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Thêm hộ khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddResidentModal({ open, onClose, household, onCreate }) {
  const [form, setForm] = useState(emptyResidentForm)

  useEffect(() => {
    if (open) setForm(emptyResidentForm)
  }, [open])

  if (!open || !household) return null

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      residentCCCD: form.residentCCCD,
      fullname: form.fullname,
      dob: form.dob,
      gender: form.gender,
      relationToOwner: form.relationToOwner || "Thành viên"
    }
    await onCreate(payload)
    onClose()
  }

  return (
    <div className="resident-modal-overlay" onClick={onClose}>
      <div className="resident-modal" onClick={(e) => e.stopPropagation()}>
        <div className="resident-modal-header">
          <div>
            <p className="resident-modal-label">Thêm nhân khẩu vào hộ</p>
            <h3 className="resident-modal-title">
              {household.owner?.fullname ||
                household.ownerName ||
                "Chủ hộ"}{" "}
              – {household.address}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes size={14} />
          </button>
        </div>

        <form className="resident-modal-body" onSubmit={handleSubmit}>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Họ và tên *</span>
              <div className="detail-value">
                <input
                  required
                  value={form.fullname}
                  onChange={(e) => handleChange("fullname", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">CCCD *</span>
              <div className="detail-value">
                <input
                  required
                  value={form.residentCCCD}
                  onChange={(e) =>
                    handleChange("residentCCCD", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Ngày sinh *</span>
              <div className="detail-value">
                <input
                  type="date"
                  required
                  value={form.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Giới tính</span>
              <div className="detail-value">
                <select
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                >
                  <option value="M">Nam</option>
                  <option value="F">Nữ</option>
                </select>
              </div>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Quan hệ với chủ hộ</span>
              <div className="detail-value">
                <input
                  value={form.relationToOwner}
                  onChange={(e) =>
                    handleChange("relationToOwner", e.target.value)
                  }
                  placeholder="VD: Vợ, Con, Ông, Bà..."
                />
              </div>
            </div>
          </div>

          <div className="resident-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Thêm nhân khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [sortOption, setSortOption] = useState("NEWEST")

  const [isAddOpen, setIsAddOpen] = useState(false)

  const [viewHousehold, setViewHousehold] = useState(null)
  const [editHousehold, setEditHousehold] = useState(null)
  const [editStatus, setEditStatus] = useState("0")

  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 4

  const allowManage = currentRole === "HEAD" || currentRole === "DEPUTY"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("accessToken")

        const res = await axios.get("http://localhost:5000/api/households", {
          headers: { Authorization: `Bearer ${token}` }
        })

        setHouseholds(res.data.data || [])
      } catch (err) {
        console.error(err)
        alert("Không tải được danh sách hộ khẩu")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreateHousehold = async (payload) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken")

      const res = await axios.post(
        "http://localhost:5000/api/households",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setHouseholds((prev) => [res.data.data, ...prev])
    } catch (err) {
      alert("Không thể tạo hộ khẩu!")
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá hộ khẩu ID " + id + " ?")) return

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken")

      await axios.delete(`http://localhost:5000/api/households/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setHouseholds((prev) => prev.filter((h) => h.id !== id))
      if (viewHousehold && viewHousehold.id === id) setViewHousehold(null)
      if (editHousehold && editHousehold.id === id) setEditHousehold(null)
    } catch (err) {
      alert("Không thể xoá hộ khẩu!")
      console.error(err)
    }
  }

  const handleOpenView = (household) => {
    setViewHousehold(household)
  }

  const handleCloseView = () => {
    setViewHousehold(null)
  }

  const handleOpenEdit = (household) => {
    setEditHousehold(household)
    setEditStatus(String(household.status ?? "0"))
  }

  const handleCloseEdit = () => {
    setEditHousehold(null)
  }

  const handleUpdateHousehold = async (e) => {
    e.preventDefault()
    if (!editHousehold) return

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken")

      const res = await axios.put(
        `http://localhost:5000/api/households/${editHousehold.id}/status`,
        { status: Number(editStatus) },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const updated = res.data.data

      setHouseholds((prev) =>
        prev.map((h) =>
          h.id === updated.id ? { ...h, status: updated.status } : h
        )
      )

      if (viewHousehold && viewHousehold.id === updated.id) {
        setViewHousehold((prev) =>
          prev ? { ...prev, status: updated.status } : prev
        )
      }

      setEditHousehold((prev) =>
        prev ? { ...prev, status: updated.status } : prev
      )

      handleCloseEdit()
    } catch (err) {
      console.error(err)
      alert("Không thể cập nhật trạng thái hộ khẩu")
    }
  }

  const handleAddResidentToHousehold = async (payload) => {
    if (!viewHousehold) return
    const householdId = viewHousehold.id

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken")

      const res = await axios.post(
        `http://localhost:5000/api/households/${householdId}/residents`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const newResident = res.data.data

      setHouseholds((prev) =>
        prev.map((h) =>
          h.id === householdId
            ? {
                ...h,
                nbrOfResident: (h.nbrOfResident || 0) + 1,
                residents: h.residents
                  ? [...h.residents, newResident]
                  : [newResident]
              }
            : h
        )
      )

      setViewHousehold((prev) =>
        prev
          ? {
              ...prev,
              nbrOfResident: (prev.nbrOfResident || 0) + 1,
              residents: prev.residents
                ? [...prev.residents, newResident]
                : [newResident]
            }
          : prev
      )
    } catch (err) {
      console.error(err)
      alert("Không thể thêm nhân khẩu vào hộ")
    }
  }

  const filteredHouseholds = useMemo(() => {
    let data = [...households]

    if (search.trim()) {
      const s = search.toLowerCase()
      data = data.filter(
        (h) =>
          (h.owner?.fullname || h.ownerName || "")
            .toLowerCase()
            .includes(s) ||
          h.address.toLowerCase().includes(s) ||
          (h.owner?.residentCCCD || h.ownerCCCD || "")
            .toLowerCase()
            .includes(s)
      )
    }

    if (statusFilter !== "ALL") {
      data = data.filter(
        (h) => String(h.status) === String(statusFilter)
      )
    }

    if (sortOption === "NEWEST") {
      data.sort(
        (a, b) => new Date(b.registrationDate) - new Date(a.registrationDate)
      )
    } else if (sortOption === "OLDEST") {
      data.sort(
        (a, b) => new Date(a.registrationDate) - new Date(b.registrationDate)
      )
    } else if (sortOption === "MEMBERS_DESC") {
      data.sort((a, b) => (b.nbrOfResident || 0) - (a.nbrOfResident || 0))
    } else if (sortOption === "MEMBERS_ASC") {
      data.sort((a, b) => (a.nbrOfResident || 0) - (b.nbrOfResident || 0))
    }

    return data
  }, [households, search, statusFilter, sortOption])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHouseholds.length / rowsPerPage)
  )

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1)
  }, [totalPages, currentPage])

  const pageHouseholds = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredHouseholds.slice(start, start + rowsPerPage)
  }, [filteredHouseholds, currentPage])

  const stats = useMemo(() => {
    const total = households.length
    const count = (code) =>
      households.filter((h) => Number(h.status) === Number(code)).length
    const avg =
      total === 0
        ? 0
        : households.reduce(
            (sum, h) => sum + (h.nbrOfResident || 0),
            0
          ) / total

    return {
      total,
      active: count(0),
      tamTru: count(1),
      daChuyenDi: count(2),
      avg: avg.toFixed(1)
    }
  }, [households])

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>

  return (
    <div className="appMain">
      <Header />
      <div className="mainContentWrapper">
        <SideBar />

        <div className="mainContent households-page">
          <div className="page-header">
            <h2 className="page-title">
              <FaHome className="page-title-icon" />
              Quản lý hộ khẩu
            </h2>

            {allowManage && (
              <button
                className="btn-primary"
                onClick={() => setIsAddOpen(true)}
              >
                <FaPlus /> Thêm hộ khẩu
              </button>
            )}
          </div>

          <div className="card filter-card">
            <div className="filter-grid">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  placeholder="Tìm chủ hộ, địa chỉ, CCCD..."
                  value={search}
                  onChange={(e) => {
                    setCurrentPage(1)
                    setSearch(e.target.value)
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setCurrentPage(1)
                  setStatusFilter(e.target.value)
                }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="stats-mini">
            <div className="stat-card">
              <p className="stat-label">Tổng số hộ</p>
              <p className="stat-value">{stats.total}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Đang hoạt động</p>
              <p className="stat-value">{stats.active}</p>
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
              <p className="stat-label">TB nhân khẩu / hộ</p>
              <p className="stat-value">{stats.avg}</p>
            </div>
          </div>

          <div className="card table-card">
            <div className="table-header">
              Danh sách hộ khẩu ({filteredHouseholds.length} bản ghi)
            </div>

            <div className="table-wrapper">
              <table className="household-table">
                <thead>
                  <tr>
                    <th>Chủ hộ</th>
                    <th>Địa chỉ</th>
                    <th>Số nhân khẩu</th>
                    <th>Trạng thái</th>
                    <th>Ngày đăng ký</th>
                    {allowManage && <th>Hành động</th>}
                  </tr>
                </thead>

                <tbody>
                  {pageHouseholds.length === 0 ? (
                    <tr>
                      <td colSpan={allowManage ? 6 : 5} className="empty-row">
                        Không có hộ khẩu phù hợp.
                      </td>
                    </tr>
                  ) : (
                    pageHouseholds.map((h) => {
                      const statusInfo = getHouseholdStatusInfo(h.status)
                      const ownerName =
                        h.owner?.fullname || h.ownerName || "Không rõ"

                      return (
                        <tr key={h.id}>
                          <td>{ownerName}</td>
                          <td>{h.address}</td>
                          <td>{h.nbrOfResident || 0}</td>
                          <td>
                            <span
                              className={`status-badge ${statusInfo.className}`}
                            >
                              {statusInfo.label}
                            </span>
                          </td>
                          <td>
                            {h.registrationDate
                              ? String(h.registrationDate).slice(0, 10)
                              : ""}
                          </td>

                          {allowManage && (
                            <td>
                              <div className="row-actions">
                                <button onClick={() => handleOpenView(h)}>
                                  <FaEye />
                                </button>
                                <button onClick={() => handleOpenEdit(h)}>
                                  <FaUserEdit />
                                </button>
                                <button
                                  className="danger"
                                  onClick={() => handleDelete(h.id)}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <FaChevronLeft />
              </button>

              <span>
                Trang {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>

          {allowManage && (
            <AddHouseholdModal
              open={isAddOpen}
              onClose={() => setIsAddOpen(false)}
              onCreate={handleCreateHousehold}
            />
          )}

          {viewHousehold && (
            <div
              className="resident-modal-overlay"
              onClick={handleCloseView}
            >
              <div
                className="resident-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="resident-modal-header">
                  <div>
                    <p className="resident-modal-label">
                      Thông tin hộ khẩu
                    </p>
                    <h3 className="resident-modal-title">
                      {viewHousehold.owner?.fullname ||
                        viewHousehold.ownerName ||
                        "Chủ hộ"}
                    </h3>
                    <p className="resident-modal-sub">
                      Địa chỉ: {viewHousehold.address}
                    </p>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={handleCloseView}
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                <div className="resident-modal-body">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Chủ hộ</span>
                      <span className="detail-value">
                        {viewHousehold.owner?.fullname ||
                          viewHousehold.ownerName ||
                          "Không rõ"}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">CCCD chủ hộ</span>
                      <span className="detail-value">
                        {viewHousehold.owner?.residentCCCD ||
                          viewHousehold.ownerCCCD ||
                          "Không rõ"}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Địa chỉ</span>
                      <span className="detail-value">
                        {viewHousehold.address}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Số nhân khẩu</span>
                      <span className="detail-value">
                        {viewHousehold.nbrOfResident || 0}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Trạng thái</span>
                      <span className="detail-value">
                        {getHouseholdStatusInfo(viewHousehold.status).label}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Ngày đăng ký</span>
                      <span className="detail-value">
                        {viewHousehold.registrationDate
                          ? String(viewHousehold.registrationDate).slice(0, 10)
                          : ""}
                      </span>
                    </div>

                    <div className="detail-item detail-wide">
                      <span className="detail-label">
                        Danh sách nhân khẩu trong hộ
                      </span>
                      <div className="detail-value">
                        {viewHousehold.residents?.length > 0 ? (
                          <ul className="member-list">
                            {viewHousehold.residents.map((r) => (
                              <li className="member-item" key={r.id}>
                                <div className="member-name">
                                  {r.fullname}
                                </div>
                                <div className="member-meta">
                                  {r.gender === "M"
                                    ? "Nam"
                                    : r.gender === "F"
                                    ? "Nữ"
                                    : r.gender || "Khác"}{" "}
                                  • {r.relationToOwner || "Thành viên"} •{" "}
                                  {r.residentCCCD}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="sub-text">
                            Chưa có nhân khẩu trong hộ.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {allowManage && (
                  <div className="resident-modal-footer">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setIsAddResidentOpen(true)}
                    >
                      Thêm nhân khẩu vào hộ
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {editHousehold && (
            <div
              className="resident-modal-overlay"
              onClick={handleCloseEdit}
            >
              <div
                className="resident-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="resident-modal-header">
                  <div>
                    <p className="resident-modal-label">
                      Chỉnh sửa hộ khẩu
                    </p>
                    <h3 className="resident-modal-title">
                      {editHousehold.owner?.fullname ||
                        editHousehold.ownerName ||
                        "Chủ hộ"}
                    </h3>
                    <p className="resident-modal-sub">
                      Địa chỉ: {editHousehold.address}
                    </p>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={handleCloseEdit}
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                <form
                  className="resident-modal-body"
                  onSubmit={handleUpdateHousehold}
                >
                  <div className="detail-grid">
                    <div className="detail-item detail-wide">
                      <span className="detail-label">
                        Trạng thái hộ khẩu
                      </span>
                      <div className="detail-value">
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                        >
                          <option value="0">Đang hoạt động</option>
                          <option value="1">Tạm trú</option>
                          <option value="2">Đã chuyển đi</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="resident-modal-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseEdit}
                    >
                      Hủy
                    </button>
                    <button type="submit" className="btn-primary">
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {allowManage && (
            <AddResidentModal
              open={isAddResidentOpen}
              onClose={() => setIsAddResidentOpen(false)}
              household={viewHousehold}
              onCreate={handleAddResidentToHousehold}
            />
          )}
        </div>
      </div>
    </div>
  )
}
