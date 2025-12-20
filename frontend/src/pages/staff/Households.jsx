import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import {
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaUsers,
  FaUserCheck,
  FaPlus,
  FaTrash
} from "react-icons/fa"
import { HiOutlineLogin, HiOutlineLogout } from "react-icons/hi"

import "../../styles/staff/households.css"
import "../../styles/staff/residents.css"
import "../../styles/staff/layout.css"

const API_BASE = "http://localhost:5000/api"

const HOUSEHOLD_STATUS_MAP = {
  0: { label: "Đang hoạt động", className: "status-hk-thuong_tru" },
  1: { label: "Tạm trú", className: "status-hk-tam_tru" },
  2: { label: "Đã chuyển đi", className: "status-hk-da_chuyen_di" }
}

function getHouseholdStatusInfo(code) {
  return HOUSEHOLD_STATUS_MAP[Number(code)] || { label: "Không rõ", className: "" }
}

function authHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const emptyOwnerForm = {
  residentCCCD: "",
  fullname: "",
  dob: "",
  gender: "M",
  ethnicity: "",
  religion: "",
  nationality: "",
  hometown: "",
  occupation: ""
}

const emptyHouseholdForm = {
  householdCode: "",
  address: "",
  owner: emptyOwnerForm
}

const emptyMemberForm = {
  residentCCCD: "",
  fullname: "",
  dob: "",
  gender: "M",
  ethnicity: "",
  religion: "",
  nationality: "",
  hometown: "",
  occupation: "",
  relationToOwner: ""
}

function AddMemberModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState(emptyMemberForm)

  useEffect(() => {
    if (open) setForm(emptyMemberForm)
  }, [open])

  if (!open) return null

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.fullname.trim() || !form.dob) {
      alert("Nhân khẩu cần có Họ tên và Ngày sinh.")
      return
    }

    onAdd({
      residentCCCD: form.residentCCCD.trim(),
      fullname: form.fullname.trim(),
      dob: form.dob,
      gender: form.gender,
      ethnicity: form.ethnicity.trim(),
      religion: form.religion.trim(),
      nationality: form.nationality.trim(),
      hometown: form.hometown.trim(),
      occupation: form.occupation.trim(),
      relationToOwner: form.relationToOwner.trim()
    })
    onClose()
  }

  return (
    <div className="resident-modal-overlay" onClick={onClose}>
      <div className="resident-modal" onClick={e => e.stopPropagation()}>
        <div className="resident-modal-header">
          <div>
            <p className="resident-modal-label">Thêm nhân khẩu</p>
            <h3 className="resident-modal-title">Nhân khẩu mới</h3>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            <FaTimes size={14} />
          </button>
        </div>

        <form className="resident-modal-body" onSubmit={handleSubmit}>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">Họ và tên *</div>
              <div className="detail-value">
                <input
                  required
                  value={form.fullname}
                  onChange={e => setField("fullname", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">CCCD</div>
              <div className="detail-value">
                <input
                  value={form.residentCCCD}
                  onChange={e => setField("residentCCCD", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Ngày sinh *</div>
              <div className="detail-value">
                <input
                  type="date"
                  required
                  value={form.dob}
                  onChange={e => setField("dob", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Giới tính</div>
              <div className="detail-value">
                <select value={form.gender} onChange={e => setField("gender", e.target.value)}>
                  <option value="M">Nam</option>
                  <option value="F">Nữ</option>
                </select>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Dân tộc</div>
              <div className="detail-value">
                <input
                  value={form.ethnicity}
                  onChange={e => setField("ethnicity", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Tôn giáo</div>
              <div className="detail-value">
                <input
                  value={form.religion}
                  onChange={e => setField("religion", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Quốc tịch</div>
              <div className="detail-value">
                <input
                  value={form.nationality}
                  onChange={e => setField("nationality", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Quê quán</div>
              <div className="detail-value">
                <input
                  value={form.hometown}
                  onChange={e => setField("hometown", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Nghề nghiệp</div>
              <div className="detail-value">
                <input
                  value={form.occupation}
                  onChange={e => setField("occupation", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Quan hệ với chủ hộ</div>
              <div className="detail-value">
                <input
                  value={form.relationToOwner}
                  onChange={e => setField("relationToOwner", e.target.value)}
                  placeholder="VD: Vợ, Con, Ông, Bà..."
                />
              </div>
            </div>
          </div>

          <div className="resident-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-danger">
              Thêm nhân khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateHouseholdModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(emptyHouseholdForm)
  const [members, setMembers] = useState([])
  const [addMemberOpen, setAddMemberOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(emptyHouseholdForm)
      setMembers([])
      setAddMemberOpen(false)
    }
  }, [open])

  if (!open) return null

  const setHouseholdField = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const setOwnerField = (k, v) =>
    setForm(prev => ({ ...prev, owner: { ...prev.owner, [k]: v } }))

  const removeMember = idx => setMembers(prev => prev.filter((_, i) => i !== idx))

  const addMember = m => {
    setMembers(prev => [...prev, m])
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!form.householdCode.trim() || !form.address.trim()) {
      alert("Thiếu mã hộ khẩu hoặc địa chỉ.")
      return
    }
    if (!form.owner.fullname.trim() || !form.owner.dob) {
      alert("Chủ hộ cần có Họ tên và Ngày sinh.")
      return
    }

    const payload = {
      householdCode: form.householdCode.trim(),
      address: form.address.trim(),
      owner: {
        residentCCCD: form.owner.residentCCCD.trim(),
        fullname: form.owner.fullname.trim(),
        dob: form.owner.dob,
        gender: form.owner.gender,
        ethnicity: form.owner.ethnicity.trim(),
        religion: form.owner.religion.trim(),
        nationality: form.owner.nationality.trim(),
        hometown: form.owner.hometown.trim(),
        occupation: form.owner.occupation.trim()
      },
      members: members.map(m => ({
        residentCCCD: (m.residentCCCD || "").trim(),
        fullname: (m.fullname || "").trim(),
        dob: m.dob,
        gender: m.gender || "M",
        ethnicity: (m.ethnicity || "").trim(),
        religion: (m.religion || "").trim(),
        nationality: (m.nationality || "").trim(),
        hometown: (m.hometown || "").trim(),
        occupation: (m.occupation || "").trim(),
        relationToOwner: (m.relationToOwner || "").trim()
      }))
    }

    await onCreate(payload)
    onClose()
  }

  return (
    <div className="resident-modal-overlay" onClick={onClose}>
      <div className="resident-modal" onClick={e => e.stopPropagation()}>
        <div className="resident-modal-header">
          <div>
            <p className="resident-modal-label">Tạo hộ khẩu</p>
            <h3 className="resident-modal-title">Hộ khẩu mới</h3>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            <FaTimes size={14} />
          </button>
        </div>

        <form className="resident-modal-body" onSubmit={handleSubmit}>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">Mã hộ khẩu *</div>
              <div className="detail-value">
                <input
                  required
                  value={form.householdCode}
                  onChange={e => setHouseholdField("householdCode", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Địa chỉ *</div>
              <div className="detail-value">
                <input
                  required
                  value={form.address}
                  onChange={e => setHouseholdField("address", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Họ tên chủ hộ *</div>
              <div className="detail-value">
                <input
                  required
                  value={form.owner.fullname}
                  onChange={e => setOwnerField("fullname", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">CCCD chủ hộ</div>
              <div className="detail-value">
                <input
                  value={form.owner.residentCCCD}
                  onChange={e => setOwnerField("residentCCCD", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Ngày sinh chủ hộ *</div>
              <div className="detail-value">
                <input
                  type="date"
                  required
                  value={form.owner.dob}
                  onChange={e => setOwnerField("dob", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Giới tính chủ hộ</div>
              <div className="detail-value">
                <select
                  value={form.owner.gender}
                  onChange={e => setOwnerField("gender", e.target.value)}
                >
                  <option value="M">Nam</option>
                  <option value="F">Nữ</option>
                </select>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Dân tộc</div>
              <div className="detail-value">
                <input
                  value={form.owner.ethnicity}
                  onChange={e => setOwnerField("ethnicity", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Tôn giáo</div>
              <div className="detail-value">
                <input
                  value={form.owner.religion}
                  onChange={e => setOwnerField("religion", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Quốc tịch</div>
              <div className="detail-value">
                <input
                  value={form.owner.nationality}
                  onChange={e => setOwnerField("nationality", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Quê quán</div>
              <div className="detail-value">
                <input
                  value={form.owner.hometown}
                  onChange={e => setOwnerField("hometown", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Nghề nghiệp</div>
              <div className="detail-value">
                <input
                  value={form.owner.occupation}
                  onChange={e => setOwnerField("occupation", e.target.value)}
                />
              </div>
            </div>

            <div className="detail-item detail-wide">
              <div className="detail-label">Danh sách nhân khẩu trong hộ</div>
              <div className="detail-value">
                <button
                  type="button"
                  className="btn-mini-add"
                  onClick={() => setAddMemberOpen(true)}
                >
                  <FaPlus /> Thêm nhân khẩu
                </button>

                {members.length > 0 ? (
                  <ul className="member-list" style={{ marginTop: 10 }}>
                    {members.map((m, idx) => (
                      <li key={idx} className="member-item">
                        <div className="member-name">{m.fullname}</div>
                        <div className="member-meta">
                          {(m.gender === "M" ? "Nam" : "Nữ") +
                            " • " +
                            (m.relationToOwner || "Thành viên") +
                            " • " +
                            (m.residentCCCD || "—") +
                            " • " +
                            String(m.dob).slice(0, 10)}
                        </div>
                        <button
                          type="button"
                          className="member-remove"
                          onClick={() => removeMember(idx)}
                          title="Xóa khỏi danh sách"
                        >
                          <FaTrash />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="sub-text" style={{ marginTop: 8 }}>
                    Chưa có nhân khẩu nào (ngoài chủ hộ).
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="resident-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-danger">
              Tạo hộ khẩu
            </button>
          </div>
        </form>

        <AddMemberModal
          open={addMemberOpen}
          onClose={() => setAddMemberOpen(false)}
          onAdd={addMember}
        />
      </div>
    </div>
  )
}

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  const [createOpen, setCreateOpen] = useState(false)

  const [viewHousehold, setViewHousehold] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [editHousehold, setEditHousehold] = useState(null)
  const [editStatus, setEditStatus] = useState("1")

  useEffect(() => {
    fetchHouseholds()
  }, [])

  async function fetchHouseholds() {
    try {
      const res = await axios.get(`${API_BASE}/households`, { headers: authHeaders() })
      setHouseholds(res.data.data || [])
    } catch (err) {
      console.error(err)
      alert("Không tải được danh sách hộ khẩu")
    } finally {
      setLoading(false)
    }
  }

  const filteredHouseholds = useMemo(() => {
    let data = [...households]

    if (search.trim()) {
      const s = search.toLowerCase()
      data = data.filter(h => {
        const ownerName = (h.owner?.fullname || "").toLowerCase()
        const ownerCCCD = (h.owner?.residentCCCD || "").toLowerCase()
        const addr = (h.address || "").toLowerCase()
        const code = (h.householdCode || "").toLowerCase()
        return ownerName.includes(s) || ownerCCCD.includes(s) || addr.includes(s) || code.includes(s)
      })
    }

    if (statusFilter !== "ALL") {
      data = data.filter(h => String(h.status) === String(statusFilter))
    }

    return data
  }, [households, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredHouseholds.length / rowsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1)
  }, [totalPages, currentPage])

  const pageHouseholds = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredHouseholds.slice(start, start + rowsPerPage)
  }, [filteredHouseholds, currentPage, rowsPerPage])

  const rangeText = useMemo(() => {
    const total = filteredHouseholds.length
    if (total === 0) return `0 - 0 trên tổng số 0 bản ghi`
    const start = (currentPage - 1) * rowsPerPage + 1
    const end = Math.min(currentPage * rowsPerPage, total)
    return `${start} - ${end} trên tổng số ${total} bản ghi`
  }, [filteredHouseholds.length, currentPage, rowsPerPage])

  const stats = useMemo(() => {
    const total = households.length
    const count = code => households.filter(h => Number(h.status) === Number(code)).length
    return {
      total,
      active: count(0),
      tamTru: count(1),
      daChuyenDi: count(2)
    }
  }, [households])

  const miniCards = [
    { label: "Tất cả", value: stats.total, icon: <FaUsers />, tone: "blue" },
    { label: "Đang hoạt động", value: stats.active, icon: <FaUserCheck />, tone: "green" },
    { label: "Tạm trú", value: stats.tamTru, icon: <HiOutlineLogin />, tone: "amber" },
    { label: "Đã chuyển đi", value: stats.daChuyenDi, icon: <HiOutlineLogout />, tone: "rose" },
    {
      label: "Thêm hộ khẩu",
      value: null,
      icon: <FaPlus />,
      tone: "slate",
      onClick: () => setCreateOpen(true)
    }
  ]

  const handleCreateHousehold = async payload => {
    try {
      await axios.post(`${API_BASE}/households`, payload, { headers: authHeaders() })
      await fetchHouseholds()
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.message || "Không thể tạo hộ khẩu!")
    }
  }

  const closeDetail = () => setViewHousehold(null)

  const handleOpenDetail = async household => {
    setViewHousehold(household)
    setLoadingDetail(true)
    try {
      const res = await axios.get(`${API_BASE}/households/${household.id}`, { headers: authHeaders() })
      setViewHousehold(res.data.data)
    } catch (err) {
      console.error(err)
      alert("Không tải được chi tiết hộ khẩu")
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleOpenEdit = household => {
    setEditHousehold(household)
    setEditStatus(String(household.status ?? "1"))
  }

  const handleCloseEdit = () => setEditHousehold(null)

  const handleUpdateStatus = async e => {
    e.preventDefault()
    if (!editHousehold) return
    try {
      const res = await axios.put(
        `${API_BASE}/households/${editHousehold.id}/status`,
        { status: Number(editStatus) },
        { headers: authHeaders() }
      )
      const updated = res.data.data
      setHouseholds(prev => prev.map(h => (h.id === updated.id ? { ...h, status: updated.status } : h)))
      setViewHousehold(prev => (prev?.id === updated.id ? { ...prev, status: updated.status } : prev))
      setEditHousehold(null)
    } catch (err) {
      console.error(err)
      alert("Không thể cập nhật trạng thái hộ khẩu")
    }
  }

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>

  return (
    <div className="page-container households-page">
      <div className="stats-strip">
        {miniCards.map(c => (
          <div
            key={c.label}
            className={`mini-card tone-${c.tone}`}
            style={c.onClick ? { cursor: "pointer" } : undefined}
            onClick={c.onClick || undefined}
          >
            <div className="mini-ico">{c.icon}</div>
            <div className="mini-meta">
              {"value" in c && (
                <div className="mini-value">{c.value}</div>
              )}
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
                  <option value="ALL">Tất cả trạng thái hộ khẩu</option>
                  <option value="0">Đang hoạt động</option>
                  <option value="1">Tạm trú</option>
                  <option value="2">Đã chuyển đi</option>
                </select>
              </div>
            </div>

            <div className="toolbar-right">
              <div className="toolbar-search">
                <FaSearch className="search-icon" />
                <input
                  placeholder="Tìm chủ hộ, CCCD, mã hộ khẩu, địa chỉ..."
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
          <table className="household-table">
            <thead>
              <tr>
                <th>Mã hộ khẩu</th>
                <th>Chủ hộ</th>
                <th>Địa chỉ</th>
                <th>Số nhân khẩu</th>
                <th>Trạng thái</th>
                <th style={{ width: 110 }}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {pageHouseholds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-row">
                    Không có hộ khẩu phù hợp.
                  </td>
                </tr>
              ) : (
                pageHouseholds.map(h => {
                  const statusInfo = getHouseholdStatusInfo(h.status)
                  const ownerName = h.owner?.fullname || "Không rõ"
                  const membersCount = h.residents?.length ?? 0

                  return (
                    <tr key={h.id} className="clickable-row" onClick={() => handleOpenDetail(h)}>
                      <td>{h.householdCode || `HK #${h.id}`}</td>
                      <td>{ownerName}</td>
                      <td>{h.address}</td>
                      <td>{membersCount}</td>
                      <td>
                        <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>
                      </td>

                      <td onClick={e => e.stopPropagation()}>
                        <div className="row-actions">
                          <button type="button" title="Xem" onClick={() => handleOpenDetail(h)}>
                            <FaEye />
                          </button>
                          <button type="button" title="Đổi trạng thái" onClick={() => handleOpenEdit(h)}>
                            <FaUserCheck />
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
            </select>
          </div>

          <div className="footer-right">
            <span className="footer-muted">{rangeText}</span>
            <div className="pager">
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

      <CreateHouseholdModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateHousehold} />

      {viewHousehold && (
        <div className="resident-modal-overlay" onClick={closeDetail}>
          <div className="resident-modal" onClick={e => e.stopPropagation()}>
            <div className="resident-modal-header">
              <div>
                <h3 className="resident-modal-title">Chi tiết hộ khẩu</h3>
                <p className="resident-modal-sub">ID: #{viewHousehold.id}</p>
              </div>
              <button className="modal-close-btn" type="button" onClick={closeDetail}>
                <FaTimes size={14} />
              </button>
            </div>

            <div className="resident-modal-body">
              {loadingDetail ? (
                <div className="empty-row">Đang tải chi tiết...</div>
              ) : (
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Mã hộ khẩu</div>
                    <div className="detail-value">{viewHousehold.householdCode || `HK #${viewHousehold.id}`}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Trạng thái</div>
                    <div className="detail-value">
                      <span className={`status-badge ${getHouseholdStatusInfo(viewHousehold.status).className}`}>
                        {getHouseholdStatusInfo(viewHousehold.status).label}
                      </span>
                    </div>
                  </div>

                  <div className="detail-item detail-wide">
                    <div className="detail-label">Địa chỉ</div>
                    <div className="detail-value">{viewHousehold.address}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">Chủ hộ</div>
                    <div className="detail-value">{viewHousehold.owner?.fullname || "Không rõ"}</div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">CCCD chủ hộ</div>
                    <div className="detail-value">{viewHousehold.owner?.residentCCCD || "—"}</div>
                  </div>

                  <div className="detail-item detail-wide">
                    <div className="detail-label">Danh sách nhân khẩu</div>
                    <div className="detail-value">
                      {viewHousehold.residents?.length ? (
                        <ul className="member-list">
                          {viewHousehold.residents.map(r => (
                            <li className="member-item" key={r.id}>
                              <div className="member-name">{r.fullname}</div>
                              <div className="member-meta">
                                {r.gender === "M" ? "Nam" : "Nữ"} • {r.relationToOwner || "Thành viên"} •{" "}
                                {r.residentCCCD || "—"}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="sub-text">Chưa có nhân khẩu trong hộ.</div>
                      )}
                    </div>
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

      {editHousehold && (
        <div className="resident-modal-overlay" onClick={handleCloseEdit}>
          <div className="resident-modal" onClick={e => e.stopPropagation()}>
            <div className="resident-modal-header">
              <div>
                <h3 className="resident-modal-title">Đổi trạng thái hộ khẩu</h3>
                <p className="resident-modal-sub">
                  {editHousehold.householdCode || `HK #${editHousehold.id}`} • {editHousehold.address}
                </p>
              </div>
              <button className="modal-close-btn" type="button" onClick={handleCloseEdit}>
                <FaTimes size={14} />
              </button>
            </div>

            <form className="resident-modal-body" onSubmit={handleUpdateStatus}>
              <div className="detail-grid">
                <div className="detail-item detail-wide">
                  <div className="detail-label">Trạng thái</div>
                  <div className="detail-value">
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                      <option value="0">Đang hoạt động</option>
                      <option value="1">Tạm trú</option>
                      <option value="2">Đã chuyển đi</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="resident-modal-footer">
                <button className="btn-secondary" type="button" onClick={handleCloseEdit}>
                  Hủy
                </button>
                <button className="btn-danger" type="submit">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
