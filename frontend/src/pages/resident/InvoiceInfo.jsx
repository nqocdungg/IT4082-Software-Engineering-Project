import React, { useEffect, useState } from "react";
import ResidentHeader from "../../components/resident/ResidentHeader";
import axios from "axios";
import "../../styles/resident/InvoiceInfo.css";
import {
  FaClipboardList,
  FaHandHoldingUsd,
  FaCalendarAlt,
  FaMoneyBillWave,
} from "react-icons/fa";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value ?? 0
  );

export default function FeePayment() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ mandatoryFees: [], contributionFees: [] });
  const [selectedType, setSelectedType] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [searchName, setSearchName] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [popupFee, setPopupFee] = useState(null);

  useEffect(() => {
    const fetchFees = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/household/fees/pending",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data);
      } catch (error) {
        console.error("Lỗi load phí:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, []);

  const allFees = [
    ...data.mandatoryFees.map((fee) => ({ ...fee, type: "mandatory" })),
    ...data.contributionFees.map((fee) => ({ ...fee, type: "contribution" })),
  ];

  const filteredFees = allFees.filter((fee) => {
    if (selectedType !== "all" && fee.type !== selectedType) return false;

    const dateSource =
      fee.type === "mandatory" ? fee.feeType?.fromDate : fee.fromDate;
    if (filterMonth && dateSource && !dateSource.startsWith(filterMonth))
      return false;

    const feeName = fee.type === "mandatory" ? fee.feeType?.name : fee.name;
    if (
      searchName &&
      !feeName?.toLowerCase().includes(searchName.toLowerCase())
    )
      return false;

    return true;
  });

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  // Xác định số tiền thực tế đã nộp
  const getPaidAmount = (fee) =>
    fee.type === "mandatory" ? fee.amount : fee.totalCommunityDonated ?? 0;

  // Trạng thái
  const getStatusText = (fee) =>
    getPaidAmount(fee) > 0 ? "Đã đóng" : "Chưa đóng";
  const getStatusClass = (fee) =>
    getPaidAmount(fee) > 0 ? "status-paid" : "status-0";

  return (
    <>
      <ResidentHeader />
      <div className="fee-wrapper">
        <div className="fee-container">
          <h1 className="page-title">Thông tin các khoản thu</h1>

          {/* FILTER */}
          <div className="filter-bar">
            <div className="filter-tabs">
              <button
                className={selectedType === "all" ? "active" : ""}
                onClick={() => setSelectedType("all")}
              >
                Tất cả
              </button>
              <button
                className={
                  selectedType === "mandatory" ? "active mandatory" : ""
                }
                onClick={() => setSelectedType("mandatory")}
              >
                Thu cố định
              </button>
              <button
                className={
                  selectedType === "contribution" ? "active contribution" : ""
                }
                onClick={() => setSelectedType("contribution")}
              >
                Đóng góp
              </button>
            </div>
            <div
              className="filter-actions"
              style={{ display: "flex", gap: 12, alignItems: "center" }}
            >
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{ padding: 4 }}
              />
              <input
                type="text"
                placeholder="Tìm theo tên khoản thu..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{ padding: 4 }}
              />
            </div>
          </div>

          {/* LIST */}
          {loading ? (
            <p className="empty-text">Đang tải dữ liệu...</p>
          ) : filteredFees.length === 0 ? (
            <p className="empty-text">Không có khoản thu nào</p>
          ) : (
            <div className="fee-list">
              {filteredFees.map((fee) => (
                <div key={fee.id} className={`fee-card ${fee.type}`}>
                  <div
                    className="fee-main"
                    onClick={() => toggleExpand(fee.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={`fee-icon ${fee.type}`}>
                      {fee.type === "mandatory" ? (
                        <FaClipboardList />
                      ) : (
                        <FaHandHoldingUsd />
                      )}
                    </div>
                    <div className="fee-info">
                      <div className="fee-name">
                        {fee.type === "mandatory"
                          ? fee.feeType?.name
                          : fee.name}
                        <span
                          className={`fee-tag ${
                            fee.type === "mandatory" ? "mandatory" : "voluntary"
                          }`}
                        >
                          {fee.type === "mandatory" ? "Bắt buộc" : "Đóng góp"}
                        </span>
                      </div>
                      <div className="fee-desc">
                        {fee.type === "mandatory"
                          ? fee.feeType?.description
                          : fee.description || "Không có mô tả"}
                      </div>
                      <div className="fee-date">
                        <div className="date-row">
                          <span className="date-item">
                            <FaCalendarAlt className="icon" />
                            {fee.type === "mandatory"
                              ? new Date(
                                  fee.feeType?.fromDate
                                ).toLocaleDateString("vi-VN")
                              : fee.fromDate
                              ? new Date(fee.fromDate).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "—"}
                          </span>
                          {fee.type === "mandatory" && fee.feeType?.toDate && (
                            <span className="date-item">
                              <FaCalendarAlt className="icon" />
                              {new Date(fee.feeType.toDate).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          )}
                          <span className="date-item">
                            <FaMoneyBillWave className="icon" />
                            {fee.type === "mandatory"
                              ? formatCurrency(fee.feeType?.unitPrice)
                              : "Tự nguyện"}
                          </span>
                        </div>
                      </div>

                      {expandedId === fee.id && (
                        <div className="fee-actions">
                          <button
                            className="pay"
                            onClick={() => alert(`Thanh toán ${fee.id}`)}
                          >
                            Thanh toán
                          </button>
                          <button
                            className="detail"
                            onClick={() => setPopupFee(fee)}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="fee-right">
                    <div className="fee-paid">
                      {formatCurrency(getPaidAmount(fee))}
                    </div>
                    <span className={`fee-status ${getStatusClass(fee)}`}>
                      {getStatusText(fee)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* POPUP CHI TIẾT */}
      {popupFee && (
        <div className="fee-popup" onClick={() => setPopupFee(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h2>📋 Chi tiết khoản thu</h2>
            <div className="popup-info-list">
              <div className="popup-info-item">
                <span className="label">Tên khoản thu</span>
                <span className="value">
                  {popupFee.type === "mandatory"
                    ? popupFee.feeType?.name
                    : popupFee.name}
                </span>
              </div>
              <div className="popup-info-item">
                <span className="label">Loại</span>
                <span className="value">
                  {popupFee.type === "mandatory"
                    ? "Thu bắt buộc"
                    : "Đóng góp tự nguyện"}
                </span>
              </div>
              <div className="popup-info-item full">
                <span className="label">Mô tả</span>
                <span className="value">
                  {popupFee.type === "mandatory"
                    ? popupFee.feeType?.description
                    : popupFee.description || "Không có mô tả"}
                </span>
              </div>
              <div className="popup-info-item">
                <span className="label">Từ ngày</span>
                <span className="value">
                  {popupFee.type === "mandatory" && popupFee.feeType?.fromDate
                    ? new Date(popupFee.feeType.fromDate).toLocaleDateString(
                        "vi-VN"
                      )
                    : popupFee.fromDate
                    ? new Date(popupFee.fromDate).toLocaleDateString("vi-VN")
                    : "—"}
                </span>
              </div>
              <div className="popup-info-item">
                <span className="label">Đến ngày</span>
                <span className="value">
                  {popupFee.type === "mandatory" && popupFee.feeType?.toDate
                    ? new Date(popupFee.feeType.toDate).toLocaleDateString(
                        "vi-VN"
                      )
                    : popupFee.toDate
                    ? new Date(popupFee.toDate).toLocaleDateString("vi-VN")
                    : "—"}
                </span>
              </div>
              <div className="popup-info-item">
                <span className="label">Đơn giá</span>
                <span className="value highlight">
                  {popupFee.type === "mandatory"
                    ? formatCurrency(popupFee.feeType?.unitPrice)
                    : "Tự nguyện"}
                </span>
              </div>
              <div className="popup-info-item">
                <span className="label">Số tiền đã đóng</span>
                <span className="value">
                  {formatCurrency(getPaidAmount(popupFee))}
                </span>
              </div>
              <div className="popup-info-item">
                <span className="label">Trạng thái</span>
                <span className={`value status ${getStatusClass(popupFee)}`}>
                  {getStatusText(popupFee)}
                </span>
              </div>
            </div>
            <div className="popup-footer">
              <button onClick={() => setPopupFee(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
