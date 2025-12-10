// src/pages/Residents.jsx
import React, { useState, useMemo, useEffect } from "react";
import Header from "../components/Header.jsx";
import SideBar from "../components/SideBar.jsx";
import axios from "axios";
import {
  FaPlus,
  FaSearch,
  FaUserFriends,
  FaUserEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import "../styles/residents.css";

const RESIDENCY_STATUS = {
  0: { label: "Thường trú", className: "status-thuong_tru" },
  1: { label: "Tạm trú", className: "status-tam_tru" },
  2: { label: "Tạm vắng", className: "status-tam_vang" },
  3: { label: "Đã chuyển đi", className: "status-da_chuyen_di" },
  4: { label: "Đã qua đời", className: "status-da_qua_doi" },
};

function getResidencyStatusInfo(code) {
  return RESIDENCY_STATUS[code] || { label: "Không rõ", className: "" };
}

const emptyForm = {
  residentCCCD: "",
  fullname: "",
  dob: "",
  gender: "M",
  relationToOwner: "",
  status: "0",
  householdId: "",
};

export default function ResidentManagement() {
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");

  const [selectedResident, setSelectedResident] = useState(null);
  const [detailMode, setDetailMode] = useState("view"); // "view" | "edit"
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [formValues, setFormValues] = useState(emptyForm);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 4;

  useEffect(() => {
    fetchResidents();
  }, []);

  async function fetchResidents() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/residents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResidents(res.data.data);
    } catch {
      alert("Không tải được danh sách nhân khẩu");
    }
  }

  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const matchSearch =
        !search.trim() ||
        r.fullname.toLowerCase().includes(search.toLowerCase()) ||
        r.residentCCCD.includes(search);

      const matchStatus =
        statusFilter === "ALL" || String(r.status) === String(statusFilter);

      const matchGender =
        genderFilter === "ALL" ||
        (genderFilter === "Nam" && r.gender === "M") ||
        (genderFilter === "Nữ" && r.gender === "F");

      return matchSearch && matchStatus && matchGender;
    });
  }, [residents, search, statusFilter, genderFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredResidents.length / rowsPerPage)
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const pageResidents = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredResidents.slice(start, start + rowsPerPage);
  }, [filteredResidents, currentPage]);

  const stats = useMemo(() => {
    const total = residents.length;
    const count = (code) => residents.filter((r) => r.status === code).length;
    return {
      total,
      thuongTru: count(0),
      tamTru: count(1),
      tamVang: count(2),
      daChuyenDi: count(3),
      daQuaDoi: count(4),
    };
  }, [residents]);

  function residentToForm(r) {
    if (!r) return emptyForm;
    return {
      residentCCCD: r.residentCCCD || "",
      fullname: r.fullname || "",
      dob: r.dob ? r.dob.slice(0, 10) : "",
      gender: r.gender || "M",
      relationToOwner: r.relationToOwner || "",
      status: String(r.status ?? 0),
      householdId: r.householdId ? String(r.householdId) : "",
    };
  }

  const handleOpenDetail = (resident, mode = "view") => {
    setSelectedResident(resident);
    setDetailMode(mode);
    setFormValues(residentToForm(resident));
  };

  const handleCloseDetail = () => {
    setSelectedResident(null);
    setDetailMode("view");
  };

  const handleOpenAdd = () => {
    setFormValues(emptyForm);
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
  };

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = {
        residentCCCD: formValues.residentCCCD,
        fullname: formValues.fullname,
        dob: formValues.dob,
        gender: formValues.gender,
        relationToOwner: formValues.relationToOwner,
        status: Number(formValues.status),
        householdId: Number(formValues.householdId),
      };
      const res = await axios.post(
        "http://localhost:5000/api/residents",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setResidents((prev) => [res.data.data, ...prev]);
      setIsAddOpen(false);
      setFormValues(emptyForm);
    } catch (err) {
      alert("Thêm nhân khẩu thất bại");
    }
  }

  async function handleUpdateSubmit(e) {
    e.preventDefault();
    if (!selectedResident) return;
    try {
      const token = localStorage.getItem("token");
      const payload = {
        residentCCCD: formValues.residentCCCD,
        fullname: formValues.fullname,
        dob: formValues.dob,
        gender: formValues.gender,
        relationToOwner: formValues.relationToOwner,
        status: Number(formValues.status),
        householdId: Number(formValues.householdId),
      };
      const res = await axios.put(
        `http://localhost:5000/api/residents/${selectedResident.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setResidents((prev) =>
        prev.map((r) => (r.id === selectedResident.id ? res.data.data : r))
      );
      setSelectedResident(res.data.data);
      setDetailMode("view");
    } catch (err) {
      alert("Cập nhật nhân khẩu thất bại");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc muốn xóa nhân khẩu ID " + id + " ?"))
      return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/residents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResidents((prev) => prev.filter((r) => r.id !== id));
      if (selectedResident && selectedResident.id === id) {
        handleCloseDetail();
      }
    } catch {
      alert("Xóa nhân khẩu thất bại");
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

            <button className="btn-primary" onClick={handleOpenAdd}>
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
                  onChange={(e) => {
                    setCurrentPage(1);
                    setSearch(e.target.value);
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setStatusFilter(e.target.value);
                }}
              >
                <option value="ALL">Tất cả tình trạng cư trú</option>
                <option value="0">Thường trú</option>
                <option value="1">Tạm trú</option>
                <option value="2">Tạm vắng</option>
                <option value="3">Đã chuyển đi</option>
                <option value="4">Đã qua đời</option>
              </select>

              <select
                value={genderFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setGenderFilter(e.target.value);
                }}
              >
                <option value="ALL">Giới tính (tất cả)</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
          </div>

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
              <p className="stat-label">Tạm vắng</p>
              <p className="stat-value">{stats.tamVang}</p>
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
                    <tr>
                      <td colSpan={8} className="empty-row">
                        Không có nhân khẩu phù hợp
                      </td>
                    </tr>
                  ) : (
                    pageResidents.map((r) => {
                      const info = getResidencyStatusInfo(r.status);
                      const age =
                        new Date().getFullYear() -
                        new Date(r.dob).getFullYear();

                      return (
                        <tr
                          key={r.id}
                          className="clickable-row"
                          onClick={() => handleOpenDetail(r, "view")}
                        >
                          <td>{r.fullname}</td>
                          <td>{r.gender === "M" ? "Nam" : "Nữ"}</td>

                          <td>
                            {r.dob.slice(0, 10)}
                            <div className="sub-text">{age} tuổi</div>
                          </td>

                          <td className="cccd-cell">{r.residentCCCD}</td>
                          <td>{r.household?.address || "Không rõ"}</td>

                          <td>
                            <span
                              className={`status-badge ${info.className}`}
                            >
                              {info.label}
                            </span>
                          </td>

                          <td>{r.createdAt.slice(0, 10)}</td>

                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="row-actions">
                              <button
                                onClick={() => handleOpenDetail(r, "view")}
                              >
                                <FaEye />
                              </button>
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
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <FaChevronLeft />
              </button>

              <span>
                Trang {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>



          {selectedResident && (
            <div className="resident-modal-overlay">
              <div className="resident-modal">
                <div className="resident-modal-header">
                  <div>
                    <p className="resident-modal-label">
                      {detailMode === "view"
                        ? "Thông tin nhân khẩu"
                        : "Chỉnh sửa nhân khẩu"}
                    </p>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={handleCloseDetail}
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                <form
                  onSubmit={
                    detailMode === "edit" ? handleUpdateSubmit : (e) => e.preventDefault()
                  }
                  className="resident-modal-body"
                >
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Họ và tên</span>
                      {detailMode === "view" ? (
                        <span className="detail-value">
                          {selectedResident.fullname}
                        </span>
                      ) : (
                        <div className="detail-value">
                          <input
                            name="fullname"
                            value={formValues.fullname}
                            onChange={handleFormChange}
                          />
                        </div>
                      )}
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">CCCD</span>
                      {detailMode === "view" ? (
                        <span className="detail-value">
                          {selectedResident.residentCCCD}
                        </span>
                      ) : (
                        <div className="detail-value">
                          <input
                            name="residentCCCD"
                            value={formValues.residentCCCD}
                            onChange={handleFormChange}
                          />
                        </div>
                      )}
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Ngày sinh</span>
                      {detailMode === "view" ? (
                        <span className="detail-value">
                          {selectedResident.dob.slice(0, 10)}
                        </span>
                      ) : (
                        <div className="detail-value">
                          <input
                            type="date"
                            name="dob"
                            value={formValues.dob}
                            onChange={handleFormChange}
                          />
                        </div>
                      )}
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Giới tính</span>
                      {detailMode === "view" ? (
                        <span className="detail-value">
                          {selectedResident.gender === "M" ? "Nam" : "Nữ"}
                        </span>
                      ) : (
                        <div className="detail-value">
                          <select
                            name="gender"
                            value={formValues.gender}
                            onChange={handleFormChange}
                          >
                            <option value="M">Nam</option>
                            <option value="F">Nữ</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Quan hệ với chủ hộ</span>
                      {detailMode === "view" ? (
                        <span className="detail-value">
                          {selectedResident.relationToOwner || "Không rõ"}
                        </span>
                      ) : (
                        <div className="detail-value">
                          <input
                            name="relationToOwner"
                            value={formValues.relationToOwner}
                            onChange={handleFormChange}
                          />
                        </div>
                      )}
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Hộ khẩu</span>
                      {detailMode === "view" ? (
                        <span className="detail-value">
                          {selectedResident.household?.address || "Không rõ"}
                        </span>
                      ) : (
                        <div className="detail-value">
                          <input
                            name="householdId"
                            value={formValues.householdId}
                            onChange={handleFormChange}
                            placeholder="ID hộ khẩu"
                          />
                        </div>
                      )}
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Tình trạng cư trú</span>
                      {detailMode === "view" ? (
                        <span className="detail-value">
                          {getResidencyStatusInfo(
                            selectedResident.status
                          ).label}
                        </span>
                      ) : (
                        <div className="detail-value">
                          <select
                            name="status"
                            value={formValues.status}
                            onChange={handleFormChange}
                          >
                            <option value="0">Thường trú</option>
                            <option value="1">Tạm trú</option>
                            <option value="2">Tạm vắng</option>
                            <option value="3">Đã chuyển đi</option>
                            <option value="4">Đã qua đời</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="detail-item detail-wide">
                      <span className="detail-label">Ngày tạo bản ghi</span>
                      <span className="detail-value">
                        {selectedResident.createdAt.slice(0, 10)}
                      </span>
                    </div>
                  </div>

                  <div className="resident-modal-footer">
                    {detailMode === "view" ? (
                      <>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setDetailMode("edit")}
                        >
                          <FaUserEdit /> Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleDelete(selectedResident.id)}
                        >
                          <FaTrash /> Xóa
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setDetailMode("view");
                            setFormValues(residentToForm(selectedResident));
                          }}
                        >
                          Hủy
                        </button>
                        <button type="submit" className="btn-primary">
                          Lưu thay đổi
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {isAddOpen && (
            <div className="resident-modal-overlay">
              <div className="resident-modal">
                <div className="resident-modal-header">
                  <div>
                    <h3 className="resident-modal-title">
                      Thêm nhân khẩu mới
                    </h3>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={handleCloseAdd}
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                <form
                  onSubmit={handleAddSubmit}
                  className="resident-modal-body"
                >
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Họ và tên</span>
                      <div className="detail-value">
                        <input
                          name="fullname"
                          value={formValues.fullname}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">CCCD</span>
                      <div className="detail-value">
                        <input
                          name="residentCCCD"
                          value={formValues.residentCCCD}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Ngày sinh</span>
                      <div className="detail-value">
                        <input
                          type="date"
                          name="dob"
                          value={formValues.dob}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Giới tính</span>
                      <div className="detail-value">
                        <select
                          name="gender"
                          value={formValues.gender}
                          onChange={handleFormChange}
                        >
                          <option value="M">Nam</option>
                          <option value="F">Nữ</option>
                        </select>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Quan hệ với chủ hộ</span>
                      <div className="detail-value">
                        <input
                          name="relationToOwner"
                          value={formValues.relationToOwner}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">ID hộ khẩu</span>
                      <div className="detail-value">
                        <input
                          name="householdId"
                          value={formValues.householdId}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Tình trạng cư trú</span>
                      <div className="detail-value">
                        <select
                          name="status"
                          value={formValues.status}
                          onChange={handleFormChange}
                        >
                          <option value="0">Thường trú</option>
                          <option value="1">Tạm trú</option>
                          <option value="2">Tạm vắng</option>
                          <option value="3">Đã chuyển đi</option>
                          <option value="4">Đã qua đời</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="resident-modal-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCloseAdd}
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
          )}
        </div>
      </div>
    </div>
  );
}
