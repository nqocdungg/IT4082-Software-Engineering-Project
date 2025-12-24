import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { FaPlus, FaTrash, FaTimes } from "react-icons/fa"

import "../../styles/staff/layout.css"
import "../../styles/staff/create-household.css"

const API_BASE = "http://localhost:5000/api"

const emptyPerson = {
  residentCCCD: "",
  fullname: "",
  gender: "M",
  dob: "",
  ethnicity: "",
  religion: "",
  nationality: "Việt Nam",
  hometown: "",
  occupation: "",
  relationToOwner: ""
}

function authHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function CreateHousehold() {
  const navigate = useNavigate()

  const [householdCode, setHouseholdCode] = useState("")
  const [address, setAddress] = useState("")
  const [owner, setOwner] = useState({ ...emptyPerson })
  const [members, setMembers] = useState([])
  const [memberForm, setMemberForm] = useState({ ...emptyPerson })
  const [showMemberForm, setShowMemberForm] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  /* =========================
     PREVIEW HOUSEHOLD CODE
  ========================= */
  useEffect(() => {
    axios
      .get(`${API_BASE}/households/generate-code`, {
        headers: authHeaders()
      })
      .then(res => setHouseholdCode(res.data.code))
      .catch(() => alert("Không lấy được mã hộ khẩu"))
  }, [])

  const updateOwner = (k, v) =>
    setOwner(p => ({ ...p, [k]: v }))

  const updateMember = (k, v) =>
    setMemberForm(p => ({ ...p, [k]: v }))

  const addMember = () => {
    if (!memberForm.fullname || !memberForm.dob) {
      alert("Thành viên cần Họ tên và Ngày sinh")
      return
    }
    setMembers(p => [...p, memberForm])
    setMemberForm({ ...emptyPerson })
    setShowMemberForm(false)
  }

  const removeMember = idx =>
    setMembers(p => p.filter((_, i) => i !== idx))

  const submit = async e => {
    e.preventDefault()
    try {
      await axios.post(
        `${API_BASE}/households`,
        { address, owner, members },
        { headers: authHeaders() }
      )
      alert("Tạo hộ khẩu thành công")
      navigate("/households")
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi tạo hộ khẩu")
    }
  }

  return (
    <div className="page-container">
      <div className="create-household">

        {/* HEADER */}
        <div className="ch-header">
          <h2>Tạo hộ khẩu mới</h2>
          <button type="button" onClick={() => navigate(-1)}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={submit}>

          {/* ================= HỘ KHẨU ================= */}
          <section className="card form-section">
            <div className="section-header">
              <h3>Thông tin hộ khẩu</h3>
              <p>Thông tin chung của hộ gia đình</p>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label>Mã hộ khẩu</label>
                <input
                  className="input-readonly"
                  value={householdCode || "Đang sinh mã..."}
                  readOnly
                />
              </div>

              <div className="form-field">
                <label>Ngày đăng ký</label>
                <input
                  className="input-readonly"
                  value={today}
                  readOnly
                />
              </div>

              <div className="form-field span-2">
                <label>Địa chỉ *</label>
                <textarea
                  className="address-textarea"
                  rows={3}
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* ================= CHỦ HỘ ================= */}
          <section className="card form-section">
            <div className="section-header">
              <h3>Thông tin chủ hộ</h3>
              <p>Điền đầy đủ thông tin cá nhân</p>
            </div>

            <div className="sub-title">Thông tin cơ bản</div>

            <div className="form-grid-2">
              <div className="form-field span-2">
                <label>Họ và tên *</label>
                <input
                  required
                  value={owner.fullname}
                  onChange={e => updateOwner("fullname", e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ"
                />
              </div>

              <div className="form-field">
                <label>Số CCCD</label>
                <input
                  value={owner.residentCCCD}
                  onChange={e => updateOwner("residentCCCD", e.target.value)}
                  placeholder="Nhập số CCCD"
                />
              </div>

              <div className="form-field">
                <label>Ngày sinh *</label>
                <input
                  type="date"
                  required
                  value={owner.dob}
                  onChange={e => updateOwner("dob", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Giới tính *</label>
                <select
                  value={owner.gender}
                  onChange={e => updateOwner("gender", e.target.value)}
                >
                  <option value="M">Nam</option>
                  <option value="F">Nữ</option>
                </select>
              </div>

              <div className="form-field">
                <label>Quốc tịch</label>
                <input
                  value={owner.nationality}
                  onChange={e => updateOwner("nationality", e.target.value)}
                />
              </div>
            </div>

            <div className="sub-title">Thông tin trong hộ khẩu</div>

            <div className="form-grid-2">
              <div className="form-field">
                <label>Nghề nghiệp</label>
                <input
                  onChange={e => updateOwner("occupation", e.target.value)}
                  placeholder="Nhập nghề nghiệp"
                />
              </div>

              <div className="form-field span-2">
                <label>Quê quán</label>
                <input
                  onChange={e => updateOwner("hometown", e.target.value)}
                  placeholder="Nhập quê quán"
                />
              </div>
            </div>
          </section>

          {/* ================= THÀNH VIÊN ================= */}
          <section className="card form-section">
            <div className="member-header">
              <h3>Thành viên khác</h3>
              <button
                type="button"
                onClick={() => setShowMemberForm(v => !v)}
              >
                <FaPlus /> Thêm
              </button>
            </div>

            {showMemberForm && (
              <div className="member-form form-grid-2">
                <div className="form-field span-2">
                  <label>Họ và tên *</label>
                  <input
                    onChange={e =>
                      updateMember("fullname", e.target.value)
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Số CCCD</label>
                  <input
                    onChange={e =>
                      updateMember("residentCCCD", e.target.value)
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Ngày sinh *</label>
                  <input
                    type="date"
                    onChange={e =>
                      updateMember("dob", e.target.value)
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Giới tính</label>
                  <select
                    onChange={e =>
                      updateMember("gender", e.target.value)
                    }
                  >
                    <option value="M">Nam</option>
                    <option value="F">Nữ</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Quan hệ với chủ hộ</label>
                  <input
                    onChange={e =>
                      updateMember("relationToOwner", e.target.value)
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Nghề nghiệp</label>
                  <input
                    onChange={e =>
                      updateMember("occupation", e.target.value)
                    }
                  />
                </div>

                <div className="form-field span-2">
                  <label>Quê quán</label>
                  <input
                    onChange={e =>
                      updateMember("hometown", e.target.value)
                    }
                  />
                </div>

                <div className="member-actions span-2">
                  <button
                    type="button"
                    onClick={() => setShowMemberForm(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="primary"
                    onClick={addMember}
                  >
                    Lưu
                  </button>
                </div>
              </div>
            )}

            <ul className="member-list">
              {members.map((m, i) => (
                <li key={i}>
                  <span>
                    <b>{m.fullname}</b> – {m.relationToOwner}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMember(i)}
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* ================= FOOTER ================= */}
          <div className="form-footer">
            <button type="button" onClick={() => navigate(-1)}>
              Hủy
            </button>
            <button
              type="submit"
              className="primary"
              disabled={!householdCode}
            >
              Lưu hộ khẩu
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CreateHousehold
