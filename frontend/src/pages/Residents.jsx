// src/pages/Residents.jsx
import React, { useState, useMemo, useEffect } from "react"
import Header from "../components/Header.jsx"
import SideBar from "../components/SideBar.jsx"
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

export default function ResidentManagement() {
  const [residents, setResidents] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [genderFilter, setGenderFilter] = useState("ALL")

  const [selectedResident, setSelectedResident] = useState(null)
  const [detailMode, setDetailMode] = useState("view")
  const [isAddOpen, setIsAddOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 5

  useEffect(() => {
    fetchResidents()
  }, [])

  async function fetchResidents() {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get("http://localhost:5000/api/residents", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResidents(res.data.data)
    } catch {
      alert("Không tải được danh sách nhân khẩu")
    }
  }

  const filteredResidents = useMemo(() => {
    return residents.filter(r => {
      const matchSearch =
        !search.trim() ||
        r.fullname.toLowerCase().includes(search.toLowerCase()) ||
        r.residentCCCD.includes(search)

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

  const stats = useMemo(() => {
    const total = residents.length
    const count = code => residents.filter(r => r.status === code).length
    return {
      total,
      thuongTru: count(0),
      tamTru: count(1),
      daChuyenDi: count(3),
      daQuaDoi: count(4)
    }
  }, [residents])

  const handleOpenDetail = (resident, mode = "view") => {
    setSelectedResident(resident)
    setDetailMode(mode)
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc muốn xóa nhân khẩu ID " + id + " ?")) return
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://localhost:5000/api/residents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResidents(prev => prev.filter(r => r.id !== id))
    } catch {
      alert("Xóa nhân khẩu thất bại")
    }
  }

  return (
    <div className="appMain">
      <Header />

      <div className="mainContentWrapper">
        <SideBar />

        <div className="mainContent residents-page">

          <div className="page-header">
            <h2 className="page-title">
              <FaUserFriends className="page-title-icon" />
              Quản lý nhân khẩu
            </h2>

            <button className="btn-primary" onClick={() => setIsAddOpen(true)}>
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

              <select value={statusFilter} onChange={e => {
                setCurrentPage(1)
                setStatusFilter(e.target.value)
              }}>
                <option value="ALL">Tất cả tình trạng cư trú</option>
                <option value="0">Thường trú</option>
                <option value="1">Tạm trú</option>
                <option value="2">Tạm vắng</option>
                <option value="3">Đã chuyển đi</option>
                <option value="4">Đã qua đời</option>
              </select>

              <select value={genderFilter} onChange={e => {
                setCurrentPage(1)
                setGenderFilter(e.target.value)
              }}>
                <option value="ALL">Giới tính (tất cả)</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
          </div>

          <div className="stats-mini">
            <div className="stat-card"><p className="stat-label">Tổng nhân khẩu</p><p className="stat-value">{stats.total}</p></div>
            <div className="stat-card"><p className="stat-label">Thường trú</p><p className="stat-value">{stats.thuongTru}</p></div>
            <div className="stat-card"><p className="stat-label">Tạm trú</p><p className="stat-value">{stats.tamTru}</p></div>
            <div className="stat-card"><p className="stat-label">Đã chuyển đi</p><p className="stat-value">{stats.daChuyenDi}</p></div>
            <div className="stat-card"><p className="stat-label">Đã qua đời</p><p className="stat-value">{stats.daQuaDoi}</p></div>
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
                    <tr><td colSpan={8} className="empty-row">Không có nhân khẩu phù hợp</td></tr>
                  ) : (
                    pageResidents.map(r => {
                      const info = getResidencyStatusInfo(r.status)
                      const age = new Date().getFullYear() - new Date(r.dob).getFullYear()

                      return (
                        <tr key={r.id} className="clickable-row" onClick={() => handleOpenDetail(r, "view")}>

                          <td>{r.fullname}</td>
                          <td>{r.gender === "M" ? "Nam" : "Nữ"}</td>

                          <td>
                            {r.dob.slice(0, 10)}
                            <div className="sub-text">{age} tuổi</div>
                          </td>

                          <td>{r.residentCCCD}</td>
                          <td>{r.household?.address || "Không rõ"}</td>

                          <td>
                            <span className={`status-badge ${info.className}`}>
                              {info.label}
                            </span>
                          </td>

                          <td>{r.createdAt.slice(0, 10)}</td>

                          <td onClick={e => e.stopPropagation()}>
                            <div className="row-actions">
                              <button onClick={() => handleOpenDetail(r, "edit")}><FaUserEdit /></button>
                              <button className="danger" onClick={() => handleDelete(r.id)}><FaTrash /></button>
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

            <span>Trang {currentPage} / {totalPages}</span>

            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <FaChevronRight />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
