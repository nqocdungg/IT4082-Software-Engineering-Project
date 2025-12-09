// src/pages/Households.jsx
import React, { useState, useMemo, useEffect } from "react";
import Header from "../components/Header.jsx";
import SideBar from "../components/SideBar.jsx";
import axios from "axios";
import {
  FaHome,
  FaPlus,
  FaSearch,
  FaUserEdit,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import "../styles/households.css";

const currentRole = localStorage.getItem("role") || "HEAD";

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
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave({
      ...form,
      nbrOfResident: Number(form.nbrOfResident) || 0,
    });
  };

  return (
    <div className="resident-modal-overlay" onClick={onClose}>
      <div className="resident-modal" onClick={(e) => e.stopPropagation()}>
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
            {/* ID */}
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

            {/* Members */}
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
              <span className="detail-label">Mã tài khoản hộ</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    value={form.userId}
                    onChange={(e) => handleChange("userId", e.target.value)}
                    maxLength={8}
                  />
                ) : (
                  form.userId || "—"
                )}
              </span>
            </div>

            {/* ownerId */}
            <div className="detail-item">
              <span className="detail-label">Mã nhân khẩu chủ hộ</span>
              <span className="detail-value">
                {isEdit ? (
                  <input
                    value={form.ownerId}
                    onChange={(e) => handleChange("ownerId", e.target.value)}
                    maxLength={8}
                  />
                ) : (
                  form.ownerId || "—"
                )}
              </span>
            </div>

            {/* Address */}
            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ</span>
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

            {/* Status */}
            <div className="detail-item">
              <span className="detail-label">Trạng thái</span>
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
                  <span className={`status-badge ${statusToClass(form.status)}`}>
                    {form.status}
                  </span>
                )}
              </span>
            </div>

            {/* Registration date */}
            <div className="detail-item">
              <span className="detail-label">Ngày đăng ký</span>
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

            {/* Residents list */}
            <div className="detail-item detail-wide">
              <span className="detail-label">Danh sách nhân khẩu</span>
              <span className="detail-value">
                {form.residents?.length > 0 ? (
                  <ul className="member-list">
                    {form.residents.map((r, idx) => (
                      <li key={idx}>{r}</li>
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
          {!isEdit ? (
            <>
              <button className="btn-secondary" onClick={onClose}>
                Đóng
              </button>
              {allowEdit && (
                <button
                  className="btn-primary"
                  onClick={() => onChangeMode("edit")}
                >
                  <FaUserEdit /> Chỉnh sửa
                </button>
              )}
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => onChangeMode("view")}>
                Hủy
              </button>
              <button className="btn-primary" onClick={handleSubmit}>
                Lưu
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AddHouseholdModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(emptyHousehold);

  useEffect(() => {
    if (open) setForm(emptyHousehold);
  }, [open]);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      <div className="resident-modal" onClick={(e) => e.stopPropagation()}>
        <div className="resident-modal-header">
          <div>
            <p className="resident-modal-label">Thêm hộ khẩu</p>
            <h3 className="resident-modal-title">Hộ khẩu mới</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form className="resident-modal-body no-scrollbar" onSubmit={handleSubmit}>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Mã hộ khẩu *</span>
              <input
                required
                maxLength={8}
                value={form.id}
                onChange={(e) => handleChange("id", e.target.value)}
              />
            </div>

            <div className="detail-item">
              <span className="detail-label">Tên chủ hộ *</span>
              <input
                required
                value={form.ownerName}
                onChange={(e) => handleChange("ownerName", e.target.value)}
              />
            </div>

            <div className="detail-item">
              <span className="detail-label">CCCD chủ hộ</span>
              <input
                value={form.ownerCCCD}
                onChange={(e) => handleChange("ownerCCCD", e.target.value)}
              />
            </div>

            <div className="detail-item">
              <span className="detail-label">Số nhân khẩu *</span>
              <input
                required
                type="number"
                value={form.nbrOfResident}
                onChange={(e) => handleChange("nbrOfResident", e.target.value)}
              />
            </div>

            <div className="detail-item detail-wide">
              <span className="detail-label">Địa chỉ *</span>
              <input
                required
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div className="detail-item">
              <span className="detail-label">Trạng thái</span>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                {STATUS_OPTIONS.filter((o) => o.value !== "ALL").map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="detail-item">
              <span className="detail-label">Ngày đăng ký</span>
              <input
                placeholder="YYYY-MM-DD"
                value={form.registrationDate}
                onChange={(e) =>
                  handleChange("registrationDate", e.target.value)
                }
              />
            </div>

            <div className="detail-item">
              <span className="detail-label">userId</span>
              <input
                maxLength={8}
                value={form.userId}
                onChange={(e) => handleChange("userId", e.target.value)}
              />
            </div>

            <div className="detail-item">
              <span className="detail-label">ownerId</span>
              <input
                maxLength={8}
                value={form.ownerId}
                onChange={(e) => handleChange("ownerId", e.target.value)}
              />
            </div>
          </div>

          <div className="resident-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
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

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("NEWEST");

  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [detailMode, setDetailMode] = useState("view");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const allowManage = currentRole === "HEAD" || currentRole === "DEPUTY";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("http://localhost:5000/api/households", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setHouseholds(res.data.data || []);
      } catch (err) {
        console.error(err);
        alert("Không tải được danh sách hộ khẩu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateHousehold = async (data) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/households",
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setHouseholds((prev) => [res.data.data, ...prev]);
    } catch (err) {
      alert("Không thể tạo hộ khẩu!");
      console.error(err);
    }
  };

  const handleSaveHousehold = async (updated) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.put(
        `http://localhost:5000/api/households/${updated.id}`,
        updated,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setHouseholds((prev) =>
        prev.map((h) => (h.id === updated.id ? res.data.data : h))
      );

      setSelectedHousehold(res.data.data);
      setDetailMode("view");
    } catch (err) {
      alert("Không thể cập nhật hộ khẩu!");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá hộ khẩu " + id + "?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`http://localhost:5000/api/households/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHouseholds((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      alert("Không thể xoá hộ khẩu!");
      console.error(err);
    }
  };

  const filteredHouseholds = useMemo(() => {
    let data = [...households];

    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter(
        (h) =>
          h.id.toLowerCase().includes(s) ||
          h.ownerName.toLowerCase().includes(s) ||
          (h.ownerCCCD || "").toLowerCase().includes(s) ||
          h.address.toLowerCase().includes(s)
      );
    }

    if (statusFilter !== "ALL") {
      data = data.filter((h) => h.status === statusFilter);
    }

    if (sortOption === "NEWEST") {
      data.sort(
        (a, b) => new Date(b.registrationDate) - new Date(a.registrationDate)
      );
    } else if (sortOption === "OLDEST") {
      data.sort(
        (a, b) => new Date(a.registrationDate) - new Date(b.registrationDate)
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
    const count = (s) => households.filter((h) => h.status === s).length;
    const avg =
      total === 0
        ? 0
        : households.reduce((sum, h) => sum + h.nbrOfResident, 0) / total;

    return {
      total,
      active: count("Đang hoạt động"),
      tamTru: count("Tạm trú"),
      daChuyenDi: count("Đã chuyển đi"),
      avg: avg.toFixed(1),
    };
  }, [households]);

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div className="appMain">
      <Header />
      <div className="mainContentWrapper">
        <SideBar />

        <div className="mainContent households-page">
          {/* HEADER */}
          <div className="page-header">
            <h2 className="page-title">
              <FaHome className="page-title-icon" />
              Quản lý hộ khẩu
            </h2>

            {allowManage && (
              <button className="btn-primary" onClick={() => setIsAddOpen(true)}>
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
                  placeholder="Tìm mã hộ, chủ hộ, CCCD, địa chỉ..."
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

          {/* STATS */}
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

          {/* TABLE */}
          <div className="card table-card">
            <div className="table-header">
              Danh sách hộ khẩu ({filteredHouseholds.length} bản ghi)
            </div>

            <div className="table-wrapper">
              <table className="household-table">
                <thead>
                  <tr>
                    <th>Mã hộ</th>
                    <th>Chủ hộ</th>
                    <th>CCCD</th>
                    <th>Địa chỉ</th>
                    <th>Số nhân khẩu</th>
                    <th>Trạng thái</th>
                    <th>Ngày đăng ký</th>
                    {allowManage && <th>Hành động</th>}
                  </tr>
                </thead>

                <tbody>
                  {filteredHouseholds.length === 0 ? (
                    <tr>
                      <td colSpan={allowManage ? 8 : 7} className="empty-row">
                        Không có hộ khẩu phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredHouseholds.map((h) => (
                      <tr
                        key={h.id}
                        className="clickable-row"
                        onClick={() => {
                          setSelectedHousehold(h);
                          setDetailMode("view");
                        }}
                      >
                        <td>{h.id}</td>
                        <td>{h.ownerName}</td>
                        <td>{h.ownerCCCD}</td>
                        <td>{h.address}</td>
                        <td>{h.nbrOfResident}</td>

                        <td>
                          <span className={`status-badge ${statusToClass(h.status)}`}>
                            {h.status}
                          </span>
                        </td>

                        <td>{h.registrationDate}</td>

                        {allowManage && (
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="row-actions">
                              <button
                                onClick={() => {
                                  setSelectedHousehold(h);
                                  setDetailMode("edit");
                                }}
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

          {/* DETAIL MODAL */}
          <HouseholdDetailModal
            household={selectedHousehold}
            mode={detailMode}
            onChangeMode={setDetailMode}
            onClose={() => setSelectedHousehold(null)}
            onSave={handleSaveHousehold}
          />

          {/* ADD MODAL */}
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
