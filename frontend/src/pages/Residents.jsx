// src/pages/Residents.jsx
import React, { useState, useMemo, useEffect } from "react";
import Header from "../components/Header.jsx";
import SideBar from "../components/SideBar.jsx";
import {
  FaPlus,
  FaSearch,
  FaUserFriends,
  FaUserEdit,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import "../styles/residents.css";

/**
 * Mã tình trạng cư trú:
 * 0 - Thường trú
 * 1 - Tạm trú
 * 2 - Tạm vắng
 * 3 - Đã chuyển đi
 * 4 - Đã qua đời
 */
const RESIDENCY_STATUS = {
  0: { label: "Thường trú", className: "status-thuong_tru" },
  1: { label: "Tạm trú", className: "status-tam_tru" },
  2: { label: "Tạm vắng", className: "status-tam_vang" },
  3: { label: "Đã chuyển đi", className: "status-da_chuyen_di" },
  4: { label: "Đã qua đời", className: "status-da_qua_doi" },
};

const residencyStatusOptions = Object.entries(RESIDENCY_STATUS).map(
  ([code, info]) => ({
    value: code,
    label: `${info.label} (mã ${code})`,
  })
);

// ==== DATA GỐC ====
const initialResidents = [
  {
    id: 1,
    fullName: "Nguyễn Văn A",
    gender: "Nam",
    dob: "1985-04-12",
    age: 39,
    cccd: "001085000123",
    relationToHead: "Chủ hộ",
    maritalStatus: "Đã kết hôn",
    occupation: "Nhân viên văn phòng",
    permanentAddress: "Số 10, Ngõ 5, TDP 7 La Khê",
    tempAddress: "",
    residencyStatusCode: 0,
    registeredAt: "2010-06-01",
    note: "",
  },
  {
    id: 2,
    fullName: "Trần Thị B",
    gender: "Nữ",
    dob: "1995-09-20",
    age: 29,
    cccd: "001095000456",
    relationToHead: "Vợ/chồng chủ hộ",
    maritalStatus: "Đã kết hôn",
    occupation: "Kế toán",
    permanentAddress: "Số 12, Ngõ 5, TDP 7 La Khê",
    tempAddress: "Phòng 302, số 12, Ngõ 5",
    residencyStatusCode: 1,
    registeredAt: "2023-03-15",
    note: "Sinh viên thuê trọ",
  },
  {
    id: 3,
    fullName: "Phạm Văn C",
    gender: "Nam",
    dob: "1960-01-10",
    age: 64,
    cccd: "001060000789",
    relationToHead: "Ông/bà",
    maritalStatus: "Góa",
    occupation: "Hưu trí",
    permanentAddress: "Số 3, Ngõ 7, TDP 7 La Khê",
    tempAddress: "",
    residencyStatusCode: 3,
    registeredAt: "2000-01-01",
    note: "Chuyển hộ khẩu về quê",
  },
  {
    id: 4,
    fullName: "Lê Thị D",
    gender: "Nữ",
    dob: "1945-07-08",
    age: 79,
    cccd: "001045000999",
    relationToHead: "Thành viên khác",
    maritalStatus: "Góa",
    occupation: "Hưu trí",
    permanentAddress: "Số 15, Ngõ 9, TDP 7 La Khê",
    tempAddress: "",
    residencyStatusCode: 4,
    registeredAt: "1990-02-10",
    note: "Mất năm 2022",
  },
  {
    id: 5,
    fullName: "Đặng Văn E",
    gender: "Nam",
    dob: "2000-11-02",
    age: 24,
    cccd: "001000001234",
    relationToHead: "Con trai",
    maritalStatus: "Độc thân",
    occupation: "Sinh viên",
    permanentAddress: "Số 10, Ngõ 5, TDP 7 La Khê",
    tempAddress: "Ký túc xá Bách Khoa",
    residencyStatusCode: 2,
    registeredAt: "2018-09-01",
    note: "Tạm vắng do học xa",
  },
  {
    id: 6,
    fullName: "Hoàng Thị F",
    gender: "Nữ",
    dob: "1990-02-18",
    age: 34,
    cccd: "001090009999",
    relationToHead: "Chủ hộ",
    maritalStatus: "Đã kết hôn",
    occupation: "Giáo viên",
    permanentAddress: "Số 21, Ngõ 3, TDP 7 La Khê",
    tempAddress: "",
    residencyStatusCode: 0,
    registeredAt: "2015-05-20",
    note: "",
  },
  {
    id: 7,
    fullName: "Bùi Minh G",
    gender: "Nam",
    dob: "2015-06-30",
    age: 9,
    cccd: "",
    relationToHead: "Con trai",
    maritalStatus: "Chưa kết hôn",
    occupation: "Học sinh tiểu học",
    permanentAddress: "Số 21, Ngõ 3, TDP 7 La Khê",
    tempAddress: "",
    residencyStatusCode: 0,
    registeredAt: "2015-07-10",
    note: "Khai sinh tại phường La Khê",
  },
  {
    id: 8,
    fullName: "Nguyễn Thị H",
    gender: "Nữ",
    dob: "1988-03-05",
    age: 36,
    cccd: "001088004321",
    relationToHead: "Người thuê trọ",
    maritalStatus: "Độc thân",
    occupation: "Nhân viên bán hàng",
    permanentAddress: "Hải Dương",
    tempAddress: "Phòng 201, nhà trọ số 8, Ngõ 11",
    residencyStatusCode: 1,
    registeredAt: "2024-01-12",
    note: "Đăng ký tạm trú 12 tháng",
  },
  {
    id: 9,
    fullName: "Trần Quốc I",
    gender: "Nam",
    dob: "1978-08-25",
    age: 46,
    cccd: "001078007654",
    relationToHead: "Chủ hộ",
    maritalStatus: "Đã kết hôn",
    occupation: "Lái xe",
    permanentAddress: "Số 5, Ngõ 2, TDP 7 La Khê",
    tempAddress: "",
    residencyStatusCode: 0,
    registeredAt: "2008-03-03",
    note: "Thường xuyên đi công tác xa",
  },
  {
    id: 10,
    fullName: "Phan Thị K",
    gender: "Nữ",
    dob: "1972-12-01",
    age: 52,
    cccd: "001072003210",
    relationToHead: "Vợ/chồng chủ hộ",
    maritalStatus: "Đã kết hôn",
    occupation: "Buôn bán nhỏ",
    permanentAddress: "Số 5, Ngõ 2, TDP 7 La Khê",
    tempAddress: "",
    residencyStatusCode: 2,
    registeredAt: "2008-03-03",
    note: "Tạm vắng 3 tháng đi chăm con ở tỉnh khác",
  },
];


const statusFilterOptions = [
  { value: "ALL", label: "Tất cả tình trạng cư trú" },
  ...Object.entries(RESIDENCY_STATUS).map(([code, info]) => ({
    value: code,
    label: info.label,
  })),
];

const genderOptions = [
  { value: "ALL", label: "Giới tính (tất cả)" },
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
];

function getResidencyStatusInfo(code) {
  return RESIDENCY_STATUS[code] || { label: "Không rõ", className: "" };
}

/* ---- resident rỗng mặc định, tránh null ---- */
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
  note: "",
};

/* ---------------- Modal chi tiết + chỉnh sửa ---------------- */

function ResidentDetailModal({
  resident,
  mode,
  onChangeMode,
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit";

  // luôn có form mặc định, không bị null
  const [form, setForm] = useState(resident ?? emptyResident);

  useEffect(() => {
    if (resident) {
      setForm(resident);
    } else {
      setForm(emptyResident);
    }
  }, [resident, mode]);

  // nếu không có resident thì không render modal
  if (!resident) return null;

  const statusInfo = getResidencyStatusInfo(form.residencyStatusCode ?? 0);

  const mainAddress =
    form.residencyStatusCode === 1 && form.tempAddress
      ? form.tempAddress
      : form.permanentAddress;

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <div className="resident-modal-overlay" onClick={onClose}>
      <div
        className="resident-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="resident-modal-header">
          <div>
            <p className="resident-modal-label">
              {isEdit ? "Chỉnh sửa thông tin" : "Chi tiết nhân khẩu"}
            </p>
            {isEdit ? (
              <input
                className="detail-title-input"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
              />
            ) : (
              <h3 className="resident-modal-title">{form.fullName}</h3>
            )}
            <p className="resident-modal-sub">
              CCCD: {form.cccd} • {form.gender} • {form.age} tuổi
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="resident-modal-body no-scrollbar">
          <div className="detail-grid">
            {/* Quan hệ chủ hộ */}
            <div className="detail-item">
              <span className="detail-label">Quan hệ với chủ hộ</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    value={form.relationToHead}
                    onChange={(e) =>
                      handleChange("relationToHead", e.target.value)
                    }
                  />
                ) : (
                  form.relationToHead
                )}
              </span>
            </div>

            {/* Hôn nhân */}
            <div className="detail-item">
              <span className="detail-label">Tình trạng hôn nhân</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    value={form.maritalStatus}
                    onChange={(e) =>
                      handleChange("maritalStatus", e.target.value)
                    }
                  />
                ) : (
                  form.maritalStatus
                )}
              </span>
            </div>

            {/* Nghề nghiệp */}
            <div className="detail-item">
              <span className="detail-label">Nghề nghiệp</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    value={form.occupation}
                    onChange={(e) =>
                      handleChange("occupation", e.target.value)
                    }
                  />
                ) : (
                  form.occupation
                )}
              </span>
            </div>

            {/* Ngày sinh + tuổi */}
            <div className="detail-item">
              <span className="detail-label">Ngày sinh / Tuổi</span>
              <span className="detail-value">
                {isEdit ? (
                  <>
                    <input
                      value={form.dob}
                      onChange={(e) =>
                        handleChange("dob", e.target.value)
                      }
                    />
                    <input
                      style={{ marginTop: 6 }}
                      value={form.age}
                      onChange={(e) =>
                        handleChange("age", e.target.value)
                      }
                      placeholder="Tuổi"
                    />
                  </>
                ) : (
                  <>
                    {form.dob} ({form.age} tuổi)
                  </>
                )}
              </span>
            </div>

            {/* Thường trú */}
            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ hộ khẩu thường trú</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    value={form.permanentAddress}
                    onChange={(e) =>
                      handleChange("permanentAddress", e.target.value)
                    }
                  />
                ) : (
                  form.permanentAddress
                )}
              </span>
            </div>

            {/* Tạm trú */}
            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ tạm trú</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    value={form.tempAddress}
                    onChange={(e) =>
                      handleChange("tempAddress", e.target.value)
                    }
                  />
                ) : form.tempAddress ? (
                  form.tempAddress
                ) : (
                  "Không có"
                )}
              </span>
            </div>

            {/* Tình trạng cư trú */}
            <div className="detail-item">
              <span className="detail-label">Tình trạng cư trú</span>
              <span className="detail-value">
                {isEdit ? (
                  <select
                    value={form.residencyStatusCode}
                    onChange={(e) =>
                      handleChange(
                        "residencyStatusCode",
                        Number(e.target.value)
                      )
                    }
                  >
                    {residencyStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`status-badge ${statusInfo.className}`}
                  >
                    {statusInfo.label} (mã {form.residencyStatusCode})
                  </span>
                )}
              </span>
            </div>

            {/* Ngày đăng ký */}
            <div className="detail-item">
              <span className="detail-label">Ngày đăng ký cư trú</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    value={form.registeredAt}
                    onChange={(e) =>
                      handleChange("registeredAt", e.target.value)
                    }
                  />
                ) : (
                  form.registeredAt
                )}
              </span>
            </div>

            {/* Địa chỉ hiển thị chính */}
            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ hiển thị chính</span>
              <span className="detail-value">{mainAddress}</span>
            </div>

            {/* Ghi chú */}
            <div className="detail-item detail-wide">
              <span className="detail-label">Ghi chú</span>
              <span className="detail-value">
                {isEdit ? (
                  <textarea
                    value={form.note}
                    onChange={(e) => handleChange("note", e.target.value)}
                  />
                ) : (
                  form.note || "Không có ghi chú"
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="resident-modal-footer">
          {!isEdit ? (
            <>
              <button className="btn-secondary" onClick={onClose}>
                Đóng
              </button>
              <button
                className="btn-primary"
                onClick={() => onChangeMode("edit")}
              >
                <FaUserEdit />
                Chỉnh sửa
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-secondary"
                onClick={() => onChangeMode("view")}
              >
                Hủy
              </button>
              <button className="btn-primary" onClick={handleSubmit}>
                Lưu thay đổi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Modal THÊM NHÂN KHẨU ---------------- */

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
    note: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm);
  }, [open]);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(form);
    onClose();
  };

  return (
    <div className="resident-modal-overlay" onClick={onClose}>
      <div
        className="resident-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="resident-modal-header">
          <div>
            <p className="resident-modal-label">Thêm mới</p>
            <h3 className="resident-modal-title">Nhân khẩu mới</h3>
            <p className="resident-modal-sub">
              Nhập các thông tin cơ bản của nhân khẩu
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Đưa body + footer vào chung 1 form cho chuẩn */}
        <form
          className="resident-modal-body no-scrollbar"
          onSubmit={handleSubmit}
        >
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Họ và tên *</span>
              <span className="detail-value">
                <input
                  required
                  value={form.fullName}
                  onChange={(e) =>
                    handleChange("fullName", e.target.value)
                  }
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Giới tính</span>
              <span className="detail-value">
                <select
                  value={form.gender}
                  onChange={(e) =>
                    handleChange("gender", e.target.value)
                  }
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Ngày sinh</span>
              <span className="detail-value">
                <input
                  value={form.dob}
                  onChange={(e) =>
                    handleChange("dob", e.target.value)
                  }
                  placeholder="YYYY-MM-DD"
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Tuổi</span>
              <span className="detail-value">
                <input
                  value={form.age}
                  onChange={(e) =>
                    handleChange("age", e.target.value)
                  }
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Số CCCD</span>
              <span className="detail-value">
                <input
                  value={form.cccd}
                  onChange={(e) =>
                    handleChange("cccd", e.target.value)
                  }
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Quan hệ với chủ hộ</span>
              <span className="detail-value">
                <input
                  value={form.relationToHead}
                  onChange={(e) =>
                    handleChange("relationToHead", e.target.value)
                  }
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Tình trạng hôn nhân</span>
              <span className="detail-value">
                <input
                  value={form.maritalStatus}
                  onChange={(e) =>
                    handleChange("maritalStatus", e.target.value)
                  }
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Nghề nghiệp</span>
              <span className="detail-value">
                <input
                  value={form.occupation}
                  onChange={(e) =>
                    handleChange("occupation", e.target.value)
                  }
                />
              </span>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ hộ khẩu thường trú *</span>
              <span className="detail-value">
                <input
                  required
                  value={form.permanentAddress}
                  onChange={(e) =>
                    handleChange("permanentAddress", e.target.value)
                  }
                />
              </span>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ tạm trú</span>
              <span className="detail-value">
                <input
                  value={form.tempAddress}
                  onChange={(e) =>
                    handleChange("tempAddress", e.target.value)
                  }
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Tình trạng cư trú</span>
              <span className="detail-value">
                <select
                  value={form.residencyStatusCode}
                  onChange={(e) =>
                    handleChange(
                      "residencyStatusCode",
                      Number(e.target.value)
                    )
                  }
                >
                  {residencyStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Ngày đăng ký cư trú</span>
              <span className="detail-value">
                <input
                  value={form.registeredAt}
                  onChange={(e) =>
                    handleChange("registeredAt", e.target.value)
                  }
                  placeholder="YYYY-MM-DD"
                />
              </span>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Ghi chú</span>
              <span className="detail-value">
                <textarea
                  value={form.note}
                  onChange={(e) =>
                    handleChange("note", e.target.value)
                  }
                />
              </span>
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
  );
}

/* ---------------- MAIN COMPONENT ---------------- */

export default function ResidentManagement() {
  const [residents, setResidents] = useState(initialResidents);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");

  const [selectedResident, setSelectedResident] = useState(null);
  const [detailMode, setDetailMode] = useState("view"); // "view" | "edit"
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const matchSearch =
        search.trim() === "" ||
        r.fullName.toLowerCase().includes(search.toLowerCase()) ||
        r.cccd.includes(search);

      const matchStatus =
        statusFilter === "ALL" ||
        String(r.residencyStatusCode) === String(statusFilter);

      const matchGender =
        genderFilter === "ALL" || r.gender === genderFilter;

      return matchSearch && matchStatus && matchGender;
    });
  }, [residents, search, statusFilter, genderFilter]);

  const stats = useMemo(() => {
    const total = residents.length;
    const countByStatus = (code) =>
      residents.filter((r) => r.residencyStatusCode === code).length;

    return {
      total,
      thuongTru: countByStatus(0),
      tamTru: countByStatus(1),
      daChuyenDi: countByStatus(3),
      daQuaDoi: countByStatus(4),
    };
  }, [residents]);

  const handleOpenDetail = (resident, mode = "view") => {
    setSelectedResident(resident);
    setDetailMode(mode);
  };

  const handleCloseDetail = () => {
    setSelectedResident(null);
    setDetailMode("view");
  };

  const handleSaveResident = (updated) => {
    setResidents((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
    setSelectedResident(updated);
    setDetailMode("view");
  };

  const handleCreateResident = (data) => {
    setResidents((prev) => {
      const nextId = prev.length
        ? Math.max(...prev.map((r) => r.id)) + 1
        : 1;
      return [
        ...prev,
        {
          ...data,
          id: nextId,
        },
      ];
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa nhân khẩu ID " + id + " ?")) {
      setResidents((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="appMain">
      <Header />

      <div className="mainContentWrapper">
        <SideBar />

        <div className="mainContent residents-page no-scrollbar">
          {/* HEADER */}
          <div className="page-header">
            <h2 className="page-title">
              <FaUserFriends className="page-title-icon" />
              Quản lý nhân khẩu
            </h2>

            <button
              className="btn-primary"
              onClick={() => setIsAddOpen(true)}
            >
              <FaPlus /> Thêm nhân khẩu
            </button>
          </div>

          {/* FILTER (3 ô) */}
          <div className="card filter-card">
            <div className="filter-grid basic-3">
              <div className="filter-input search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm theo họ tên hoặc CCCD..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusFilterOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
              >
                {genderOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STATS MINI */}
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

          {/* TABLE CƠ BẢN */}
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
                  {filteredResidents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-row">
                        Không có nhân khẩu phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredResidents.map((r) => {
                      const statusInfo = getResidencyStatusInfo(
                        r.residencyStatusCode
                      );
                      return (
                        <tr
                          key={r.id}
                          className="clickable-row"
                          onClick={() => handleOpenDetail(r, "view")}
                        >
                          <td>{r.fullName}</td>
                          <td>{r.gender}</td>
                          <td>
                            {r.dob}
                            <div className="sub-text">{r.age} tuổi</div>
                          </td>
                          <td>{r.cccd}</td>
                          <td>{r.permanentAddress}</td>
                          <td>
                            <span
                              className={`status-badge ${statusInfo.className}`}
                            >
                              {statusInfo.label}
                            </span>
                          </td>
                          <td>{r.registeredAt}</td>
                          <td
                            onClick={(e) => e.stopPropagation()} // tránh mở modal khi bấm nút
                          >
                            <div className="row-actions">
                              <button
                                onClick={() => handleOpenDetail(r, "edit")}
                              >
                                <FaUserEdit />
                              </button>
                              <button
                                className="danger"
                                onClick={() => handleDelete(r.id)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MODAL CHI TIẾT + EDIT */}
          <ResidentDetailModal
            resident={selectedResident}
            mode={detailMode}
            onChangeMode={setDetailMode}
            onClose={handleCloseDetail}
            onSave={handleSaveResident}
          />

          {/* MODAL THÊM NHÂN KHẨU */}
          <AddResidentModal
            open={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            onCreate={handleCreateResident}
          />
        </div>
      </div>
    </div>
  );
}
