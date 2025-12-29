import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { FaPlus, FaArrowLeft } from "react-icons/fa"
import { useNavigate } from "react-router-dom"

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

function isValidCccd(raw) {
  const s = String(raw || "").trim()
  if (!s) return true
  if (!/^\d+$/.test(s)) return false
  return s.length === 12
}

async function tryGet(url, params) {
  const res = await axios.get(url, { headers: authHeaders(), params })
  return res.data?.data
}

async function searchResidents(keyword) {
  const k = String(keyword || "").trim()
  if (!k) return []

  const candidates = [
    { url: `${API_BASE}/residents/search`, params: { q: k } },
    { url: `${API_BASE}/residents/search`, params: { search: k } },
    { url: `${API_BASE}/residents`, params: { q: k } },
    { url: `${API_BASE}/residents`, params: { search: k } },
    { url: `${API_BASE}/staff/residents/search`, params: { q: k } },
    { url: `${API_BASE}/staff/residents/search`, params: { search: k } },
    { url: `${API_BASE}/staff/residents`, params: { q: k } },
    { url: `${API_BASE}/staff/residents`, params: { search: k } }
  ]

  for (const c of candidates) {
    try {
      const data = await tryGet(c.url, c.params)
      if (!data) continue
      const arr = Array.isArray(data) ? data : data.data ? data.data : [data]
      if (Array.isArray(arr) && arr.length > 0) return arr
    } catch {}
  }
  return []
}

async function searchHouseholds(keyword) {
  const k = String(keyword || "").trim()
  if (!k) return []

  const candidates = [
    { url: `${API_BASE}/households/search`, params: { q: k } },
    { url: `${API_BASE}/households/search`, params: { search: k } },
    { url: `${API_BASE}/households`, params: { q: k } },
    { url: `${API_BASE}/households`, params: { search: k } },
    { url: `${API_BASE}/staff/households/search`, params: { q: k } },
    { url: `${API_BASE}/staff/households/search`, params: { search: k } },
    { url: `${API_BASE}/staff/households`, params: { q: k } },
    { url: `${API_BASE}/staff/households`, params: { search: k } }
  ]

  for (const c of candidates) {
    try {
      const data = await tryGet(c.url, c.params)
      if (!data) continue
      const arr = Array.isArray(data) ? data : data.data ? data.data : [data]
      if (Array.isArray(arr) && arr.length > 0) return arr
    } catch {}
  }
  return []
}

async function getResidentDetail(id) {
  const rid = Number(id)
  if (!rid || Number.isNaN(rid)) return null

  const candidates = [`${API_BASE}/residents/${rid}`, `${API_BASE}/staff/residents/${rid}`]

  for (const url of candidates) {
    try {
      const res = await axios.get(url, { headers: authHeaders() })
      const data = res.data?.data
      if (data) return data
    } catch {}
  }
  return null
}

export default function ResidentChangeCreate() {
  const navigate = useNavigate()

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
    extra_occupation: "",
    extra_householdId: "",
    extra_relationToOwner: ""
  })

  const [residentSearch, setResidentSearch] = useState("")
  const [residentResult, setResidentResult] = useState(null)
  const [residentOptions, setResidentOptions] = useState([])
  const [showResidentSuggest, setShowResidentSuggest] = useState(false)
  const debouncedResidentSearch = useDebouncedValue(residentSearch, 250)

  const [householdSearch, setHouseholdSearch] = useState("")
  const [householdOptions, setHouseholdOptions] = useState([])
  const [selectedHousehold, setSelectedHousehold] = useState(null)
  const [showHouseholdSuggest, setShowHouseholdSuggest] = useState(false)
  const debouncedHouseholdSearch = useDebouncedValue(householdSearch, 250)

  const ctNum = Number(createForm.changeType)
  const CREATE_RESIDENT_TYPES = [0, 1, 3]
  const USE_RESIDENT_TYPES = [2, 4, 7]
  const HOUSEHOLD_OP_TYPES = [5, 6]

  const isCreateResident = CREATE_RESIDENT_TYPES.includes(ctNum)
  const isUseResident = USE_RESIDENT_TYPES.includes(ctNum)
  const isHouseholdOp = HOUSEHOLD_OP_TYPES.includes(ctNum)

  const isTempStay = ctNum === 1

  const [splitMembers, setSplitMembers] = useState([])
  const [newOwnerId, setNewOwnerId] = useState(null)
  const [householdMembers, setHouseholdMembers] = useState([])

  const [autoFromLocked, setAutoFromLocked] = useState(false)

  const onCreateField = (key, val) => setCreateForm(prev => ({ ...prev, [key]: val }))

  useEffect(() => {
    let alive = true
    const k = String(debouncedResidentSearch || "").trim()
    if (!k) {
      setResidentOptions([])
      return
    }

    searchResidents(k).then(list => {
      if (!alive) return
      setResidentOptions(Array.isArray(list) ? list : [])
    })

    return () => {
      alive = false
    }
  }, [debouncedResidentSearch])

  useEffect(() => {
    let alive = true
    const k = String(debouncedHouseholdSearch || "").trim()
    if (!k) {
      setHouseholdOptions([])
      return
    }

    searchHouseholds(k).then(list => {
      if (!alive) return
      setHouseholdOptions(Array.isArray(list) ? list : [])
    })

    return () => {
      alive = false
    }
  }, [debouncedHouseholdSearch])

  useEffect(() => {
    setResidentSearch("")
    setResidentResult(null)
    setResidentOptions([])
    setShowResidentSuggest(false)
    onCreateField("residentId", "")

    setHouseholdSearch("")
    setSelectedHousehold(null)
    setHouseholdOptions([])
    setShowHouseholdSuggest(false)
    onCreateField("extra_householdId", "")

    setSplitMembers([])
    setNewOwnerId(null)
    setHouseholdMembers([])

    setAutoFromLocked(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createForm.changeType])

  useEffect(() => {
    if (![5, 6].includes(ctNum)) return
    if (!selectedHousehold?.id) return

    axios
      .get(`${API_BASE}/households/${selectedHousehold.id}/members`, { headers: authHeaders() })
      .then(res => {
        const list = res.data?.data || []
        setHouseholdMembers(list)
        setSplitMembers([])
        setNewOwnerId(null)
      })
      .catch(() => {
        setHouseholdMembers([])
        setSplitMembers([])
        setNewOwnerId(null)
      })
  }, [ctNum, selectedHousehold])

  const fromPlaceholder = useMemo(() => {
    if (ctNum === 3) return "Nơi ở trước khi chuyển đến"
    if (ctNum === 2) return "Địa chỉ hiện tại (tự điền khi chọn nhân khẩu)"
    if (ctNum === 4) return "Địa chỉ hiện tại (tự điền khi chọn nhân khẩu)"
    if (ctNum === 7) return "Địa chỉ hiện tại (tự điền khi chọn nhân khẩu)"
    return "Từ địa chỉ"
  }, [ctNum])

  const toPlaceholder = useMemo(() => {
    if (ctNum === 0) return "Địa chỉ hộ khai sinh (tự điền khi chọn hộ)"
    if (ctNum === 1) return "Địa chỉ tạm trú (tự điền khi chọn hộ / hoặc nhập tay)"
    if (ctNum === 2) return "Nơi đến (tạm vắng)"
    if (ctNum === 3) return "Địa chỉ chuyển đến (tự điền khi chọn hộ)"
    if (ctNum === 4) return "Nơi chuyển đi"
    return "Đến địa chỉ"
  }, [ctNum])

  const toReadOnly = useMemo(() => {
    // m muốn 0/1/3 chọn hộ là auto-fill TO
    if ([0, 1, 3].includes(ctNum)) return !!String(selectedHousehold?.address || "").trim()
    return false
  }, [ctNum, selectedHousehold?.address])

  const fromReadOnly = useMemo(() => {
    // m muốn 2/4/7 chọn nhân khẩu là auto-fill FROM
    if ([2, 4, 7].includes(ctNum)) return autoFromLocked
    return false
  }, [ctNum, autoFromLocked])

  async function handleCreateSubmit(e) {
    if (e?.preventDefault) e.preventDefault()

    const cccd = String(createForm.extra_residentCCCD || "").trim()
    if (!isValidCccd(cccd)) {
      alert("CCCD phải gồm đúng 12 chữ số")
      return
    }

    const fromAddr = String(createForm.fromAddress || "").trim()
    const toAddr = String(createForm.toAddress || "").trim()

    if (ctNum === 1) {
      if (!toAddr) {
        alert("Tạm trú: Vui lòng nhập Đến địa chỉ (nơi tạm trú)")
        return
      }
    }

    if (ctNum === 2) {
      if (!fromAddr || !toAddr) {
        alert("Tạm vắng: Vui lòng nhập cả Từ địa chỉ và Đến địa chỉ")
        return
      }
    }

    if (ctNum === 3) {
      if (!fromAddr || !toAddr) {
        alert("Chuyển đến: Vui lòng nhập cả Từ địa chỉ và Đến địa chỉ")
        return
      }
    }

    if (ctNum === 4) {
      if (!toAddr) {
        alert("Chuyển đi: Vui lòng nhập Đến địa chỉ (nơi chuyển đi)")
        return
      }
      if (!fromAddr) {
        alert("Chuyển đi: Thiếu Từ địa chỉ (địa chỉ hiện tại). Chọn nhân khẩu để tự điền hoặc nhập tay.")
        return
      }
    }

    if (ctNum === 7) {
      if (!fromAddr) {
        alert("Khai tử: Thiếu Từ địa chỉ (địa chỉ hiện tại). Chọn nhân khẩu để tự điền hoặc nhập tay.")
        return
      }
    }

    if (isCreateResident) {
      const name = String(createForm.extra_fullname || "").trim()
      const dob = String(createForm.extra_dob || "").trim()
      if (!name) return alert("Vui lòng nhập Họ và tên")
      if (!dob) return alert("Vui lòng nhập Ngày sinh")
    }

    if (ctNum === 5) {
      if (!selectedHousehold?.id) return alert("Vui lòng chọn hộ khẩu")
      if (householdMembers.length <= 1) return alert("Không thể tách hộ khi hộ khẩu chỉ có 1 người")
      if (splitMembers.length < 1) return alert("Vui lòng chọn ít nhất 1 thành viên để tách hộ")
      if (!newOwnerId) return alert("Vui lòng chọn chủ hộ mới")
    }

    if (ctNum === 6) {
      if (!selectedHousehold?.id) return alert("Vui lòng chọn hộ khẩu")
      if (!newOwnerId) return alert("Vui lòng chọn chủ hộ mới")
    }

    try {
      setCreating(true)

      const payload = {
        changeType: Number(createForm.changeType),
        fromAddress: createForm.fromAddress || null,
        toAddress: createForm.toAddress || null,
        fromDate: createForm.fromDate || null,
        toDate: createForm.toDate || null,
        reason: createForm.reason || null
      }

      if (isCreateResident) {
        if (!isTempStay && !selectedHousehold?.id) {
          setCreating(false)
          return alert("Vui lòng chọn hộ khẩu")
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
          occupation: createForm.extra_occupation || undefined,
          relationToOwner: createForm.extra_relationToOwner || undefined,
          householdId: isTempStay ? null : selectedHousehold?.id || null
        }
      }

      if (isUseResident) {
        if (!residentResult?.id) {
          setCreating(false)
          return alert("Vui lòng chọn nhân khẩu")
        }
        payload.residentId = residentResult.id
      }

      if (ctNum === 5) {
        payload.residentId = null
        payload.extraData = {
          oldHouseholdId: selectedHousehold.id,
          memberIds: splitMembers,
          newOwnerId
        }
      }

      if (ctNum === 6) {
        payload.residentId = null
        payload.extraData = {
          householdId: selectedHousehold.id,
          oldOwnerId: householdMembers.find(m => m.relationToOwner === "Chủ hộ")?.id,
          newOwnerId
        }
      }

      await axios.post(`${API_BASE}/resident-changes`, payload, { headers: authHeaders() })
      alert("Tạo thành công!")
      navigate("/resident-changes")
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.message || "Tạo thất bại")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page-container rc-page">
      <div className="card rc-table-card">
        <div className="rc-table-toolbar">
          <div className="rc-toolbar-row" style={{ justifyContent: "space-between" }}>
            <div className="rc-page-head">
              <button type="button" className="rc-btn secondary" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Quay lại
              </button>
              <div>
                <div className="rc-head-title">Tạo biến động</div>
                <div className="rc-muted">Nhập thông tin và bấm Tạo</div>
              </div>
            </div>

            <button className="rc-btn ok" type="button" onClick={handleCreateSubmit} disabled={creating}>
              <FaPlus /> {creating ? "Đang tạo..." : "Tạo biến động"}
            </button>
          </div>
        </div>

        <form className="rc-create-body" onSubmit={handleCreateSubmit}>
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
                <div className="rc-detail-label">Hộ khẩu {isTempStay && isCreateResident ? "(không bắt buộc)" : ""}</div>
                <input
                  className="rc-input"
                  value={householdSearch}
                  onChange={e => {
                    setHouseholdSearch(e.target.value)
                    setShowHouseholdSuggest(true)
                  }}
                  onFocus={() => setShowHouseholdSuggest(true)}
                  onBlur={() => setTimeout(() => setShowHouseholdSuggest(false), 150)}
                  placeholder="Nhập mã hộ khẩu / địa chỉ"
                />

                {showHouseholdSuggest && householdOptions.length > 0 && (
                  <div className="rc-suggest-list" style={{ zIndex: 50 }}>
                    {householdOptions.map(h => (
                      <button
                        key={h.id}
                        type="button"
                        className="rc-suggest-item"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setSelectedHousehold(h)
                          setHouseholdSearch(h.householdCode || "")
                          setHouseholdOptions([])
                          setShowHouseholdSuggest(false)

                          // ✅ 0/1/3: chọn hộ -> fill TO
                          if ([0, 1, 3].includes(ctNum)) {
                            const addr = String(h.address || "").trim()
                            if (addr) onCreateField("toAddress", addr)
                          }
                        }}
                      >
                        <span className="rc-suggest-main">{h.householdCode || "—"}</span>
                        <span className="rc-suggest-sub">{h.address || "—"}</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedHousehold?.id && (
                  <div className="rc-sub-text" style={{ marginTop: 6 }}>
                    Đã chọn: <b>{selectedHousehold.householdCode || "—"}</b>
                    {selectedHousehold.address ? ` • ${selectedHousehold.address}` : ""}
                  </div>
                )}
              </div>
            )}

            {isUseResident && (
              <div className="rc-detail-item rc-wide rc-suggest-wrap">
                <div className="rc-detail-label">Nhân khẩu</div>
                <input
                  className="rc-input"
                  value={residentSearch}
                  onChange={e => {
                    setResidentSearch(e.target.value)
                    setShowResidentSuggest(true)
                  }}
                  onFocus={() => setShowResidentSuggest(true)}
                  onBlur={() => setTimeout(() => setShowResidentSuggest(false), 150)}
                  placeholder="Nhập họ tên / CCCD"
                />

                {showResidentSuggest && residentOptions.length > 0 && (
                  <div className="rc-suggest-list" style={{ zIndex: 50 }}>
                    {residentOptions.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        className="rc-suggest-item"
                        onMouseDown={e => e.preventDefault()}
                        onClick={async () => {
                          setResidentResult(r)
                          setResidentSearch(`${r.fullname || "—"} • ${r.residentCCCD || "—"}`)
                          setResidentOptions([])
                          setShowResidentSuggest(false)

                          // ✅ 2/4/7: chọn nhân khẩu -> fill FROM
                          if ([2, 4, 7].includes(ctNum)) {
                            const detail = await getResidentDetail(r.id)
                            const addr = String(
                              detail?.household?.address ||
                                detail?.resident?.household?.address ||
                                detail?.householdAddress ||
                                detail?.address ||
                                ""
                            ).trim()

                            if (addr) {
                              onCreateField("fromAddress", addr)
                              setAutoFromLocked(true)
                            } else {
                              setAutoFromLocked(false)
                            }
                          } else {
                            setAutoFromLocked(false)
                          }
                        }}
                      >
                        <span className="rc-suggest-main">{r.fullname || "—"}</span>
                        <span className="rc-suggest-sub">{r.residentCCCD || "—"}</span>
                      </button>
                    ))}
                  </div>
                )}

                {residentResult?.id && (
                  <div className="rc-sub-text" style={{ marginTop: 6 }}>
                    Đã chọn: <b>{residentResult.fullname || "—"}</b>
                    {residentResult.residentCCCD ? ` • ${residentResult.residentCCCD}` : ""}
                  </div>
                )}
              </div>
            )}

            <div className="rc-detail-item">
              <div className="rc-detail-label">Từ địa chỉ</div>
              <input
                className="rc-input"
                value={createForm.fromAddress}
                onChange={e => {
                  setAutoFromLocked(false)
                  onCreateField("fromAddress", e.target.value)
                }}
                placeholder={fromPlaceholder}
                readOnly={fromReadOnly}
              />
              {fromReadOnly && (
                <div className="rc-sub-text" style={{ marginTop: 6 }}>
                  Tự điền theo địa chỉ hộ hiện tại của nhân khẩu (đã khóa).
                </div>
              )}
            </div>

            <div className="rc-detail-item">
              <div className="rc-detail-label">Đến địa chỉ</div>
              <input
                className="rc-input"
                value={createForm.toAddress}
                onChange={e => onCreateField("toAddress", e.target.value)}
                placeholder={toPlaceholder}
                readOnly={toReadOnly}
              />
              {toReadOnly && (
                <div className="rc-sub-text" style={{ marginTop: 6 }}>
                  Tự điền theo địa chỉ hộ được chọn (đã khóa).
                </div>
              )}
            </div>

            {isCreateResident && (
              <>
                <div className="rc-detail-item">
                  <div className="rc-detail-label">Họ và tên *</div>
                  <input
                    className="rc-input"
                    value={createForm.extra_fullname}
                    onChange={e => onCreateField("extra_fullname", e.target.value)}
                  />
                </div>

                <div className="rc-detail-item">
                  <div className="rc-detail-label">CCCD (12 số)</div>
                  <input
                    className="rc-input"
                    value={createForm.extra_residentCCCD}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 12)
                      onCreateField("extra_residentCCCD", v)
                    }}
                    placeholder="VD: 012345678901"
                    inputMode="numeric"
                  />
                  {!isValidCccd(createForm.extra_residentCCCD) && (
                    <div className="rc-sub-text" style={{ color: "#b91c1c", marginTop: 4 }}>
                      CCCD phải gồm đúng 12 chữ số
                    </div>
                  )}
                </div>

                <div className="rc-detail-item">
                  <div className="rc-detail-label">Ngày sinh *</div>
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

                <div className="rc-detail-item">
                  <div className="rc-detail-label">Dân tộc</div>
                  <input
                    className="rc-input"
                    value={createForm.extra_ethnicity}
                    onChange={e => onCreateField("extra_ethnicity", e.target.value)}
                  />
                </div>

                <div className="rc-detail-item">
                  <div className="rc-detail-label">Tôn giáo</div>
                  <input
                    className="rc-input"
                    value={createForm.extra_religion}
                    onChange={e => onCreateField("extra_religion", e.target.value)}
                  />
                </div>

                <div className="rc-detail-item">
                  <div className="rc-detail-label">Quốc tịch</div>
                  <input
                    className="rc-input"
                    value={createForm.extra_nationality}
                    onChange={e => onCreateField("extra_nationality", e.target.value)}
                    placeholder="VD: Việt Nam"
                  />
                </div>

                <div className="rc-detail-item">
                  <div className="rc-detail-label">Quê quán</div>
                  <input
                    className="rc-input"
                    value={createForm.extra_hometown}
                    onChange={e => onCreateField("extra_hometown", e.target.value)}
                  />
                </div>

                <div className="rc-detail-item rc-wide">
                  <div className="rc-detail-label">Nghề nghiệp</div>
                  <input
                    className="rc-input"
                    value={createForm.extra_occupation}
                    onChange={e => onCreateField("extra_occupation", e.target.value)}
                  />
                </div>

                <div className="rc-detail-item rc-wide">
                  <div className="rc-detail-label">
                    Quan hệ với chủ hộ <span className="rc-muted">(tuỳ chọn)</span>
                  </div>
                  <input
                    className="rc-input"
                    placeholder="Ví dụ: Con, Vợ, Cháu, ..."
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
                ) : householdMembers.length === 1 ? (
                  <div className="rc-sub-text" style={{ color: "#b45309" }}>
                    ⚠️ Hộ khẩu chỉ có 1 người nên không thể tách hộ
                  </div>
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
                              if (e.target.checked) setSplitMembers(prev => [...prev, m.id])
                              else {
                                setSplitMembers(prev => prev.filter(id => id !== m.id))
                                if (newOwnerId === m.id) setNewOwnerId(null)
                              }
                            }}
                          />

                          <span className="rc-split-info">
                            <b>{m.fullname}</b>
                            {m.residentCCCD && ` • ${m.residentCCCD}`}
                            <span className="rc-sub-text">
                              {m.gender === "M" ? "Nam" : m.gender === "F" ? "Nữ" : "—"} • {String(m.dob).slice(0, 10)}
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
              </div>
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
        </form>
      </div>
    </div>
  )
}
