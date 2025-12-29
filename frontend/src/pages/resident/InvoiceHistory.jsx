import React, { useState, useEffect, useMemo } from "react";
import ResidentHeader from "../../components/resident/ResidentHeader";
import axios from "axios";
import "../../styles/resident/InvoiceHistory.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount ?? 0
  );

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("vi-VN") : "-";

export default function FeeHistory() {
  const [loading, setLoading] = useState(false);
  const [feeRecords, setFeeRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/household/fees/history",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFeeRecords(res.data.history || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ================= FILTER ================= */
  const filteredFees = useMemo(() => {
    return feeRecords
      .filter((f) =>
        f.feeType?.name?.toLowerCase().includes(search.toLowerCase())
      )
      .filter((f) => {
        if (typeFilter === "mandatory") return f.feeType?.isMandatory;
        if (typeFilter === "optional") return !f.feeType?.isMandatory;
        return true;
      });
  }, [feeRecords, search, typeFilter]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredFees.length / pageSize);
  const pagedFees = filteredFees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  /* ================= STATUS ================= */
  const getPaymentStatus = (fee) => {
    switch (fee.status) {
      case 0:
        return "Chưa thanh toán";
      case 1:
        return "Thanh toán 1 phần";
      case 2:
        return "Đã thanh toán";
      default:
        return "-";
    }
  };

  const getPaymentClass = (fee) => {
    switch (fee.status) {
      case 0:
        return "historyPage-status-unpaid";
      case 1:
        return "historyPage-status-partial";
      case 2:
        return "historyPage-status-paid";
      default:
        return "";
    }
  };

  return (
    <div className="historyPage-wrapper">
      <ResidentHeader />

      {/* ================= TITLE ================= */}
      <h1 className="historyPage-page-title">Lịch sử thanh toán</h1>

      {/* ================= TOOLBAR ================= */}
      <div className="historyPage-toolbar">
        <div className="historyPage-filter-type">
          {["all", "mandatory", "optional"].map((type) => (
            <button
              key={type}
              className={typeFilter === type ? "active" : ""}
              onClick={() => {
                setTypeFilter(type);
                setCurrentPage(1);
              }}
            >
              {type === "all"
                ? "Tất cả"
                : type === "mandatory"
                ? "Bắt buộc"
                : "Đóng góp"}
            </button>
          ))}
        </div>

        <div className="historyPage-search">
          <input
            type="text"
            placeholder="Tìm theo tên khoản thu..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="historyPage-table-card">
        <div className="historyPage-table-wrapper">
          <table className="historyPage-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên khoản thu</th>
                <th>Loại</th>
                <th>Số tiền</th>
                <th>Thông tin</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="historyPage-empty-row">
                    Đang tải...
                  </td>
                </tr>
              ) : pagedFees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="historyPage-empty-row">
                    Không có khoản thu phù hợp
                  </td>
                </tr>
              ) : (
                pagedFees.map((f) => (
                  <tr key={f.id}>
                    <td>{f.id}</td>
                    <td>{f.feeType?.name ?? "-"}</td>
                    <td>
                      <span
                        className={
                          f.feeType?.isMandatory
                            ? "historyPage-type-mandatory"
                            : "historyPage-type-optional"
                        }
                      >
                        {f.feeType?.isMandatory ? "Bắt buộc" : "Đóng góp"}
                      </span>
                    </td>
                    <td>{formatCurrency(f.amount)}</td>
                    <td>
                      <div style={{ fontSize: 12 }}>
                        <div>
                          <strong>Mô tả:</strong> {f.description || "—"}
                        </div>
                        <div style={{ color: "#6b7280", marginTop: 4 }}>
                          <strong>
                            {f.feeType?.isMandatory
                              ? "Ngày nộp:"
                              : "Ngày đóng góp:"}
                          </strong>{" "}
                          {formatDate(f.createdAt)}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={getPaymentClass(f)}>
                        {getPaymentStatus(f)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
        <div className="historyPage-footer">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={currentPage === i + 1 ? "active" : ""}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
