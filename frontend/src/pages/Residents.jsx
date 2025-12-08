// src/pages/Residents.jsx
import React, { useState, useMemo, useEffect } from "react"
import Header from "../components/Header.jsx"
import SideBar from "../components/SideBar.jsx"
import axios from "axios"
import { FaPlus, FaSearch, FaUserFriends, FaUserEdit, FaTrash, FaTimes } from "react-icons/fa"
import "../styles/residents.css"

const RESIDENCY_STATUS = {
  0: { label: "Thường trú", className: "status-thuong_tru" },
  1: { label: "Tạm trú", className: "status-tam_tru" },
  2: { label: "Tạm vắng", className: "status-tam_vang" },
  3: { label: "Đã chuyển đi", className: "status-da_chuyen_di" },
  4: { label: "Đã qua đời", className: "status-da_qua_doi" }
}

const residencyStatusOptions = Object.entries(RESIDENCY_STATUS).map(([code, info]) => ({
  value: code,
  label: `${info.label} (mã ${code})`
}))

const statusFilterOptions = [
  { value: "ALL", label: "Tất cả tình trạng cư trú" },
  ...Object.entries(RESIDENCY_STATUS).map(([code, info]) => ({
    value: code,
    label: info.label
  }))
]

const genderOptions = [
  { value: "ALL", label: "Giới tính (tất cả)" },
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" }
]

function getResidencyStatusInfo(code) {
  return RESIDENCY_STATUS[code] || { label: "Không rõ", className: "" }
}

const emptyResident = {
  id: 0,
  fullName: "",
  gender: "",
  dob: "",
  age: "",
  cccd: "",
  relationToHead: "",
  maritalStatus: "",
  occupation: "",
  permanentAddress: "",
  tempAddress: "",
  residencyStatusCode: 0,
  registeredAt: "",
  note: ""
}

function ResidentDetailModal({ resident, mode, onChangeMode, onClose, onSave }) {
  const isEdit = mode === "edit"
  const [form, setForm] = useState(resident ?? emptyResident)

  useEffect(() => {
    if (resident) setForm(resident)
    else setForm(emptyResident)
  }, [resident, mode])

  if (!resident) return null

  const statusInfo = getResidencyStatusInfo(form.residencyStatusCode ?? 0)

  const mainAddress = form.residencyStatusCode === 1 && form.tempAddress
    ? form.tempAddress
    : form.permanentAddress

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSave(form)
  }

  return (
    <div className="resident-modal-overlay" onClick={onClose}>
      <div className="resident-modal" onClick={e => e.stopPropagation()}>
        <div className="resident-modal-header">
          <div>
            <p className="resident-modal-label">{isEdit ? "Chỉnh sửa thông tin" : "Chi tiết nhân khẩu"}</p>
            {isEdit ? (
              <input className="detail-title-input" value={form.fullName} onChange={e => handleChange("fullName", e.target.value)} />
            ) : (
              <h3 className="resident-modal-title">{form.fullName}</h3>
            )}
            <p className="resident-modal-sub">CCCD: {form.cccd} • {form.gender} • {form.age} tuổi</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="resident-modal-body no-scrollbar">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Quan hệ với chủ hộ</span>
              <span className="detail-value">
                {isEdit ? (
                  <input value={form.relationToHead} onChange={e => handleChange("relationToHead", e.target.value)} />
                ) : form.relationToHead}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Tình trạng hôn nhân</span>
              <span className="detail-value">
                {isEdit ? (
                  <input value={form.maritalStatus} onChange={e => handleChange("maritalStatus", e.target.value)} />
                ) : form.maritalStatus}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Nghề nghiệp</span>
              <span className="detail-value">
                {isEdit ? (
                  <input value={form.occupation} onChange={e => handleChange("occupation", e.target.value)} />
                ) : form.occupation}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Ngày sinh / Tuổi</span>
              <span className="detail-value">
                {isEdit ? (
                  <>
                    <input value={form.dob} onChange={e => handleChange("dob", e.target.value)} />
                    <input style={{ marginTop: 6 }} value={form.age} onChange={e => handleChange("age", e.target.value)} placeholder="Tuổi" />
                  </>
                ) : (
                  <>{form.dob} ({form.age} tuổi)</>
                )}
              </span>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ hộ khẩu thường trú</span>
              <span className="detail-value">
                {isEdit ? (
                  <input value={form.permanentAddress} onChange={e => handleChange("permanentAddress", e.target.value)} />
                ) : form.permanentAddress}
              </span>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ tạm trú</span>
              <span className="detail-value">
                {isEdit ? (
                  <input value={form.tempAddress} onChange={e => handleChange("tempAddress", e.target.value)} />
                ) : form.tempAddress || "Không có"}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Tình trạng cư trú</span>
              <span className="detail-value">
                {isEdit ? (
                  <select value={form.residencyStatusCode} onChange={e => handleChange("residencyStatusCode", Number(e.target.value))}>
                    {residencyStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label} (mã {form.residencyStatusCode})</span>
                )}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Ngày đăng ký cư trú</span>
              <span className="detail-value">
                {isEdit ? (
                  <input value={form.registeredAt} onChange={e => handleChange("registeredAt", e.target.value)} />
                ) : form.registeredAt}
              </span>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ hiển thị chính</span>
              <span className="detail-value">{mainAddress}</span>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Ghi chú</span>
              <span className="detail-value">
                {isEdit ? (
                  <textarea value={form.note} onChange={e => handleChange("note", e.target.value)} />
                ) : form.note || "Không có ghi chú"}
              </span>
            </div>
          </div>
        </div>

        <div className="resident-modal-footer">
          {!isEdit ? (
            <>
              <button className="btn-secondary" onClick={onClose}>Đóng</button>
              <button className="btn-primary" onClick={() => onChangeMode("edit")}><FaUserEdit /> Chỉnh sửa</button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => onChangeMode("view")}>Hủy</button>
              <button className="btn-primary" onClick={handleSubmit}>Lưu thay đổi</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AddResidentModal({ open, onClose, onCreate }) {
  const emptyForm = {
    fullName: "",
    gender: "Nam",
    dob: "",
    age: "",
    cccd: "",
    relationToHead: "",
    maritalStatus: "",
    occupation: "",
    permanentAddress: "",
    tempAddress: "",
    residencyStatusCode: 0,
    registeredAt: "",
    note: ""
  }

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (open) setForm(emptyForm)
  }, [open])

  if (!open) return null

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    onCreate(form)
    onClose()
  }

  return (
    <div className="resident-modal-overlay" onClick={onClose}>
      <div className="resident-modal" onClick={e => e.stopPropagation()}>
        <div className="resident-modal-header">
          <div>
            <p className="resident-modal-label">Thêm mới</p>
            <h3 className="resident-modal-title">Nhân khẩu mới</h3>
            <p className="resident-modal-sub">Nhập các thông tin cơ bản của nhân khẩu</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <form className="resident-modal-body no-scrollbar" onSubmit={handleSubmit}>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Họ và tên *</span>
              <span className="detail-value">
                <input required value={form.fullName} onChange={e => handleChange("fullName", e.target.value)} />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Giới tính</span>
              <span className="detail-value">
                <select value={form.gender} onChange={e => handleChange("gender", e.target.value)}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Ngày sinh</span>
              <span className="detail-value">
                <input value={form.dob} onChange={e => handleChange("dob", e.target.value)} placeholder="YYYY-MM-DD" />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Tuổi</span>
              <span className="detail-value">
                <input value={form.age} onChange={e => handleChange("age", e.target.value)} />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Số CCCD</span>
              <span className="detail-value">
                <input value={form.cccd} onChange={e => handleChange("cccd", e.target.value)} />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Quan hệ với chủ hộ</span>
              <span className="detail-value">
                <input value={form.relationToHead} onChange={e => handleChange("relationToHead", e.target.value)} />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Tình trạng hôn nhân</span>
              <span className="detail-value">
                <input value={form.maritalStatus} onChange={e => handleChange("maritalStatus", e.target.value)} />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Nghề nghiệp</span>
              <span className="detail-value">
                <input value={form.occupation} onChange={e => handleChange("occupation", e.target.value)} />
              </span>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ hộ khẩu thường trú *</span>
              <span className="detail-value">
                <input required value={form.permanentAddress} onChange={e => handleChange("permanentAddress", e.target.value)} />
              </span>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ tạm trú</span>
              <span className="detail-value">
                <input value={form.tempAddress} onChange={e => handleChange("tempAddress", e.target.value)} />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Tình trạng cư trú</span>
              <span className="detail-value">
                <select value={form.residencyStatusCode} onChange={e => handleChange("residencyStatusCode", Number(e.target.value))}>
                  {residencyStatusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Ngày đăng ký cư trú</span>
              <span className="detail-value">
                <input value={form.registeredAt} onChange={e => handleChange("registeredAt", e.target.value)} placeholder="YYYY-MM-DD" />
              </span>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Ghi chú</span>
              <span className="detail-value">
                <textarea value={form.note} onChange={e => handleChange("note", e.target.value)} />
              </span>
            </div>
          </div>

          <div className="resident-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">Thêm nhân khẩu</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ResidentManagement() {
  const [residents, setResidents] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [genderFilter, setGenderFilter] = useState("ALL")
  const [selectedResident, setSelectedResident] = useState(null)
  const [detailMode, setDetailMode] = useState("view")
  const [isAddOpen, setIsAddOpen] = useState(false)

  useEffect(() => {
    fetchResidents()
  }, [])

  async function fetchResidents() {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get("http://localhost:5000/api/residents", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResidents(res.data)
    } catch (err) {
      console.error("Failed to fetch residents:", err)
      alert("Không tải được danh sách nhân khẩu!")
    }
  }

  const filteredResidents = useMemo(() => {
    return residents.filter(r => {
      const matchSearch =
        search.trim() === "" ||
        r.fullName.toLowerCase().includes(search.toLowerCase()) ||
        r.cccd.includes(search)
      const matchStatus = statusFilter === "ALL" || String(r.residencyStatusCode) === String(statusFilter)
      const matchGender = genderFilter === "ALL" || r.gender === genderFilter
      return matchSearch && matchStatus && matchGender
    })
  }, [residents, search, statusFilter, genderFilter])

  const stats = useMemo(() => {
    const total = residents.length
    const countByStatus = code => residents.filter(r => r.residencyStatusCode === code).length
    return {
      total,
      thuongTru: countByStatus(0),
      tamTru: countByStatus(1),
      daChuyenDi: countByStatus(3),
      daQuaDoi: countByStatus(4)
    }
  }, [residents])

  const handleOpenDetail = (resident, mode = "view") => {
    setSelectedResident(resident)
    setDetailMode(mode)
  }

  const handleCloseDetail = () => {
    setSelectedResident(null)
    setDetailMode("view")
  }

  const handleSaveResident = async updated => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.put(`http://localhost:5000/api/residents/${updated.id}`, updated, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResidents(prev => prev.map(r => (r.id === updated.id ? res.data : r)))
      setSelectedResident(res.data)
      setDetailMode("view")
    } catch (err) {
      console.error(err)
      alert("Cập nhật thất bại!")
    }
  }

  const handleCreateResident = async data => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.post("http://localhost:5000/api/residents", data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResidents(prev => [...prev, res.data])
    } catch (err) {
      console.error(err)
      alert("Thêm nhân khẩu thất bại!")
    }
  }

  const handleDelete = async id => {
    if (!window.confirm("Bạn có chắc muốn xóa nhân khẩu ID " + id + " ?")) return
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://localhost:5000/api/residents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResidents(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error(err)
      alert("Xóa nhân khẩu thất bại!")
    }
  }

  return (
    <div className="appMain">
      <Header />
      <div className="mainContentWrapper">
        <SideBar />
        <div className="mainContent residents-page no-scrollbar">
          <div className="page-header">
            <h2 className="page-title"><FaUserFriends className="page-title-icon" />Quản lý nhân khẩu</h2>
            <button className="btn-primary" onClick={() => setIsAddOpen(true)}><FaPlus /> Thêm nhân khẩu</button>
          </div>

          <div className="card filter-card">
            <div className="filter-grid basic-3">
              <div className="filter-input search-box">
                <FaSearch className="search-icon" />
                <input type="text" placeholder="Tìm theo họ tên hoặc CCCD..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {statusFilterOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                {genderOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
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
            <div className="table-header">Danh sách nhân khẩu ({filteredResidents.length} bản ghi)</div>

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
                  {filteredResidents.length === 0 ? (
                    <tr><td colSpan={8} className="empty-row">Không có nhân khẩu phù hợp với bộ lọc hiện tại.</td></tr>
                  ) : (
                    filteredResidents.map(r => {
                      const statusInfo = getResidencyStatusInfo(r.residencyStatusCode)
                      return (
                        <tr key={r.id} className="clickable-row" onClick={() => handleOpenDetail(r, "view")}>
                          <td>{r.fullName}</td>
                          <td>{r.gender}</td>
                          <td>{r.dob}<div className="sub-text">{r.age} tuổi</div></td>
                          <td>{r.cccd}</td>
                          <td>{r.permanentAddress}</td>
                          <td><span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span></td>
                          <td>{r.registeredAt}</td>

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

          <ResidentDetailModal resident={selectedResident} mode={detailMode} onChangeMode={setDetailMode} onClose={handleCloseDetail} onSave={handleSaveResident} />
          <AddResidentModal open={isAddOpen} onClose={() => setIsAddOpen(false)} onCreate={handleCreateResident} />
        </div>
      </div>
    </div>
  )
}
