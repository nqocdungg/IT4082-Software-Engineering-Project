import React, { useState, useMemo, useEffect } from "react";
import Header from "../components/Header.jsx";
import SideBar from "../components/SideBar.jsx";
import {
  FaHome,
  FaPlus,
  FaSearch,
  FaUserEdit,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import "../styles/households.css";

// Giả sử role lấy từ context/auth, t để tạm:
const currentRole = "HEAD"; // HEAD | DEPUTY | HOUSEHOLD | ACCOUNTANT

// ================== DATA MẪU (map đúng với Household) ==================
const initialHouseholds = [
  {
    id: "HK000001",                 // CHAR(8)
    address: "Số 10, Ngõ 5, TDP 7 La Khê",
    registrationDate: "2010-06-01", // DATE
    nbrOfResident: 4,               // INT
    status: "Đang hoạt động",       // VARCHAR(200) – mô tả trạng thái hộ khẩu
    userId: "US000001",             // tài khoản quản lý hộ
    ownerId: "NK000001",            // mã nhân khẩu chủ hộ

    ownerName: "Nguyễn Văn A",      // dữ liệu join thêm để hiển thị
    ownerCCCD: "001085000123",
    residents: [
      "Nguyễn Văn A",
      "Đặng Văn E",
      "Nguyễn Thị X",
      "Nguyễn Văn Y",
    ],
  },
  {
    id: "HK000002",
    address: "Số 12, Ngõ 5, TDP 7 La Khê",
    registrationDate: "2023-03-15",
    nbrOfResident: 3,
    status: "Tạm trú",
    userId: "US000002",
    ownerId: "NK000010",
    ownerName: "Trần Thị B",
    ownerCCCD: "001095000456",
    residents: ["Trần Thị B", "Nguyễn Văn M", "Nguyễn Thị N"],
  },
  {
    id: "HK000003",
    address: "Số 3, Ngõ 7, TDP 7 La Khê",
    registrationDate: "2000-01-01",
    nbrOfResident: 5,
    status: "Đã chuyển đi",
    userId: "US000003",
    ownerId: "NK000020",
    ownerName: "Phạm Văn C",
    ownerCCCD: "001060000789",
    residents: [
      "Phạm Văn C",
      "Phạm Thị P",
      "Phạm Văn Q",
      "Phạm Thị R",
      "Phạm Thị S",
    ],
  },
  {
    id: "HK000004",
    address: "Số 21, Ngõ 3, TDP 7 La Khê",
    registrationDate: "2015-05-20",
    nbrOfResident: 2,
    status: "Đang hoạt động",
    userId: "US000004",
    ownerId: "NK000030",
    ownerName: "Hoàng Thị D",
    ownerCCCD: "001090009999",
    residents: ["Hoàng Thị D", "Bùi Minh G"],
  },
  {
    id: "HK000005",
    address: "Số 5, Ngõ 2, TDP 7 La Khê",
    registrationDate: "2024-01-12",
    nbrOfResident: 6,
    status: "Tạm trú",
    userId: "US000005",
    ownerId: "NK000040",
    ownerName: "Nguyễn Thị E",
    ownerCCCD: "001072003210",
    residents: [
      "Nguyễn Thị E",
      "Nguyễn Văn H",
      "Nguyễn Văn I",
      "Nguyễn Văn K",
      "Nguyễn Thị L",
      "Nguyễn Thị M",
    ],
  },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái hộ khẩu" },
  { value: "Đang hoạt động", label: "Đang hoạt động" },
  { value: "Tạm trú", label: "Tạm trú" },
  { value: "Đã chuyển đi", label: "Đã chuyển đi" },
];

const SORT_OPTIONS = [
  { value: "NEWEST", label: "Sắp xếp: Đăng ký mới nhất" },
  { value: "OLDEST", label: "Sắp xếp: Đăng ký cũ nhất" },
  { value: "MEMBERS_DESC", label: "Số nhân khẩu: Giảm dần" },
  { value: "MEMBERS_ASC", label: "Số nhân khẩu: Tăng dần" },
];

function statusToClass(status) {
  if (status === "Đang hoạt động") return "status-hk-thuong_tru";
  if (status === "Tạm trú") return "status-hk-tam_tru";
  if (status === "Đã chuyển đi") return "status-hk-da_chuyen_di";
  return "";
}

// ================== MODAL CHI TIẾT / EDIT ==================
const emptyHousehold = {
  id: "",
  address: "",
  registrationDate: "",
  nbrOfResident: "",
  status: "Đang hoạt động",
  userId: "",
  ownerId: "",
  ownerName: "",
  ownerCCCD: "",
  residents: [],
};

function HouseholdDetailModal({
  household,
  mode,
  onChangeMode,
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(household ?? emptyHousehold);

  useEffect(() => {
    setForm(household ?? emptyHousehold);
  }, [household, mode]);

  if (!household) return null;

  const allowEdit = currentRole === "HEAD" || currentRole === "DEPUTY";

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    onSave({
      ...form,
      nbrOfResident: Number(form.nbrOfResident) || 0,
    });
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
              {isEdit ? "Chỉnh sửa hộ khẩu" : "Chi tiết hộ khẩu"}
            </p>
            {isEdit ? (
              <input
                className="detail-title-input"
                value={form.ownerName}
                onChange={(e) => handleChange("ownerName", e.target.value)}
              />
            ) : (
              <h3 className="resident-modal-title">{form.ownerName}</h3>
            )}
            <p className="resident-modal-sub">
              Mã hộ khẩu: {form.id} • CCCD chủ hộ: {form.ownerCCCD}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="resident-modal-body no-scrollbar">
          <div className="detail-grid">
            {/* ID (mã hộ) */}
            <div className="detail-item">
              <span className="detail-label">Mã hộ khẩu</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    maxLength={8}
                    value={form.id}
                    onChange={(e) => handleChange("id", e.target.value)}
                  />
                ) : (
                  form.id
                )}
              </span>
            </div>

            {/* Số nhân khẩu */}
            <div className="detail-item">
              <span className="detail-label">Số nhân khẩu</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    type="number"
                    value={form.nbrOfResident}
                    onChange={(e) =>
                      handleChange("nbrOfResident", e.target.value)
                    }
                  />
                ) : (
                  `${form.nbrOfResident} người`
                )}
              </span>
            </div>

            {/* userId */}
            <div className="detail-item">
              <span className="detail-label">Mã tài khoản hộ (userId)</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    maxLength={8}
                    value={form.userId}
                    onChange={(e) => handleChange("userId", e.target.value)}
                  />
                ) : (
                  form.userId || "—"
                )}
              </span>
            </div>

            {/* ownerId */}
            <div className="detail-item">
              <span className="detail-label">Mã nhân khẩu chủ hộ (ownerId)</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    maxLength={8}
                    value={form.ownerId}
                    onChange={(e) => handleChange("ownerId", e.target.value)}
                  />
                ) : (
                  form.ownerId || "—"
                )}
              </span>
            </div>

            {/* Địa chỉ */}
            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ thường trú</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                ) : (
                  form.address
                )}
              </span>
            </div>

            {/* Trạng thái hộ */}
            <div className="detail-item">
              <span className="detail-label">Trạng thái hộ khẩu</span>
              <span className="detail-value">
                {isEdit ? (
                  <select
                    value={form.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                  >
                    {STATUS_OPTIONS.filter((s) => s.value !== "ALL").map(
                      (s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <span
                    className={`status-badge ${statusToClass(form.status)}`}
                  >
                    {form.status}
                  </span>
                )}
              </span>
            </div>

            {/* Ngày đăng ký */}
            <div className="detail-item">
              <span className="detail-label">Ngày đăng ký sổ hộ khẩu</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    value={form.registrationDate}
                    onChange={(e) =>
                      handleChange("registrationDate", e.target.value)
                    }
                    placeholder="YYYY-MM-DD"
                  />
                ) : (
                  form.registrationDate
                )}
              </span>
            </div>

            {/* Danh sách nhân khẩu */}
            <div className="detail-item detail-wide">
              <span className="detail-label">Danh sách nhân khẩu trong hộ</span>
              <span className="detail-value">
                {form.residents && form.residents.length > 0 ? (
                  <ul className="member-list">
                    {form.residents.map((name, idx) => (
                      <li key={idx}>{name}</li>
                    ))}
                  </ul>
                ) : (
                  "Chưa có danh sách nhân khẩu"
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="resident-modal-footer">
          {!isEdit || !allowEdit ? (
            <>
              <button className="btn-secondary" onClick={onClose}>
                Đóng
              </button>
              {allowEdit && (
                <button
                  className="btn-primary"
                  onClick={() => onChangeMode("edit")}
                >
                  <FaUserEdit />
                  Chỉnh sửa
                </button>
              )}
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

// ================== MODAL THÊM HỘ ==================
function AddHouseholdModal({ open, onClose, onCreate }) {
  const emptyForm = {
    id: "",
    address: "",
    registrationDate: "",
    nbrOfResident: "",
    status: "Đang hoạt động",
    userId: "",
    ownerId: "",
    ownerName: "",
    ownerCCCD: "",
    residents: [],
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
    onCreate({
      ...form,
      nbrOfResident: Number(form.nbrOfResident) || 0,
    });
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
            <h3 className="resident-modal-title">Hộ khẩu mới</h3>
            <p className="resident-modal-sub">
              Nhập thông tin sổ hộ khẩu theo quy định
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form
          className="resident-modal-body no-scrollbar"
          onSubmit={handleSubmit}
        >
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Mã hộ khẩu *</span>
              <span className="detail-value">
                <input
                  required
                  maxLength={8}
                  value={form.id}
                  onChange={(e) => handleChange("id", e.target.value)}
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Họ tên chủ hộ *</span>
              <span className="detail-value">
                <input
                  required
                  value={form.ownerName}
                  onChange={(e) => handleChange("ownerName", e.target.value)}
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">CCCD chủ hộ</span>
              <span className="detail-value">
                <input
                  value={form.ownerCCCD}
                  onChange={(e) => handleChange("ownerCCCD", e.target.value)}
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Số nhân khẩu *</span>
              <span className="detail-value">
                <input
                  type="number"
                  required
                  value={form.nbrOfResident}
                  onChange={(e) =>
                    handleChange("nbrOfResident", e.target.value)
                  }
                />
              </span>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ thường trú *</span>
              <span className="detail-value">
                <input
                  required
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Trạng thái hộ khẩu</span>
              <span className="detail-value">
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  {STATUS_OPTIONS.filter((s) => s.value !== "ALL").map(
                    (s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    )
                  )}
                </select>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Ngày đăng ký</span>
              <span className="detail-value">
                <input
                  value={form.registrationDate}
                  onChange={(e) =>
                    handleChange("registrationDate", e.target.value)
                  }
                  placeholder="YYYY-MM-DD"
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">userId (tài khoản hộ)</span>
              <span className="detail-value">
                <input
                  maxLength={8}
                  value={form.userId}
                  onChange={(e) => handleChange("userId", e.target.value)}
                />
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">ownerId (mã nhân khẩu chủ hộ)</span>
              <span className="detail-value">
                <input
                  maxLength={8}
                  value={form.ownerId}
                  onChange={(e) => handleChange("ownerId", e.target.value)}
                />
              </span>
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Danh sách nhân khẩu (ghi chú)</span>
              <span className="detail-value">
                <textarea
                  placeholder="Có thể ghi chú: tên các nhân khẩu hoặc ghi 'Xem chi tiết trong trang nhân khẩu'"
                  value={form.note}
                  onChange={(e) => handleChange("note", e.target.value)}
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
              Thêm hộ khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================== MAIN COMPONENT ==================
export default function HouseholdsPage() {
  const [households, setHouseholds] = useState(initialHouseholds);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("NEWEST");

  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [detailMode, setDetailMode] = useState("view");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filteredHouseholds = useMemo(() => {
    let data = [...households];

    if (search.trim() !== "") {
      const lower = search.toLowerCase();
      data = data.filter(
        (h) =>
          h.id.toLowerCase().includes(lower) ||
          h.ownerName.toLowerCase().includes(lower) ||
          h.ownerCCCD.toLowerCase().includes(lower) ||
          h.address.toLowerCase().includes(lower)
      );
    }

    if (statusFilter !== "ALL") {
      data = data.filter((h) => h.status === statusFilter);
    }

    if (sortOption === "NEWEST") {
      data.sort(
        (a, b) =>
          new Date(b.registrationDate) - new Date(a.registrationDate)
      );
    } else if (sortOption === "OLDEST") {
      data.sort(
        (a, b) =>
          new Date(a.registrationDate) - new Date(b.registrationDate)
      );
    } else if (sortOption === "MEMBERS_DESC") {
      data.sort((a, b) => b.nbrOfResident - a.nbrOfResident);
    } else if (sortOption === "MEMBERS_ASC") {
      data.sort((a, b) => a.nbrOfResident - b.nbrOfResident);
    }

    return data;
  }, [households, search, statusFilter, sortOption]);

  const stats = useMemo(() => {
    const total = households.length;
    const countByStatus = (s) =>
      households.filter((h) => h.status === s).length;
    const avgResidents =
      total === 0
        ? 0
        : households.reduce((sum, h) => sum + h.nbrOfResident, 0) / total;

    return {
      total,
      active: countByStatus("Đang hoạt động"),
      tamTru: countByStatus("Tạm trú"),
      daChuyenDi: countByStatus("Đã chuyển đi"),
      avgResidents: avgResidents.toFixed(1),
    };
  }, [households]);

  const allowManage =
    currentRole === "HEAD" || currentRole === "DEPUTY"; // theo mô tả nghiệp vụ

  const handleOpenDetail = (household, mode = "view") => {
    setSelectedHousehold(household);
    setDetailMode(mode);
  };

  const handleCloseDetail = () => {
    setSelectedHousehold(null);
    setDetailMode("view");
  };

  const handleSaveHousehold = (updated) => {
    setHouseholds((prev) =>
      prev.map((h) => (h.id === updated.id ? updated : h))
    );
    setSelectedHousehold(updated);
    setDetailMode("view");
  };

  const handleCreateHousehold = (data) => {
    setHouseholds((prev) => [...prev, data]);
  };

  const handleDelete = (id) => {
    if (!allowManage) return;
    if (window.confirm("Bạn có chắc muốn xóa hộ khẩu " + id + " ?")) {
      setHouseholds((prev) => prev.filter((h) => h.id !== id));
    }
  };

  return (
    <div className="appMain">
      <Header />

      <div className="mainContentWrapper">
        <SideBar />

        <div className="mainContent households-page no-scrollbar">
          {/* HEADER */}
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

          {/* FILTER */}
          <div className="card filter-card">
            <div className="filter-grid">
              <div className="filter-input search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm mã hộ, chủ hộ, CCCD hoặc địa chỉ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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

          {/* STATS MINI */}
          <div className="stats-mini">
            <div className="stat-card">
              <p className="stat-label">Tổng số hộ</p>
              <p className="stat-value">{stats.total}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Hộ đang hoạt động</p>
              <p className="stat-value">{stats.active}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Hộ tạm trú</p>
              <p className="stat-value">{stats.tamTru}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Hộ đã chuyển đi</p>
              <p className="stat-value">{stats.daChuyenDi}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Nhân khẩu TB / hộ</p>
              <p className="stat-value">{stats.avgResidents}</p>
            </div>
          </div>

          {/* TABLE */}
          <div className="card table-card">
            <div className="table-header">
              Danh sách hộ khẩu ({filteredHouseholds.length} bản ghi)
            </div>

            <div className="table-wrapper">
              <table className="household-table">
                <thead>
                  <tr>
                    <th>Mã hộ khẩu</th>
                    <th>Chủ hộ</th>
                    <th>CCCD chủ hộ</th>
                    <th>Địa chỉ thường trú</th>
                    <th>Số nhân khẩu</th>
                    <th>Trạng thái</th>
                    <th>Ngày đăng ký</th>
                    {allowManage && <th>Hành động</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredHouseholds.length === 0 ? (
                    <tr>
                      <td
                        colSpan={allowManage ? 8 : 7}
                        className="empty-row"
                      >
                        Không có hộ khẩu phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredHouseholds.map((h) => (
                      <tr
                        key={h.id}
                        className="clickable-row"
                        onClick={() => handleOpenDetail(h, "view")}
                      >
                        <td>{h.id}</td>
                        <td>{h.ownerName}</td>
                        <td>{h.ownerCCCD}</td>
                        <td>{h.address}</td>
                        <td>{h.nbrOfResident}</td>
                        <td>
                          <span
                            className={`status-badge ${statusToClass(
                              h.status
                            )}`}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td>{h.registrationDate}</td>
                        {allowManage && (
                          <td
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="row-actions">
                              <button
                                onClick={() => handleOpenDetail(h, "edit")}
                              >
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MODALS */}
          <HouseholdDetailModal
            household={selectedHousehold}
            mode={detailMode}
            onChangeMode={setDetailMode}
            onClose={handleCloseDetail}
            onSave={handleSaveHousehold}
          />

          {allowManage && (
            <AddHouseholdModal
              open={isAddOpen}
              onClose={() => setIsAddOpen(false)}
              onCreate={handleCreateHousehold}
            />
          )}
        </div>
      </div>
    </div>
  );
}
