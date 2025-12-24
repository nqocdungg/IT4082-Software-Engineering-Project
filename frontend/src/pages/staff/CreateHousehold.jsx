import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { FaTrash, FaTimes, FaUserPlus } from "react-icons/fa"

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
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function CreateHousehold() {
  const navigate = useNavigate()

  const [householdCode, setHouseholdCode] = useState("")
  const [address, setAddress] = useState("")

  const [owner, setOwner] = useState({ ...emptyPerson })
  const [members, setMembers] = useState([])

  const [mode, setMode] = useState("OWNER") // OWNER | MEMBER
  const [personForm, setPersonForm] = useState({ ...emptyPerson })
  const [ownerLocked, setOwnerLocked] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    axios
      .get(`${API_BASE}/households/generate-code`, { headers: authHeaders() })
      .then(res => setHouseholdCode(res.data.code))
      .catch(() => alert("Không lấy được mã hộ khẩu"))
  }, [])

  const residentsPreview = useMemo(() => {
    const list = []
    if (ownerLocked && owner?.fullname) {
      list.push({
        type: "OWNER",
        fullname: owner.fullname,
        gender: owner.gender,
        dob: owner.dob,
        residentCCCD: owner.residentCCCD,
        relationToOwner: "Chủ hộ"
      })
    }
    members.forEach(m => list.push({ type: "MEMBER", ...m }))
    return list
  }, [ownerLocked, owner, members])

  const updateForm = (k, v) => setPersonForm(p => ({ ...p, [k]: v }))
  const updateOwner = (k, v) => setOwner(p => ({ ...p, [k]: v }))

  const confirmOwner = () => {
    const o = { ...owner }
    if (!String(o.fullname || "").trim() || !o.dob) {
      alert("Chủ hộ cần Họ tên và Ngày sinh")
      return
    }
    setOwner({
      ...o,
      residentCCCD: String(o.residentCCCD || "").trim(),
      fullname: String(o.fullname || "").trim()
    })
    setOwnerLocked(true)
    setMode("MEMBER")
    setPersonForm({ ...emptyPerson })
  }

  const addResident = () => {
    const m = { ...personForm }
    if (!String(m.fullname || "").trim() || !m.dob) {
      alert("Thành viên cần Họ tên và Ngày sinh")
      return
    }
    if (!String(m.relationToOwner || "").trim()) {
      alert("Nhập Quan hệ với chủ hộ")
      return
    }

    setMembers(prev => [
      ...prev,
      {
        ...m,
        residentCCCD: String(m.residentCCCD || "").trim(),
        fullname: String(m.fullname || "").trim(),
        relationToOwner: String(m.relationToOwner || "").trim()
      }
    ])
    setPersonForm({ ...emptyPerson })
  }

  const removeMember = idx => setMembers(p => p.filter((_, i) => i !== idx))

  const editOwner = () => {
    setOwnerLocked(false)
    setMode("OWNER")
    setPersonForm({ ...emptyPerson })
  }

  const submit = async e => {
    e.preventDefault()
    if (!ownerLocked) {
      alert("Bạn cần lưu Chủ hộ trước")
      return
    }
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
        <div className="ch-header">
          <h4>Tạo hộ khẩu mới</h4>
          <button type="button" onClick={() => navigate(-1)}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={submit}>
          <section className="card form-section">
            <div className="section-header">
              <h4>Thông tin hộ khẩu</h4>
            </div>

            <div className="form-grid grid-household">
              <div className="form-field">
                <label>Mã hộ khẩu</label>
                <input className="input-readonly" value={householdCode || "Đang sinh mã..."} readOnly />
              </div>

              <div className="form-field">
                <label>Ngày đăng ký</label>
                <input className="input-readonly" value={today} readOnly />
              </div>

              <div className="form-field span-3">
                <label>Địa chỉ *</label>
                <textarea
                  rows={3}
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Nhập địa chỉ đầy đủ..."
                />
              </div>
            </div>

            <div className="household-residents">
              <div className="residents-head">
                <h4>Danh sách dân cư trong hộ</h4>
                {!ownerLocked && <div className="residents-hint">Lưu chủ hộ để bắt đầu thêm thành viên</div>}
              </div>

              <ul className="resident-list">
                {residentsPreview.length === 0 ? (
                  <li className="resident-empty">Chưa có thông tin dân cư</li>
                ) : (
                  residentsPreview.map((r, idx) => (
                    <li key={idx} className={`resident-item ${r.type === "OWNER" ? "owner" : ""}`}>
                      <div className="resident-left">
                        <div className="resident-name">
                          {r.fullname} {r.type === "OWNER" && <span>(Chủ hộ)</span>}
                        </div>
                        <div className="resident-meta">
                          {r.gender === "M" ? "Nam" : "Nữ"} • {r.relationToOwner || "Thành viên"} •{" "}
                          {r.residentCCCD || "—"}
                        </div>
                      </div>

                      {r.type !== "OWNER" && (
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => removeMember(idx - 1)}
                          title="Xóa"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>

          <section className="card form-section">
            <div className="section-header section-row">
              <div>
                <h4>{mode === "OWNER" ? "Thông tin chủ hộ" : "Thêm thành viên"}</h4>
              </div>

              {ownerLocked && (
                <button type="button" className="btn-outline" onClick={editOwner}>
                  Sửa chủ hộ
                </button>
              )}
            </div>

            {mode === "OWNER" ? (
              <>
                <div className="form-grid grid-person">
                  <div className="form-field span-2">
                    <label>Họ và tên</label>
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
                    <label>Ngày sinh</label>
                    <input type="date" required value={owner.dob} onChange={e => updateOwner("dob", e.target.value)} />
                  </div>

                  <div className="form-field">
                    <label>Giới tính</label>
                    <select value={owner.gender} onChange={e => updateOwner("gender", e.target.value)}>
                      <option value="M">Nam</option>
                      <option value="F">Nữ</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Quốc tịch</label>
                    <input value={owner.nationality} onChange={e => updateOwner("nationality", e.target.value)} />
                  </div>

                  <div className="form-field">
                    <label>Nghề nghiệp</label>
                    <input value={owner.occupation} onChange={e => updateOwner("occupation", e.target.value)} />
                  </div>

                  <div className="form-field span-2">
                    <label>Quê quán</label>
                    <input value={owner.hometown} onChange={e => updateOwner("hometown", e.target.value)} />
                  </div>
                </div>

                <div className="actions-row">
                  <button type="button" className="btn-primary" onClick={confirmOwner}>
                    <FaUserPlus /> Lưu chủ hộ
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="form-grid grid-person">
                  <div className="form-field span-2">
                    <label>Họ và tên</label>
                    <input
                      value={personForm.fullname}
                      onChange={e => updateForm("fullname", e.target.value)}
                      placeholder="Nhập họ và tên đầy đủ"
                    />
                  </div>

                  <div className="form-field">
                    <label>Số CCCD</label>
                    <input
                      value={personForm.residentCCCD}
                      onChange={e => updateForm("residentCCCD", e.target.value)}
                      placeholder="Nhập số CCCD"
                    />
                  </div>

                  <div className="form-field">
                    <label>Ngày sinh</label>
                    <input type="date" value={personForm.dob} onChange={e => updateForm("dob", e.target.value)} />
                  </div>

                  <div className="form-field">
                    <label>Giới tính</label>
                    <select value={personForm.gender} onChange={e => updateForm("gender", e.target.value)}>
                      <option value="M">Nam</option>
                      <option value="F">Nữ</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Quan hệ với chủ hộ *</label>
                    <input
                      value={personForm.relationToOwner}
                      onChange={e => updateForm("relationToOwner", e.target.value)}
                      placeholder="VD: Vợ, Con, Ông, Bà..."
                    />
                  </div>

                  <div className="form-field">
                    <label>Nghề nghiệp</label>
                    <input value={personForm.occupation} onChange={e => updateForm("occupation", e.target.value)} />
                  </div>

                  <div className="form-field span-2">
                    <label>Quê quán</label>
                    <input value={personForm.hometown} onChange={e => updateForm("hometown", e.target.value)} />
                  </div>
                </div>

                <div className="actions-row">
                  <button type="button" className="btn-primary" onClick={addResident}>
                    <FaUserPlus /> Thêm thành viên
                  </button>
                </div>
              </>
            )}
          </section>

          <div className="form-footer">
            <button type="button" onClick={() => navigate(-1)}>
              Hủy
            </button>
            <button type="submit" className="primary" disabled={!householdCode}>
              Lưu hộ khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateHousehold
