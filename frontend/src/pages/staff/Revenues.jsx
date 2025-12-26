// src/pages/Revenues.jsx
import React, { useState, useMemo, useEffect } from "react";
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
import "../../styles/staff/layout.css";

const API_BASE = "http://localhost:5000/api";

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

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState(emptyTransactionForm);

  // ✅ fee records inside fee detail modal
  const [feeRecords, setFeeRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchFees();
  }, []);

  async function fetchFees() {
    try {
      const res = await axios.get(`${API_BASE}/fees/list`, { headers: authHeaders() });
      const list = Array.isArray(res.data) ? res.data : [];
      setFees(list);
    } catch (err) {
      console.error("fetchFees error:", err);
      setFees([]);
      alert("Không tải được danh sách khoản thu");
    }
  }

  async function fetchFeeRecordsByFeeId(feeId) {
    if (!feeId) return;
    setRecordsLoading(true);
    setRecordsError("");
    try {
      const res = await axios.get(`${API_BASE}/fees/history`, {
        headers: authHeaders(),
        params: { feeId },
      });
      setFeeRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchFeeRecordsByFeeId error:", err);
      setFeeRecords([]);
      setRecordsError(err.response?.data?.message || "Không tải được lịch sử thu");
    } finally {
      setRecordsLoading(false);
    }
  }

  const filteredFees = useMemo(() => {
    const list = Array.isArray(fees) ? fees : [];
    return list.filter((f) => {
      const matchSearch =
        !search.trim() || (f.name || "").toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || String(f.status) === String(statusFilter);

      const matchMandatory =
        mandatoryFilter === "ALL" ||
        (mandatoryFilter === "MANDATORY" && f.isMandatory) ||
        (mandatoryFilter === "OPTIONAL" && !f.isMandatory);

      return matchSearch && matchStatus && matchMandatory;
    });
  }, [fees, search, statusFilter, mandatoryFilter]);

  const stats = useMemo(() => {
    const list = Array.isArray(fees) ? fees : [];
    const total = list.length;
    const mandatory = list.filter((f) => !!f.isMandatory).length;
    const optional = list.filter((f) => !f.isMandatory).length;
    const active = list.filter((f) => f.status === 1).length;
    const inactive = list.filter((f) => f.status === 0).length;
    return { total, mandatory, optional, active, inactive };
  }, [fees]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, mandatoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFees.length / rowsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const pageFees = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredFees.slice(start, start + rowsPerPage);
  }, [filteredFees, currentPage, rowsPerPage]);

  const rangeText = useMemo(() => {
    const total = filteredFees.length;
    if (total === 0) return `0 - 0 trên tổng số 0 bản ghi`;
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, total);
    return `${start} - ${end} trên tổng số ${total} bản ghi`;
  }, [filteredFees.length, currentPage, rowsPerPage]);

  function getStatusLabel(status) {
    if (status === 1) return "Đang hoạt động";
    if (status === 0) return "Ngừng áp dụng";
    return "Khác";
  }

  function getRecordStatusLabel(status) {
    if (status === 2) return "Đã thu";
    if (status === 1) return "Thu một phần";
    return "Chưa thu";
  }

  function getRecordStatusClass(status) {
    if (status === 2) return "fee-status-badge fee-status-active";
    if (status === 1) return "fee-status-badge fee-status-partial";
    return "fee-status-badge fee-status-inactive";
  }

  function getDateRangeLabel(fee) {
    const hasFrom = !!fee.fromDate;
    const hasTo = !!fee.toDate;

    if (!hasFrom && !hasTo) return "Không thời hạn";

    const fromStr = hasFrom ? new Date(fee.fromDate).toLocaleDateString("vi-VN") : "";
    const toStr = hasTo ? new Date(fee.toDate).toLocaleDateString("vi-VN") : "";

    if (hasFrom && hasTo) return `${fromStr} – ${toStr}`;
    if (hasFrom && !hasTo) return `Từ ${fromStr}`;
    return `Đến ${toStr}`;
  }

  function feeToForm(fee) {
    if (!fee) return emptyFeeForm;
    return {
      name: fee.name || "",
      description: fee.description || "",
      isMandatory: !!fee.isMandatory,
      unitPrice: fee.unitPrice === 0 ? "" : fee.unitPrice != null ? String(fee.unitPrice) : "",
      status: String(fee.status ?? 1),
      fromDate: fee.fromDate ? String(fee.fromDate).slice(0, 10) : "",
      toDate: fee.toDate ? String(fee.toDate).slice(0, 10) : "",
    };
  }

  function openDetail(fee, mode = "view") {
    setSelectedFee(fee);
    setFeeMode(mode);
    setFeeForm(feeToForm(fee));
    setIsFeeModalOpen(true);

    // ✅ load records for this fee
    setFeeRecords([]);
    fetchFeeRecordsByFeeId(fee?.id);
  }

  function closeDetail() {
    setSelectedFee(null);
    setFeeMode("view");
    setIsFeeModalOpen(false);
    setFeeRecords([]);
    setRecordsError("");
    setRecordsLoading(false);
  }

  function openAddFee() {
    setFeeForm({ ...emptyFeeForm, status: "1" });
    setIsAddFeeOpen(true);
  }

  function closeAddFee() {
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
      const payload = {
        name: feeForm.name.trim(),
        description: feeForm.description.trim(),
        isMandatory: feeForm.isMandatory,
        unitPrice: feeForm.unitPrice === "" || feeForm.unitPrice == null ? null : parseFloat(feeForm.unitPrice),
        fromDate: feeForm.fromDate || null,
        toDate: feeForm.toDate || null,
      };

      if (!payload.name) return alert("Tên khoản thu không được để trống");

      const res = await axios.post(`${API_BASE}/fees/create`, payload, { headers: authHeaders() });

      const created = res.data?.data;
      if (created) setFees((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      else await fetchFees();

      setIsAddFeeOpen(false);
      setFeeForm(emptyFeeForm);
    } catch (err) {
      console.error("handleAddFeeSubmit error:", err);
      alert("Thêm khoản thu thất bại");
    }
  }

  async function handleUpdateFeeSubmit(e) {
    e.preventDefault();
    if (!selectedFee) return;

    try {
      const payload = {
        name: feeForm.name.trim(),
        description: feeForm.description.trim(),
        isMandatory: feeForm.isMandatory,
        unitPrice: feeForm.unitPrice === "" || feeForm.unitPrice == null ? null : parseFloat(feeForm.unitPrice),
        status: Number(feeForm.status),
        fromDate: feeForm.fromDate || null,
        toDate: feeForm.toDate || null,
      };

      if (!payload.name) return alert("Tên khoản thu không được để trống");

      const res = await axios.put(`${API_BASE}/fees/update/${selectedFee.id}`, payload, {
        headers: authHeaders(),
      });

      const updated = res.data?.data;
      if (updated) {
        setFees((prev) =>
          (Array.isArray(prev) ? prev : []).map((f) => (f.id === selectedFee.id ? updated : f))
        );
        setSelectedFee(updated);
      } else {
        await fetchFees();
      }

      setFeeMode("view");
    } catch (err) {
      console.error("handleUpdateFeeSubmit error:", err);
      alert("Cập nhật khoản thu thất bại");
    }
  }

  async function handleDeleteFee(id) {
    if (!window.confirm("Bạn có chắc muốn xóa khoản thu ID " + id + " ?")) return;
    try {
      await axios.delete(`${API_BASE}/fees/delete/${id}`, { headers: authHeaders() });
      setFees((prev) => (Array.isArray(prev) ? prev.filter((f) => f.id !== id) : []));
      if (selectedFee?.id === id) closeDetail();
    } catch (err) {
      const message = err.response?.data?.message || "Xóa khoản thu thất bại";
      alert(message);
    }
  }

  function openTransactionModal(fee) {
    setTransactionForm({
      feeId: fee?.id ? String(fee.id) : "",
      householdId: "",
      amount: fee?.unitPrice != null && !Number.isNaN(fee.unitPrice) ? String(fee.unitPrice) : "",
      note: "",
    });
    setIsTransactionModalOpen(true);
  }

  function closeTransactionModal() {
    setIsTransactionModalOpen(false);
  }

  function handleTransactionFormChange(e) {
    const { name, value } = e.target;
    setTransactionForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateTransactionSubmit(e) {
    e.preventDefault();
    if (!transactionForm.feeId || !transactionForm.householdId || !transactionForm.amount) {
      return alert("Vui lòng nhập đầy đủ thông tin giao dịch");
    }

    try {
      const payload = {
        feeId: Number(transactionForm.feeId),
        householdId: Number(transactionForm.householdId),
        amount: parseFloat(transactionForm.amount),
        note: transactionForm.note.trim(),
      };

      const res = await axios.post(`${API_BASE}/fees/pay`, payload, { headers: authHeaders() });

      alert(res.data?.message || "Ghi nhận thu phí thành công");
      setIsTransactionModalOpen(false);
      setTransactionForm(emptyTransactionForm);

      // ✅ refresh records if fee modal is open for same fee
      if (selectedFee?.id && Number(transactionForm.feeId) === Number(selectedFee.id)) {
        fetchFeeRecordsByFeeId(selectedFee.id);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Ghi nhận thu phí thất bại";
      alert(message);
    }
  }

  const recordsTotalAmount = useMemo(() => {
    if (!Array.isArray(feeRecords)) return 0;
    return feeRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [feeRecords]);

  const miniCards = [
    { label: "Tổng khoản thu", value: stats.total, icon: <FaMoneyBillWave />, tone: "blue" },
    { label: "Bắt buộc", value: stats.mandatory, icon: <FaCashRegister />, tone: "green" },
    { label: "Tự nguyện", value: stats.optional, icon: <FaPlus />, tone: "amber" },
    { label: "Đang áp dụng", value: stats.active, icon: <FaEdit />, tone: "slate" },
    { label: "Ngừng áp dụng", value: stats.inactive, icon: <FaTrash />, tone: "rose" },
  ];

  return (
    <div className="page-container revenues-page">
      <div className="stats-strip">
        {miniCards.map((c) => (
          <div key={c.label} className={`mini-card tone-${c.tone}`}>
            <div className="mini-ico">{c.icon}</div>
            <div className="mini-meta">
              <div className="mini-value">{c.value ?? 0}</div>
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
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="1">Đang hoạt động</option>
                  <option value="0">Ngừng áp dụng</option>
                </select>
              </div>

              <div className="toolbar-select">
                <select value={mandatoryFilter} onChange={(e) => setMandatoryFilter(e.target.value)}>
                  <option value="ALL">Tất cả loại khoản thu</option>
                  <option value="MANDATORY">Bắt buộc</option>
                  <option value="OPTIONAL">Tự nguyện</option>
                </select>
              </div>

              <div className="toolbar-search">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm theo tên khoản thu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="toolbar-right">
              <button className="btn-primary compact" onClick={openAddFee}>
                <FaPlus /> Thêm khoản thu
              </button>
            </div>
          </div>
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
                <th style={{ width: 130 }}>Thao tác</th>
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
                  <tr key={f.id} className="clickable-row" onClick={() => openDetail(f, "view")}>
                    <td>
                      <div className="fee-name">{f.name}</div>
                    </td>

                    <td>
                      <span className={f.isMandatory ? "fee-tag fee-tag-mandatory" : "fee-tag fee-tag-optional"}>
                        {f.isMandatory ? "Bắt buộc" : "Tự nguyện"}
                      </span>
                    </td>

                    <td className="money-cell">
                      {new Intl.NumberFormat("vi-VN").format(f.unitPrice ?? 0)} đ
                    </td>

                    <td>
                      <span className={f.fromDate || f.toDate ? "fee-date-range" : "fee-date-range fee-date-none"}>
                        {getDateRangeLabel(f)}
                      </span>
                    </td>

                    <td>
                      <span className={f.status === 1 ? "fee-status-badge fee-status-active" : "fee-status-badge fee-status-inactive"}>
                        {getStatusLabel(f.status)}
                      </span>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="row-actions">
                        <button type="button" title="Thu phí" onClick={() => openTransactionModal(f)}>
                          <FaCashRegister />
                        </button>
                        <button type="button" title="Sửa" onClick={() => openDetail(f, "edit")}>
                          <FaEdit />
                        </button>
                        <button type="button" title="Xóa" className="danger" onClick={() => handleDeleteFee(f.id)}>
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

        <div className="table-footer">
          <div className="footer-left">
            <span className="footer-muted">Số bản ghi</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setCurrentPage(1);
                setRowsPerPage(Number(e.target.value));
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>

          <div className="footer-right">
            <span className="footer-muted">{rangeText}</span>
            <div className="pager">
              <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                <FaChevronLeft />
              </button>
              <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODAL: VIEW/EDIT ===== */}
      {isFeeModalOpen && selectedFee && (
        <div className="resident-modal-overlay" onClick={closeDetail}>
          <div className="resident-modal" onClick={(e) => e.stopPropagation()}>
            <div className="resident-modal-header">
              <div>
                <h3 className="resident-modal-title">
                  {feeMode === "view" ? "Chi tiết khoản thu" : "Chỉnh sửa khoản thu"}
                </h3>
                <p className="resident-modal-sub">ID: #{selectedFee.id}</p>
              </div>

              <button className="modal-close-btn" type="button" onClick={closeDetail}>
                <FaTimes size={14} />
              </button>
            </div>

            <form
              onSubmit={feeMode === "edit" ? handleUpdateFeeSubmit : (e) => e.preventDefault()}
              className="resident-modal-body"
            >
              <div className="detail-grid">
                <div className="detail-item detail-wide">
                  <div className="detail-label">Tên khoản thu</div>
                  {feeMode === "view" ? (
                    <div className="detail-value">{selectedFee.name}</div>
                  ) : (
                    <div className="detail-value">
                      <input name="name" value={feeForm.name} onChange={handleFeeFormChange} required />
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <div className="detail-label">Đơn giá</div>
                  {feeMode === "view" ? (
                    <div className="detail-value">
                      {new Intl.NumberFormat("vi-VN").format(selectedFee.unitPrice ?? 0)} đ
                    </div>
                  ) : (
                    <div className="detail-value">
                      <input
                        name="unitPrice"
                        type="number"
                        min="0"
                        value={feeForm.unitPrice}
                        onChange={handleFeeFormChange}
                        placeholder="Để trống nếu không có"
                      />
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <div className="detail-label">Loại khoản thu</div>
                  {feeMode === "view" ? (
                    <div className="detail-value">{selectedFee.isMandatory ? "Bắt buộc" : "Tự nguyện"}</div>
                  ) : (
                    <div className="detail-value">
                      <select
                        name="isMandatory"
                        value={feeForm.isMandatory ? "1" : "0"}
                        onChange={(e) => setFeeForm((prev) => ({ ...prev, isMandatory: e.target.value === "1" }))}
                      >
                        <option value="1">Bắt buộc</option>
                        <option value="0">Tự nguyện</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <div className="detail-label">Trạng thái</div>
                  {feeMode === "view" ? (
                    <div className="detail-value">{getStatusLabel(selectedFee.status)}</div>
                  ) : (
                    <div className="detail-value">
                      <select name="status" value={feeForm.status} onChange={handleFeeFormChange}>
                        <option value="1">Đang hoạt động</option>
                        <option value="0">Ngừng áp dụng</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <div className="detail-label">Ngày bắt đầu</div>
                  {feeMode === "view" ? (
                    <div className="detail-value">
                      {selectedFee.fromDate ? new Date(selectedFee.fromDate).toLocaleDateString("vi-VN") : "—"}
                    </div>
                  ) : (
                    <div className="detail-value">
                      <input type="date" name="fromDate" value={feeForm.fromDate} onChange={handleFeeFormChange} />
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <div className="detail-label">Ngày kết thúc</div>
                  {feeMode === "view" ? (
                    <div className="detail-value">
                      {selectedFee.toDate ? new Date(selectedFee.toDate).toLocaleDateString("vi-VN") : "—"}
                    </div>
                  ) : (
                    <div className="detail-value">
                      <input type="date" name="toDate" value={feeForm.toDate} onChange={handleFeeFormChange} />
                    </div>
                  )}
                </div>

                <div className="detail-item detail-wide">
                  <div className="detail-label">Mô tả</div>
                  {feeMode === "view" ? (
                    <div className="detail-value">{selectedFee.description || "—"}</div>
                  ) : (
                    <div className="detail-value">
                      <textarea name="description" value={feeForm.description} onChange={handleFeeFormChange} />
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ FeeRecords section */}
              <div className="fee-records-section">
                <div className="fee-records-head">
                  <div className="fee-records-title">Lịch sử thu (FeeRecord)</div>
                  <div className="fee-records-sub">
                    Tổng thu: <b>{new Intl.NumberFormat("vi-VN").format(recordsTotalAmount)} đ</b>
                  </div>
                </div>

                {recordsLoading ? (
                  <div className="fee-records-empty">Đang tải lịch sử thu...</div>
                ) : recordsError ? (
                  <div className="fee-records-empty">{recordsError}</div>
                ) : feeRecords.length === 0 ? (
                  <div className="fee-records-empty">Chưa có lịch sử thu cho khoản này.</div>
                ) : (
                  <div className="fee-records-table-wrap">
                    <table className="fee-records-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Hộ khẩu</th>
                          <th>Số tiền</th>
                          <th>Ngày</th>
                          <th>Trạng thái</th>
                          <th>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feeRecords.map((r) => (
                          <tr key={r.id}>
                            <td>#{r.id}</td>
                            <td>
                              <div className="fr-owner">{r.household?.owner?.fullname || "—"}</div>
                              <div className="fr-address">{r.household?.address || "—"}</div>
                            </td>
                            <td className="money-cell">
                              {new Intl.NumberFormat("vi-VN").format(r.amount ?? 0)} đ
                            </td>
                            <td>{r.date ? new Date(r.date).toLocaleDateString("vi-VN") : "—"}</td>
                            <td>
                              <span className={getRecordStatusClass(r.status)}>
                                {getRecordStatusLabel(r.status)}
                              </span>
                            </td>
                            <td className="fr-note">{r.note || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="resident-modal-footer">
                {feeMode === "view" ? (
                  <>
                    <button className="btn-secondary" type="button" onClick={() => setFeeMode("edit")}>
                      <FaEdit /> Chỉnh sửa
                    </button>
                    <button className="btn-danger" type="button" onClick={() => handleDeleteFee(selectedFee.id)}>
                      <FaTrash /> Xóa
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => {
                        setFeeMode("view");
                        setFeeForm(feeToForm(selectedFee));
                      }}
                    >
                      Hủy
                    </button>
                    <button className="btn-primary" type="submit">
                      Lưu thay đổi
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: ADD ===== */}
      {isAddFeeOpen && (
        <div className="resident-modal-overlay" onClick={closeAddFee}>
          <div className="resident-modal" onClick={(e) => e.stopPropagation()}>
            <div className="resident-modal-header">
              <div>
                <h3 className="resident-modal-title">Thêm khoản thu mới</h3>
                <p className="resident-modal-sub">Tạo mới khoản thu</p>
              </div>

              <button className="modal-close-btn" type="button" onClick={closeAddFee}>
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleAddFeeSubmit} className="resident-modal-body">
              <div className="detail-grid">
                <div className="detail-item detail-wide">
                  <div className="detail-label">Tên khoản thu</div>
                  <div className="detail-value">
                    <input name="name" value={feeForm.name} onChange={handleFeeFormChange} required />
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Đơn giá</div>
                  <div className="detail-value">
                    <input
                      name="unitPrice"
                      type="number"
                      min="0"
                      value={feeForm.unitPrice}
                      onChange={handleFeeFormChange}
                      placeholder="Để trống nếu không có"
                    />
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Loại khoản thu</div>
                  <div className="detail-value">
                    <select
                      name="isMandatory"
                      value={feeForm.isMandatory ? "1" : "0"}
                      onChange={(e) => setFeeForm((prev) => ({ ...prev, isMandatory: e.target.value === "1" }))}
                    >
                      <option value="1">Bắt buộc</option>
                      <option value="0">Tự nguyện</option>
                    </select>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Trạng thái</div>
                  <div className="detail-value">
                    <input value="Đang hoạt động" disabled />
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Ngày bắt đầu</div>
                  <div className="detail-value">
                    <input type="date" name="fromDate" value={feeForm.fromDate} onChange={handleFeeFormChange} />
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Ngày kết thúc</div>
                  <div className="detail-value">
                    <input type="date" name="toDate" value={feeForm.toDate} onChange={handleFeeFormChange} />
                  </div>
                </div>

                <div className="detail-item detail-wide">
                  <div className="detail-label">Mô tả</div>
                  <div className="detail-value">
                    <textarea name="description" value={feeForm.description} onChange={handleFeeFormChange} />
                  </div>
                </div>
              </div>

              <div className="resident-modal-footer">
                <button className="btn-secondary" type="button" onClick={closeAddFee}>
                  Hủy
                </button>
                <button className="btn-primary" type="submit">
                  Thêm khoản thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: TRANSACTION ===== */}
      {isTransactionModalOpen && (
        <div className="resident-modal-overlay" onClick={closeTransactionModal}>
          <div className="resident-modal" onClick={(e) => e.stopPropagation()}>
            <div className="resident-modal-header">
              <div>
                <h3 className="resident-modal-title">Ghi nhận thu phí</h3>
                <p className="resident-modal-sub">Tạo giao dịch thu phí</p>
              </div>

              <button className="modal-close-btn" type="button" onClick={closeTransactionModal}>
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateTransactionSubmit} className="resident-modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">ID khoản thu</div>
                  <div className="detail-value">
                    <input name="feeId" type="number" value={transactionForm.feeId} readOnly />
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">ID hộ khẩu</div>
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
                  <div className="detail-label">Số tiền (VNĐ)</div>
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
                  <div className="detail-label">Ghi chú</div>
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
                <button className="btn-secondary" type="button" onClick={closeTransactionModal}>
                  Hủy
                </button>
                <button className="btn-primary" type="submit">
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
