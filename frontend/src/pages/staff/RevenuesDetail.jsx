// src/pages/staff/RevenuesDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaChevronLeft,
  FaCashRegister,
  FaSearch,
  FaChevronRight,
  FaEye,
  FaPen
} from "react-icons/fa";
import { GiPayMoney, GiReceiveMoney } from "react-icons/gi";
import { GrMoney } from "react-icons/gr";

import "../../styles/staff/fees.css";
import "../../styles/staff/layout.css";

const API_BASE = "http://localhost:5000/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function RevenuesDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const feeId = id;

  const [fee, setFee] = useState(null);

  const [summaryRows, setSummaryRows] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summarySearch, setSummarySearch] = useState("");

  const [rowEdits, setRowEdits] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [txOpen, setTxOpen] = useState(false);
  const [txHousehold, setTxHousehold] = useState(null);
  const [txRows, setTxRows] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");

  const [editTx, setEditTx] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (!feeId) return;
    fetchFeeInfo(feeId);
    fetchFeeSummaryByFeeId(feeId);
  }, [feeId]);

  async function fetchFeeInfo(id) {
    try {
      const res = await axios.get(`${API_BASE}/fees/list`, { headers: authHeaders() });
      const list = Array.isArray(res.data) ? res.data : [];
      const found = list.find((x) => String(x.id) === String(id));
      setFee(found || null);
    } catch (err) {
      console.error("fetchFeeInfo error:", err);
      setFee(null);
    }
  }

  async function fetchFeeSummaryByFeeId(id) {
    if (!id) return;
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const res = await axios.get(`${API_BASE}/fees/summary`, {
        headers: authHeaders(),
        params: { feeId: id },
      });

      const rows = Array.isArray(res.data) ? res.data : [];
      setSummaryRows(rows);

      setRowEdits((prev) => {
        const next = { ...(prev || {}) };
        rows.forEach((r) => {
          const hhId = r?.household?.id;
          if (!hhId) return;
          if (!next[hhId]) next[hhId] = { amount: "", saving: false };
          else next[hhId] = { ...next[hhId], amount: next[hhId].amount ?? "", saving: false };
        });
        Object.keys(next).forEach((k) => {
          const hhId = Number(k);
          const stillExists = rows.some((r) => Number(r?.household?.id) === hhId);
          if (!stillExists) delete next[k];
        });
        return next;
      });
    } catch (err) {
      console.error("fetchFeeSummaryByFeeId error:", err);
      setSummaryRows([]);
      setSummaryError(err.response?.data?.message || "Không tải được bảng tổng hợp theo hộ");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function fetchTransactions(feeTypeId, hhId) {
    setTxLoading(true);
    setTxError("");
    try {
      const res = await axios.get(`${API_BASE}/fees/history`, {
        headers: authHeaders(),
        params: { feeId: feeTypeId, householdId: hhId, method: "OFFLINE" },
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      setTxRows(rows);
    } catch (err) {
      console.error("fetchTransactions error:", err);
      setTxRows([]);
      setTxError(err.response?.data?.message || "Không tải được lịch sử thu");
    } finally {
      setTxLoading(false);
    }
  }

  async function openTransactions(row) {
    const feeTypeId = Number(feeId);
    const hh = row?.household || {};
    if (!feeTypeId || !hh?.id) return;
    setTxHousehold(hh);
    setTxOpen(true);
    setEditTx(null);
    setEditAmount("");
    setEditNote("");
    await fetchTransactions(feeTypeId, hh.id);
  }

  function closeTransactions() {
    setTxOpen(false);
    setTxHousehold(null);
    setTxRows([]);
    setTxError("");
    setEditTx(null);
    setEditAmount("");
    setEditNote("");
    setEditSaving(false);
  }

  function openEditTx(tx) {
    setEditTx(tx);
    setEditAmount(String(tx?.amount ?? ""));
    setEditNote(String(tx?.note ?? ""));
  }

  function closeEditTx() {
    setEditTx(null);
    setEditAmount("");
    setEditNote("");
    setEditSaving(false);
  }

  async function saveEditTx() {
    if (!editTx?.id) return;
    const nextAmount = Number(editAmount);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) return alert("Số tiền chỉnh sửa phải > 0");

    setEditSaving(true);
    try {
      await axios.patch(
        `${API_BASE}/fees/history/${editTx.id}`,
        { amount: nextAmount, note: editNote },
        { headers: authHeaders() }
      );

      const feeTypeId = Number(feeId);
      const hhId = Number(txHousehold?.id);
      if (feeTypeId && hhId) await fetchTransactions(feeTypeId, hhId);
      if (feeTypeId) await fetchFeeSummaryByFeeId(feeTypeId);

      closeEditTx();
    } catch (err) {
      const msg = err.response?.data?.message || "Chỉnh sửa giao dịch thất bại";
      alert(msg);
      setEditSaving(false);
    }
  }

  function getPayStatusLabel(s, isContribution) {
    if (isContribution) {
      const n = Number(s);
      if (n === 2) return "Đã đóng góp";
      return "Chưa đóng góp";
    }
    const n = Number(s);
    if (n === 2) return "Đã thu đủ";
    if (n === 1) return "Thu một phần";
    return "Chưa thu";
  }

  function getPayStatusClass(s) {
    const n = Number(s);
    if (n === 2) return "fee-status-badge fee-status-active";
    if (n === 1) return "fee-status-badge fee-status-partial";
    return "fee-status-badge fee-status-inactive";
  }

  const summaryFilteredRows = useMemo(() => {
    const list = Array.isArray(summaryRows) ? summaryRows : [];
    const q = summarySearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) => {
      const code = String(row.household?.householdCode || row.household?.id || "").toLowerCase();
      return code.includes(q);
    });
  }, [summaryRows, summarySearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [summarySearch]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(summaryFilteredRows.length / rowsPerPage)),
    [summaryFilteredRows.length, rowsPerPage]
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return summaryFilteredRows.slice(start, start + rowsPerPage);
  }, [summaryFilteredRows, currentPage, rowsPerPage]);

  const rangeText = useMemo(() => {
    const total = summaryFilteredRows.length;
    if (total === 0) return `0 - 0 trên tổng số 0 bản ghi`;
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, total);
    return `${start} - ${end} trên tổng số ${total} bản ghi`;
  }, [summaryFilteredRows.length, currentPage, rowsPerPage]);

  const summaryTotals = useMemo(() => {
    const list = Array.isArray(summaryFilteredRows) ? summaryFilteredRows : [];
    const expected = list.reduce((s, x) => s + (Number(x.expected) || 0), 0);
    const paid = list.reduce((s, x) => s + (Number(x.paid) || 0), 0);
    const remaining = list.reduce((s, x) => s + (Number(x.remaining) || 0), 0);
    return { expected, paid, remaining };
  }, [summaryFilteredRows]);

  function onRowEditChange(householdId, field, value) {
    setRowEdits((prev) => ({
      ...(prev || {}),
      [householdId]: {
        ...((prev || {})[householdId] || { amount: "", saving: false }),
        [field]: value,
      },
    }));
  }

  async function saveRowPayment(row) {
    const feeTypeId = Number(feeId);
    const hhId = row?.household?.id;
    if (!feeTypeId || !hhId) return;

    const isContribution = row?.fee?.isMandatory === false || fee?.isMandatory === false;

    const edit = rowEdits[hhId] || {};
    const amountNum = Number(edit.amount);

    if (Number.isNaN(amountNum) || amountNum <= 0) return alert("Số tiền thu phải > 0");

    if (!isContribution) {
      const remainingBefore = Number(row?.remaining) || 0;
      if (remainingBefore <= 0) return alert("Hộ này đã thu đủ");
      if (amountNum > remainingBefore) return alert("Số tiền thu lần này không được vượt quá số tiền còn thiếu");
    }

    setRowEdits((prev) => ({
      ...(prev || {}),
      [hhId]: { ...((prev || {})[hhId] || {}), saving: true },
    }));

    setSummaryRows((prev) =>
      (Array.isArray(prev) ? prev : []).map((r) => {
        if (Number(r?.household?.id) !== Number(hhId)) return r;

        const paidBefore = Number(r.paid) || 0;
        const paidAfter = paidBefore + amountNum;

        if (isContribution) {
          return { ...r, paid: paidAfter, status: 2, remaining: 0, expected: 0 };
        }

        const expected = Number(r.expected) || 0;
        const remainingAfter = Math.max(expected - paidAfter, 0);
        const statusAfter = remainingAfter <= 0 ? 2 : paidAfter <= 0 ? 0 : 1;

        return { ...r, paid: paidAfter, remaining: remainingAfter, status: statusAfter };
      })
    );

    try {
      await axios.post(
        `${API_BASE}/fees/pay`,
        { feeId: feeTypeId, householdId: Number(hhId), amount: amountNum, note: "" },
        { headers: authHeaders() }
      );

      await fetchFeeSummaryByFeeId(feeTypeId);

      setRowEdits((prev) => ({
        ...(prev || {}),
        [hhId]: { amount: "", saving: false },
      }));
    } catch (err) {
      await fetchFeeSummaryByFeeId(feeTypeId);
      const message = err.response?.data?.message || "Ghi nhận thu phí thất bại";
      alert(message);
      setRowEdits((prev) => ({
        ...(prev || {}),
        [hhId]: { ...((prev || {})[hhId] || {}), saving: false },
      }));
    }
  }

  const feeTitle = fee?.name || `Khoản thu #${feeId}`;
  const isContributionFee = fee?.isMandatory === false;

  const miniCards = [
    {
      label: isContributionFee ? "Tổng đóng góp" : "Tổng cần thu",
      value: `${new Intl.NumberFormat("vi-VN").format(
        isContributionFee ? summaryTotals.paid : summaryTotals.expected
      )} đ`,
      icon: <GrMoney />,
      tone: "blue",
    },
    {
      label: "Đã thu",
      value: `${new Intl.NumberFormat("vi-VN").format(summaryTotals.paid)} đ`,
      icon: <GiReceiveMoney />,
      tone: "green",
    },
    {
      label: isContributionFee ? "—" : "Còn thiếu",
      value: isContributionFee
        ? "—"
        : `${new Intl.NumberFormat("vi-VN").format(summaryTotals.remaining)} đ`,
      icon: <GiPayMoney />,
      tone: "rose",
    },
  ];

  return (
    <div className="page-container revenues-page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button className="btn-secondary" type="button" onClick={() => navigate(-1)}>
          <FaChevronLeft /> Quay lại
        </button>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>
            ID: #{feeId} • {feeTitle}
          </div>
          <div style={{ color: "#6b7280", fontWeight: 700 }}>
            {isContributionFee
              ? "Khoản đóng góp (tự nguyện)"
              : `Đơn giá: ${new Intl.NumberFormat("vi-VN").format(Number(fee?.unitPrice) || 0)} đ/Nhân khẩu`}
          </div>
        </div>
      </div>

      <div className="stats-strip revenues-detail-stats">
        {miniCards.map((c) => (
          <div key={c.label} className={`mini-card tone-${c.tone}`}>
            <div className="mini-ico">{c.icon}</div>
            <div className="mini-meta">
              <div className="mini-value">{c.value}</div>
              <div className="mini-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card table-card">
        <div className="table-toolbar">
          <div className="toolbar-row">
            <div className="toolbar-left">
              <div className="toolbar-search" style={{ minWidth: 340 }}>
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm hộ theo mã hộ khẩu / ID..."
                  value={summarySearch}
                  onChange={(e) => setSummarySearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {summaryLoading ? (
          <div className="fee-records-empty">Đang tải danh sách hộ...</div>
        ) : summaryError ? (
          <div className="fee-records-empty">{summaryError}</div>
        ) : summaryFilteredRows.length === 0 ? (
          <div className="fee-records-empty">Không có hộ phù hợp.</div>
        ) : (
          <div className="table-wrapper">
            <table className="fee-table revenues-detail-table">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Hộ</th>
                  <th style={{ width: 90, textAlign: "center" }}>Nhân khẩu</th>
                  <th style={{ width: 130 }}>Tiền/khẩu</th>
                  <th style={{ width: 140 }}>Cần đóng</th>
                  <th style={{ width: 140 }}>Đã đóng</th>
                  <th style={{ width: 140 }}>Còn thiếu</th>
                  <th style={{ width: 130 }}>Trạng thái</th>
                  <th style={{ width: 160 }}>Thu lần này</th>
                  <th style={{ width: 160 }}>Thao tác</th>
                </tr>
              </thead>

              <tbody key={`${feeId}-${summaryTotals.paid}-${summaryTotals.remaining}`}>
                {pageRows.map((row) => {
                  const hh = row.household || {};
                  const isContribution = row?.fee?.isMandatory === false || fee?.isMandatory === false;

                  const unitPrice = isContribution ? 0 : (row.fee?.unitPrice ?? fee?.unitPrice ?? 0);

                  const remaining = Number(row.remaining) || 0;

                  const edit = rowEdits[hh.id] || { amount: "", saving: false };

                  const disableInput = !isContribution && remaining <= 0;
                  const disableSave = !!edit.saving || (!isContribution && remaining <= 0);

                  return (
                    <tr key={`${hh.id}-${row.status}-${row.paid}-${row.remaining}`}>
                      <td>{hh.householdCode ? hh.householdCode : `#${hh.id}`}</td>
                      <td style={{ textAlign: "center" }}>{row.memberCount ?? 0}</td>

                      <td className="money-cell">
                        {isContribution ? "—" : `${new Intl.NumberFormat("vi-VN").format(unitPrice)} đ`}
                      </td>

                      <td className="money-cell">
                        {isContribution ? "—" : `${new Intl.NumberFormat("vi-VN").format(row.expected ?? 0)} đ`}
                      </td>

                      <td className="money-cell">{new Intl.NumberFormat("vi-VN").format(row.paid ?? 0)} đ</td>

                      <td className="money-cell">
                        {isContribution ? "—" : <b>{new Intl.NumberFormat("vi-VN").format(remaining)} đ</b>}
                      </td>

                      <td>
                        <span className={getPayStatusClass(row.status)}>
                          {getPayStatusLabel(row.status, isContribution)}
                        </span>
                      </td>

                      <td>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={edit.amount ?? ""}
                          disabled={disableInput}
                          onWheel={(e) => e.currentTarget.blur()}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^\d]/g, "");
                            onRowEditChange(hh.id, "amount", v);
                          }}
                          style={{ width: "100%" }}
                        />
                      </td>

                      <td>
                        <div className="row-actions" style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            title={disableSave ? "Không thể lưu" : "Lưu thu"}
                            disabled={disableSave}
                            onClick={() => saveRowPayment(row)}
                          >
                            <FaCashRegister />
                          </button>

                          <button
                            type="button"
                            title="Xem & sửa lịch sử thu"
                            onClick={() => openTransactions(row)}
                          >
                            <FaEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {txOpen && (
        <div className="resident-modal-overlay" onClick={closeTransactions}>
          <div className="resident-modal" onClick={(e) => e.stopPropagation()} style={{ width: 920, maxWidth: "92vw" }}>
            <div className="resident-modal-header">
              <div>
                <h3 className="resident-modal-title">Lịch sử thu</h3>
                <p className="resident-modal-sub">
                  Hộ: <b>{txHousehold?.householdCode || `#${txHousehold?.id || "—"}`}</b>
                </p>
              </div>
              <button className="modal-close-btn" type="button" onClick={closeTransactions}>
                ✕
              </button>
            </div>

            <div className="resident-modal-body">
              {txLoading ? (
                <div className="fee-records-empty">Đang tải lịch sử...</div>
              ) : txError ? (
                <div className="fee-records-empty">{txError}</div>
              ) : txRows.length === 0 ? (
                <div className="fee-records-empty">Chưa có giao dịch nào.</div>
              ) : (
                <div className="table-wrapper">
                  <table className="resident-table fee-history-table">
                    <thead>
                      <tr>
                        <th style={{ width: 120 }}>ID</th>
                        <th style={{ width: 160 }}>Số tiền</th>
                        <th style={{ width: 140 }}>Trạng thái</th>
                        <th style={{ width: 160 }}>Thời gian</th>
                        <th style={{ width: 140 }}>Người thu</th>
                        <th>Ghi chú</th>
                        <th style={{ width: 90 }}>Sửa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txRows.map((t) => (
                        <tr key={t.id}>
                          <td>#{t.id}</td>
                          <td className="money-cell">
                            {new Intl.NumberFormat("vi-VN").format(Number(t.amount) || 0)} đ
                          </td>
                          <td>
                            <span className={getPayStatusClass(t.status)}>
                              {getPayStatusLabel(t.status, false)}
                            </span>
                          </td>
                          <td>{t.date ? new Date(t.date).toLocaleString("vi-VN") : "—"}</td>
                          <td>{t.manager?.fullname || "—"}</td>
                          <td style={{ maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {t.note || ""}
                          </td>
                          <td>
                            <button className="fee-action-btn fee-action-save" type="button" title="Sửa giao dịch" onClick={() => openEditTx(t)}>
                              <FaPen />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="resident-modal-footer">
              <button className="btn-secondary" type="button" onClick={closeTransactions}>
                Đóng
              </button>
            </div>

            {editTx && (
              <div className="resident-modal-overlay" onClick={closeEditTx} style={{ position: "absolute", inset: 0 }}>
                <div className="resident-modal" onClick={(e) => e.stopPropagation()} style={{ width: 520 }}>
                  <div className="resident-modal-header">
                    <div>
                      <h3 className="resident-modal-title">Sửa giao dịch</h3>
                      <p className="resident-modal-sub">ID: #{editTx.id}</p>
                    </div>
                    <button className="modal-close-btn" type="button" onClick={closeEditTx}>
                      ✕
                    </button>
                  </div>

                  <div className="resident-modal-body">
                    <div style={{ display: "grid", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Số tiền</div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value.replace(/[^\d]/g, ""))}
                          style={{ width: "100%" }}
                          disabled={editSaving}
                        />
                      </div>

                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Ghi chú</div>
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          style={{ width: "100%" }}
                          disabled={editSaving}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="resident-modal-footer">
                    <button className="btn-secondary" type="button" onClick={closeEditTx} disabled={editSaving}>
                      Hủy
                    </button>
                    <button className="btn-primary" type="button" onClick={saveEditTx} disabled={editSaving}>
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
