// src/pages/Revenues.jsx
import React, { useState, useMemo, useEffect } from "react";
import Header from "../../components/staff/Header.jsx";
import SideBar from "../../components/staff/SideBar.jsx";
import axios from "axios";
import {
  FaPlus,
  FaSearch,
  FaMoneyBillWave,
  FaEdit,
  FaTrash,
  FaCashRegister,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";
import "../../styles/staff/fees.css";

const emptyFeeForm = {
  name: "",
  description: "",
  isMandatory: false,
  unitPrice: "",
  status: "1",
  fromDate: "",
  toDate: "",
};

const emptyTransactionForm = {
  feeId: "",
  householdId: "",
  amount: "",
  note: "",
};

export default function RevenuesManagement() {
  const [fees, setFees] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [mandatoryFilter, setMandatoryFilter] = useState("ALL");

  const [selectedFee, setSelectedFee] = useState(null);
  const [feeMode, setFeeMode] = useState("view");
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false);
  const [feeForm, setFeeForm] = useState(emptyFeeForm);

  const [feesPage, setFeesPage] = useState(1);
  const feesPerPage = 4;

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState(emptyTransactionForm);

  useEffect(() => {
    fetchFees();
  }, []);

  async function fetchFees() {
    try {
      console.log("📌 [DEBUG] Fetching FEES...");
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/fees/list", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      console.log("📌 [DEBUG] /api/fees/list response:", res.data);

      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      console.log("📌 [DEBUG] Parsed fees list:", list);
      setFees(list);
    } catch (err) {
      console.error("❌ [DEBUG] fetchFees error:", err);
      setFees([]);
      alert("Không tải được danh sách khoản thu");
    }
  }

  const filteredFees = useMemo(() => {
    const list = Array.isArray(fees) ? fees : [];
    console.log("📌 [DEBUG] Filtering fees with:", {
      search,
      statusFilter,
      mandatoryFilter,
      totalFees: list.length,
    });

    const result = list.filter((f) => {
      const matchSearch =
        !search.trim() ||
        (f.name || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "ALL" || String(f.status) === String(statusFilter);
      const matchMandatory =
        mandatoryFilter === "ALL" ||
        (mandatoryFilter === "MANDATORY" && f.isMandatory) ||
        (mandatoryFilter === "OPTIONAL" && !f.isMandatory);
      return matchSearch && matchStatus && matchMandatory;
    });

    console.log("📌 [DEBUG] filteredFees result:", result);
    return result;
  }, [fees, search, statusFilter, mandatoryFilter]);

  const totalFeePages = Math.max(
    1,
    Math.ceil(filteredFees.length / feesPerPage)
  );

  useEffect(() => {
    if (feesPage > totalFeePages) setFeesPage(1);
  }, [totalFeePages, feesPage]);

  const pageFees = useMemo(() => {
    const start = (feesPage - 1) * feesPerPage;
    const slice = filteredFees.slice(start, start + feesPerPage);
    console.log("📌 [DEBUG] pageFees:", slice);
    return slice;
  }, [filteredFees, feesPage]);

  const stats = useMemo(() => {
    const list = Array.isArray(fees) ? fees : [];
    const total = list.length;
    const mandatory = list.filter((f) => f.isMandatory).length;
    const optional = list.filter((f) => !f.isMandatory).length;
    const active = list.filter((f) => f.status === 1).length;
    const inactive = list.filter((f) => f.status === 0).length;
    const result = { total, mandatory, optional, active, inactive };
    console.log("📌 [DEBUG] stats:", result);
    return result;
  }, [fees]);

  function feeToForm(fee) {
    if (!fee) return emptyFeeForm;
    return {
      name: fee.name || "",
      description: fee.description || "",
      isMandatory: !!fee.isMandatory,
      unitPrice: fee.unitPrice != null ? String(fee.unitPrice) : "",
      status: String(fee.status ?? 1),
      fromDate: fee.fromDate ? String(fee.fromDate).slice(0, 10) : "",
      toDate: fee.toDate ? String(fee.toDate).slice(0, 10) : "",
    };
  }

  function handleOpenFeeDetail(fee, mode = "view") {
    setSelectedFee(fee);
    setFeeMode(mode);
    setFeeForm(feeToForm(fee));
    setIsFeeModalOpen(true);
  }

  function handleCloseFeeDetail() {
    setSelectedFee(null);
    setFeeMode("view");
    setIsFeeModalOpen(false);
  }

  function handleOpenAddFee() {
    setFeeForm(emptyFeeForm);
    setIsAddFeeOpen(true);
  }

  function handleCloseAddFee() {
    setIsAddFeeOpen(false);
  }

  function handleFeeFormChange(e) {
    const { name, value, type, checked } = e.target;
    setFeeForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleAddFeeSubmit(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: feeForm.name.trim(),
        description: feeForm.description.trim(),
        isMandatory: feeForm.isMandatory,
        unitPrice:
          feeForm.unitPrice === "" ? 0 : parseFloat(feeForm.unitPrice),
        status: Number(feeForm.status),
        fromDate: feeForm.fromDate || null,
        toDate: feeForm.toDate || null,
      };

      if (!payload.name) {
        alert("Tên khoản thu không được để trống");
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/fees/create",
        payload,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const newFee = res.data?.data || res.data;
      setFees((prev) => [newFee, ...(Array.isArray(prev) ? prev : [])]);
      setIsAddFeeOpen(false);
      setFeeForm(emptyFeeForm);
    } catch (err) {
      console.error("❌ [DEBUG] handleAddFeeSubmit error:", err);
      alert("Thêm khoản thu thất bại");
    }
  }

  async function handleUpdateFeeSubmit(e) {
    e.preventDefault();
    if (!selectedFee) return;
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: feeForm.name.trim(),
        description: feeForm.description.trim(),
        isMandatory: feeForm.isMandatory,
        unitPrice:
          feeForm.unitPrice === "" ? 0 : parseFloat(feeForm.unitPrice),
        status: Number(feeForm.status),
        fromDate: feeForm.fromDate || null,
        toDate: feeForm.toDate || null,
      };
      if (!payload.name) {
        alert("Tên khoản thu không được để trống");
        return;
      }
      const res = await axios.put(
        `http://localhost:5000/api/fees/update/${selectedFee.id}`,
        payload,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const updated = res.data?.data || res.data;
      setFees((prev) =>
        (Array.isArray(prev) ? prev : []).map((f) =>
          f.id === selectedFee.id ? updated : f
        )
      );
      setSelectedFee(updated);
      setFeeMode("view");
    } catch (err) {
      console.error("❌ [DEBUG] handleUpdateFeeSubmit error:", err);
      alert("Cập nhật khoản thu thất bại");
    }
  }

  async function handleDeleteFee(id) {
    if (!window.confirm("Bạn có chắc muốn xóa khoản thu ID " + id + " ?"))
      return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/fees/delete/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setFees((prev) =>
        Array.isArray(prev) ? prev.filter((f) => f.id !== id) : []
      );
      if (selectedFee && selectedFee.id === id) {
        handleCloseFeeDetail();
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Xóa khoản thu thất bại";
      alert(message);
    }
  }

  function handleOpenTransactionModal(fee) {
    setTransactionForm({
      feeId: fee?.id ? String(fee.id) : "",
      householdId: "",
      amount:
        fee?.unitPrice != null && !Number.isNaN(fee.unitPrice)
          ? String(fee.unitPrice)
          : "",
      note: "",
    });
    setIsTransactionModalOpen(true);
  }

  function handleCloseTransactionModal() {
    setIsTransactionModalOpen(false);
  }

  function handleTransactionFormChange(e) {
    const { name, value } = e.target;
    setTransactionForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateTransactionSubmit(e) {
    e.preventDefault();
    if (
      !transactionForm.feeId ||
      !transactionForm.householdId ||
      !transactionForm.amount
    ) {
      alert("Vui lòng nhập đầy đủ thông tin giao dịch");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        feeId: Number(transactionForm.feeId),
        householdId: Number(transactionForm.householdId),
        amount: parseFloat(transactionForm.amount),
        note: transactionForm.note.trim(),
      };
      await axios.post("http://localhost:5000/api/fees/pay", payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      alert("Ghi nhận thu phí thành công");
      setIsTransactionModalOpen(false);
      setTransactionForm(emptyTransactionForm);
    } catch (err) {
      const message =
        err.response?.data?.message || "Ghi nhận thu phí thất bại";
      alert(message);
    }
  }

  function getStatusLabel(status) {
    if (status === 1) return "Đang hoạt động";
    if (status === 0) return "Ngừng áp dụng";
    return "Khác";
  }

  function getDateRangeLabel(fee) {
    const hasFrom = !!fee.fromDate;
    const hasTo = !!fee.toDate;

    if (!hasFrom && !hasTo) return "Không thời hạn";

    const fromStr = hasFrom
      ? new Date(fee.fromDate).toLocaleDateString("vi-VN")
      : "";
    const toStr = hasTo
      ? new Date(fee.toDate).toLocaleDateString("vi-VN")
      : "";

    if (hasFrom && hasTo) {
      return `Từ ${fromStr} – đến ${toStr}`;
    }
    if (hasFrom && !hasTo) {
      return `Từ ${fromStr}`;
    }
    return `Đến ${toStr}`;
  }

  console.log("📌 [DEBUG] RENDER fees:", fees);

  return (

    <div className="mainContent revenues-page">
      <div className="page-header">
        <h2 className="page-title">
          <FaMoneyBillWave className="page-title-icon" />
          Quản lý khoản thu
        </h2>

        <button className="btn-primary" onClick={handleOpenAddFee}>
          <FaPlus /> Thêm khoản thu
        </button>
      </div>

      <div className="card filter-card">
        <div className="filter-grid basic-3">
          <div className="filter-input search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm theo tên khoản thu..."
              value={search}
              onChange={(e) => {
                setFeesPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setFeesPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="1">Đang hoạt động</option>
            <option value="0">Ngừng áp dụng</option>
          </select>

          <select
            value={mandatoryFilter}
            onChange={(e) => {
              setFeesPage(1);
              setMandatoryFilter(e.target.value);
            }}
          >
            <option value="ALL">Tất cả loại khoản thu</option>
            <option value="MANDATORY">Bắt buộc</option>
            <option value="OPTIONAL">Tự nguyện</option>
          </select>
        </div>
      </div>

      <div className="stats-mini">
        <div className="stat-card">
          <p className="stat-label">Tổng khoản thu</p>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Khoản thu bắt buộc</p>
          <p className="stat-value">{stats.mandatory}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Khoản thu tự nguyện</p>
          <p className="stat-value">{stats.optional}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Đang áp dụng</p>
          <p className="stat-value">{stats.active}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Ngừng áp dụng</p>
          <p className="stat-value">{stats.inactive}</p>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-header">
          Danh sách khoản thu ({filteredFees.length} bản ghi)
        </div>

        <div className="table-wrapper">
          <table className="fee-table">
            <thead>
              <tr>
                <th>Tên khoản thu</th>
                <th>Loại</th>
                <th>Đơn giá</th>
                <th>Thời gian áp dụng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pageFees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-row">
                    Không có khoản thu phù hợp
                  </td>
                </tr>
              ) : (
                pageFees.map((f) => (
                  <tr key={f.id} className="clickable-row">
                    <td onClick={() => handleOpenFeeDetail(f, "view")}>
                      <div className="fee-name">{f.name}</div>
                    </td>

                    <td onClick={() => handleOpenFeeDetail(f, "view")}>
                      <span
                        className={
                          f.isMandatory
                            ? "fee-tag fee-tag-mandatory"
                            : "fee-tag fee-tag-optional"
                        }
                      >
                        {f.isMandatory ? "Bắt buộc" : "Tự nguyện"}
                      </span>
                    </td>

                    <td onClick={() => handleOpenFeeDetail(f, "view")}>
                      {new Intl.NumberFormat("vi-VN").format(
                        f.unitPrice || 0
                      )}{" "}
                      đ
                    </td>

                    <td onClick={() => handleOpenFeeDetail(f, "view")}>
                      <span
                        className={
                          f.fromDate || f.toDate
                            ? "fee-date-range"
                            : "fee-date-range fee-date-none"
                        }
                      >
                        {getDateRangeLabel(f)}
                      </span>
                    </td>

                    <td onClick={() => handleOpenFeeDetail(f, "view")}>
                      <span
                        className={
                          f.status === 1
                            ? "fee-status-badge fee-status-active"
                            : "fee-status-badge fee-status-inactive"
                        }
                      >
                        {getStatusLabel(f.status)}
                      </span>
                    </td>

                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="fee-row-actions-cell"
                    >
                      <div className="row-actions">
                        <button
                          onClick={() => handleOpenTransactionModal(f)}
                        >
                          <FaCashRegister />
                        </button>
                        <button
                          onClick={() => handleOpenFeeDetail(f, "edit")}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="danger"
                          onClick={() => handleDeleteFee(f.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            disabled={feesPage === 1}
            onClick={() => setFeesPage((p) => p - 1)}
          >
            <FaChevronLeft />
          </button>

          <span>
            Trang {feesPage} / {totalFeePages}
          </span>

          <button
            disabled={feesPage === totalFeePages}
            onClick={() => setFeesPage((p) => p + 1)}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {isFeeModalOpen && selectedFee && (
        <div className="resident-modal-overlay">
          <div className="resident-modal">
            <div className="resident-modal-header">
              <div>
                <p className="resident-modal-label">
                  {feeMode === "view"
                    ? "Thông tin khoản thu"
                    : "Chỉnh sửa khoản thu"}
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={handleCloseFeeDetail}
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form
              onSubmit={
                feeMode === "edit"
                  ? handleUpdateFeeSubmit
                  : (e) => e.preventDefault()
              }
              className="resident-modal-body"
            >
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Tên khoản thu</span>
                  {feeMode === "view" ? (
                    <span className="detail-value">
                      {selectedFee.name}
                    </span>
                  ) : (
                    <div className="detail-value">
                      <input
                        name="name"
                        value={feeForm.name}
                        onChange={handleFeeFormChange}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Đơn giá</span>
                  {feeMode === "view" ? (
                    <span className="detail-value">
                      {new Intl.NumberFormat("vi-VN").format(
                        selectedFee.unitPrice || 0
                      )}{" "}
                      đ
                    </span>
                  ) : (
                    <div className="detail-value">
                      <input
                        type="number"
                        name="unitPrice"
                        value={feeForm.unitPrice}
                        onChange={handleFeeFormChange}
                        min="0"
                      />
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Ngày bắt đầu</span>
                  {feeMode === "view" ? (
                    <span className="detail-value">
                      {selectedFee.fromDate
                        ? new Date(
                          selectedFee.fromDate
                        ).toLocaleDateString("vi-VN")
                        : "Không có"}
                    </span>
                  ) : (
                    <div className="detail-value">
                      <input
                        type="date"
                        name="fromDate"
                        value={feeForm.fromDate}
                        onChange={handleFeeFormChange}
                      />
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Ngày kết thúc</span>
                  {feeMode === "view" ? (
                    <span className="detail-value">
                      {selectedFee.toDate
                        ? new Date(
                          selectedFee.toDate
                        ).toLocaleDateString("vi-VN")
                        : "Không có"}
                    </span>
                  ) : (
                    <div className="detail-value">
                      <input
                        type="date"
                        name="toDate"
                        value={feeForm.toDate}
                        onChange={handleFeeFormChange}
                      />
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Loại khoản thu</span>
                  {feeMode === "view" ? (
                    <span className="detail-value">
                      {selectedFee.isMandatory
                        ? "Bắt buộc"
                        : "Tự nguyện"}
                    </span>
                  ) : (
                    <div className="detail-value">
                      <select
                        name="isMandatory"
                        value={feeForm.isMandatory ? "1" : "0"}
                        onChange={(e) =>
                          setFeeForm((prev) => ({
                            ...prev,
                            isMandatory: e.target.value === "1",
                          }))
                        }
                      >
                        <option value="1">Bắt buộc</option>
                        <option value="0">Tự nguyện</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <span className="detail-label">Trạng thái</span>
                  {feeMode === "view" ? (
                    <span className="detail-value">
                      {getStatusLabel(selectedFee.status)}
                    </span>
                  ) : (
                    <div className="detail-value">
                      <select
                        name="status"
                        value={feeForm.status}
                        onChange={handleFeeFormChange}
                      >
                        <option value="1">Đang hoạt động</option>
                        <option value="0">Ngừng áp dụng</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="detail-item detail-wide">
                  <span className="detail-label">Mô tả</span>
                  {feeMode === "view" ? (
                    <span className="detail-value">
                      {selectedFee.description || "Không có"}
                    </span>
                  ) : (
                    <div className="detail-value">
                      <textarea
                        name="description"
                        value={feeForm.description}
                        onChange={handleFeeFormChange}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="resident-modal-footer">
                {feeMode === "view" ? (
                  <>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setFeeMode("edit")}
                    >
                      <FaEdit /> Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleDeleteFee(selectedFee.id)}
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
                        setFeeMode("view");
                        setFeeForm(feeToForm(selectedFee));
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

      {isAddFeeOpen && (
        <div className="resident-modal-overlay">
          <div className="resident-modal">
            <div className="resident-modal-header">
              <div>
                <h3 className="resident-modal-title">
                  Thêm khoản thu mới
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={handleCloseAddFee}
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form
              onSubmit={handleAddFeeSubmit}
              className="resident-modal-body"
            >
              <div className="detail-grid">
                <div className="detail-item detail-wide">
                  <span className="detail-label">Tên khoản thu</span>
                  <div className="detail-value">
                    <input
                      name="name"
                      value={feeForm.name}
                      onChange={handleFeeFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Đơn giá (VNĐ)</span>
                  <div className="detail-value">
                    <input
                      type="number"
                      name="unitPrice"
                      value={feeForm.unitPrice}
                      min="0"
                      onChange={handleFeeFormChange}
                    />
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Loại khoản thu</span>
                  <div className="detail-value">
                    <select
                      name="isMandatory"
                      value={feeForm.isMandatory ? "1" : "0"}
                      onChange={(e) =>
                        setFeeForm((prev) => ({
                          ...prev,
                          isMandatory: e.target.value === "1",
                        }))
                      }
                    >
                      <option value="1">Bắt buộc</option>
                      <option value="0">Tự nguyện</option>
                    </select>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Trạng thái</span>
                  <div className="detail-value">
                    <select
                      name="status"
                      value={feeForm.status}
                      onChange={handleFeeFormChange}
                    >
                      <option value="1">Đang hoạt động</option>
                      <option value="0">Ngừng áp dụng</option>
                    </select>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Ngày bắt đầu</span>
                  <div className="detail-value">
                    <input
                      type="date"
                      name="fromDate"
                      value={feeForm.fromDate}
                      onChange={handleFeeFormChange}
                    />
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Ngày kết thúc</span>
                  <div className="detail-value">
                    <input
                      type="date"
                      name="toDate"
                      value={feeForm.toDate}
                      onChange={handleFeeFormChange}
                    />
                  </div>
                </div>

                <div className="detail-item detail-wide">
                  <span className="detail-label">Mô tả</span>
                  <div className="detail-value">
                    <textarea
                      name="description"
                      value={feeForm.description}
                      onChange={handleFeeFormChange}
                    />
                  </div>
                </div>
              </div>

              <div className="resident-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseAddFee}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Thêm khoản thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTransactionModalOpen && (
        <div className="resident-modal-overlay">
          <div className="resident-modal">
            <div className="resident-modal-header">
              <div>
                <h3 className="resident-modal-title">Ghi nhận thu phí</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={handleCloseTransactionModal}
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form
              onSubmit={handleCreateTransactionSubmit}
              className="resident-modal-body"
            >
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">ID khoản thu</span>
                  <div className="detail-value">
                    <input
                      name="feeId"
                      type="number"
                      value={transactionForm.feeId}
                      onChange={handleTransactionFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">ID hộ khẩu</span>
                  <div className="detail-value">
                    <input
                      name="householdId"
                      type="number"
                      value={transactionForm.householdId}
                      onChange={handleTransactionFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Số tiền (VNĐ)</span>
                  <div className="detail-value">
                    <input
                      name="amount"
                      type="number"
                      min="0"
                      value={transactionForm.amount}
                      onChange={handleTransactionFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="detail-item detail-wide">
                  <span className="detail-label">Ghi chú</span>
                  <div className="detail-value">
                    <textarea
                      name="note"
                      value={transactionForm.note}
                      onChange={handleTransactionFormChange}
                      placeholder="Ví dụ: Đã thu đủ, thu một phần..."
                    />
                  </div>
                </div>
              </div>

              <div className="resident-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseTransactionModal}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Xác nhận thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
