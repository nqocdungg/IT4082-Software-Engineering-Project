import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { FaTimes, FaPlus, FaTrash } from "react-icons/fa"

import "../../styles/staff/layout.css"
import "../../styles/staff/create-household.css"

const API_BASE = "http://localhost:5000/api"

function authHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const emptyOwnerForm = {
  residentCCCD: "",
  fullname: "",
  dob: "",
  gender: "M"
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
  relationToOwner: ""
}

function CreateHousehold() {
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyHouseholdForm)
  const [members, setMembers] = useState([])
  const [memberForm, setMemberForm] = useState(emptyMemberForm)
  const [showMemberForm, setShowMemberForm] = useState(false)

  const setHouseholdField = (k, v) =>
    setForm(p => ({ ...p, [k]: v }))

  const setOwnerField = (k, v) =>
    setForm(p => ({ ...p, owner: { ...p.owner, [k]: v } }))

  const setMemberField = (k, v) =>
    setMemberForm(p => ({ ...p, [k]: v }))

  const addMember = () => {
    if (!memberForm.fullname.trim() || !memberForm.dob) {
      alert("Thành viên cần có Họ tên và Ngày sinh.")
      return
    }
    setMembers(p => [...p, memberForm])
    setMemberForm(emptyMemberForm)
    setShowMemberForm(false)
  }

  const removeMember = idx =>
    setMembers(p => p.filter((_, i) => i !== idx))

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const payload = {
        householdCode: form.householdCode.trim(),
        address: form.address.trim(),
        owner: form.owner,
        members
      }
      await axios.post(`${API_BASE}/households`, payload, {
        headers: authHeaders()
      })
      alert("Tạo hộ khẩu thành công!")
      navigate("/households")
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi tạo hộ khẩu")
    }
  }

  return (
    <div className="page-container">
      <div className="card create-household-card">

        {/* HEADER */}
        <div className="page-header">
          <h2>Thêm Hộ Khẩu Mới</h2>
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <FaTimes />
          </button>
        </div>

        <form className="page-body" onSubmit={handleSubmit}>
          {/* ===== HỘ KHẨU ===== */}
          <div className="form-grid">
            <div className="form-item">
              <label>Mã hộ khẩu *</label>
              <input
                required
                value={form.householdCode}
                onChange={e => setHouseholdField("householdCode", e.target.value)}
              />
            </div>

            <div className="form-item full">
              <label>Địa chỉ *</label>
              <input
                required
                value={form.address}
                onChange={e => setHouseholdField("address", e.target.value)}
              />
            </div>

            <div className="form-item">
              <label>Họ tên chủ hộ *</label>
              <input
                required
                value={form.owner.fullname}
                onChange={e => setOwnerField("fullname", e.target.value)}
              />
            </div>

            <div className="form-item">
              <label>CCCD chủ hộ</label>
              <input
                value={form.owner.residentCCCD}
                onChange={e => setOwnerField("residentCCCD", e.target.value)}
              />
            </div>

            <div className="form-item">
              <label>Ngày sinh *</label>
              <input
                type="date"
                required
                value={form.owner.dob}
                onChange={e => setOwnerField("dob", e.target.value)}
              />
            </div>

            <div className="form-item">
              <label>Giới tính</label>
              <select
                value={form.owner.gender}
                onChange={e => setOwnerField("gender", e.target.value)}
              >
                <option value="M">Nam</option>
                <option value="F">Nữ</option>
              </select>
            </div>
          </div>

          {/* ===== THÀNH VIÊN ===== */}
          <div className="member-section">
            <div className="member-header">
              <h3>Thành viên khác</h3>
              <button
                type="button"
                className="btn-add"
                onClick={() => setShowMemberForm(v => !v)}
              >
                <FaPlus /> Thêm
              </button>
            </div>

            {showMemberForm && (
              <div className="member-form">
                <input
                  placeholder="Họ tên *"
                  value={memberForm.fullname}
                  onChange={e => setMemberField("fullname", e.target.value)}
                />
                <input
                  placeholder="CCCD"
                  value={memberForm.residentCCCD}
                  onChange={e => setMemberField("residentCCCD", e.target.value)}
                />
                <input
                  type="date"
                  value={memberForm.dob}
                  onChange={e => setMemberField("dob", e.target.value)}
                />
                <select
                  value={memberForm.gender}
                  onChange={e => setMemberField("gender", e.target.value)}
                >
                  <option value="M">Nam</option>
                  <option value="F">Nữ</option>
                </select>
                <input
                  placeholder="Quan hệ với chủ hộ"
                  value={memberForm.relationToOwner}
                  onChange={e => setMemberField("relationToOwner", e.target.value)}
                />

                <div className="member-form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowMemberForm(false)}>
                    Hủy
                  </button>
                  <button type="button" className="btn-primary" onClick={addMember}>
                    Lưu thành viên
                  </button>
                </div>
              </div>
            )}

            <ul className="member-list">
              {members.map((m, idx) => (
                <li key={idx}>
                  <span>
                    <strong>{m.fullname}</strong> – {m.relationToOwner}
                  </span>
                  <button type="button" onClick={() => removeMember(idx)}>
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ===== FOOTER ===== */}
          <div className="page-footer">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Lưu hộ khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateHousehold
