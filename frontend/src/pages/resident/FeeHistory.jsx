import React, { useEffect, useMemo, useState } from "react";
import ResidentHeader from "../../components/resident/ResidentHeader";
import axios from "axios";
import "../../styles/resident/FeeHistory.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount ?? 0
  );

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("vi-VN") : "";

const toDateOnly = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

export default function FeeHistory() {
  const [loading, setLoading] = useState(false);
  const [feeRecords, setFeeRecords] = useState([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");

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
      } catch (err) {
        console.error("Fetch fee history error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredFees = useMemo(() => {
    return feeRecords

      .filter((f) =>
        f.feeType?.name?.toLowerCase().includes(search.toLowerCase())
      )

      .filter((f) => {
        if (typeFilter === "all") return true;
        if (typeFilter === "mandatory") return f.feeType?.isMandatory;
        return !f.feeType?.isMandatory;
      })

      .filter((f) => {
        if (!fromDate) return true;
        return (
          toDateOnly(f.createdAt).getTime() === toDateOnly(fromDate).getTime()
        );
      });
  }, [feeRecords, search, typeFilter, fromDate]);

  const getStatusLabel = (status) => {
    if (status === 0) return "Chưa thanh toán";
    if (status === 1) return "Thanh toán một phần";
    return "Đã thanh toán";
  };

  const getStatusClass = (status) => {
    if (status === 0) return "status-chua_dong";
    if (status === 1) return "status-dong_phan";
    return "status-hoan_thanh";
  };

  return (
    <div className="fee-page">
      <ResidentHeader />

      <h1 className="page-title">Lịch sử thanh toán </h1>

      <div className="fee-container">
        <div className="fee-toolbar">
          <div className="fee-toggle">
            <button
              className={`fee-toggle-btn ${
                typeFilter === "all" ? "active-all" : ""
              }`}
              onClick={() => setTypeFilter("all")}
            >
              Tất cả
            </button>
            <button
              className={`fee-toggle-btn ${
                typeFilter === "mandatory" ? "active-mandatory" : ""
              }`}
              onClick={() => setTypeFilter("mandatory")}
            >
              Phí cố định
            </button>
            <button
              className={`fee-toggle-btn ${
                typeFilter === "optional" ? "active-contribution" : ""
              }`}
              onClick={() => setTypeFilter("optional")}
            >
              Phí tự nguyện
            </button>
          </div>

          <div className="fee-filter-right">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />

            <input
              className="fee-search"
              type="text"
              placeholder="Tìm theo tên khoản thu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="fee-list">
          {loading ? (
            <div className="empty">Đang tải dữ liệu...</div>
          ) : filteredFees.length === 0 ? (
            <div className="empty">Không có khoản thu</div>
          ) : (
            filteredFees.map((f) => (
              <div key={f.id} className="fee-card">
                <div className="fee-left">
                  <div className="fee-icon">📄</div>
                  <div className="fee-info">
                    <div className="fee-title-row">
                      <h3>{f.feeType?.name}</h3>
                      <span
                        className={`fee-badge ${
                          f.feeType?.isMandatory ? "mandatory" : "optional"
                        }`}
                      >
                        {f.feeType?.isMandatory
                          ? "Phí cố định"
                          : "Phí tự nguyện"}
                      </span>
                    </div>

                    {f.description && (
                      <p className="fee-description">{f.description}</p>
                    )}

                    <div className="fee-meta">
                      <span>📅 {formatDate(f.createdAt)}</span>
                      {f.updatedAt && <span>🕒 {formatDate(f.updatedAt)}</span>}
                    </div>
                  </div>
                </div>

                <div className="fee-right">
                  <div className="fee-amount">{formatCurrency(f.amount)}</div>
                  <span className={`fee-status ${getStatusClass(f.status)}`}>
                    {getStatusLabel(f.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
