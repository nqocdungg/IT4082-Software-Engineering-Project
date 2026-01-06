import React, { useEffect, useMemo, useState } from "react"
import ResidentHeader from "../../components/resident/ResidentHeader"
import axios from "axios"
import "../../styles/resident/InvoiceInfo.css"
import { FaClipboardList, FaHandHoldingUsd, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa"

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value ?? 0)

export default function FeePayment() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({ mandatoryFees: [], contributionFees: [] })
  const [selectedType, setSelectedType] = useState("all")
  const [filterMonth, setFilterMonth] = useState("")
  const [searchName, setSearchName] = useState("")
  const [expandedId, setExpandedId] = useState(null)
  const [popupFee, setPopupFee] = useState(null)

  useEffect(() => {
    const fetchFees = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get("http://localhost:5000/api/household/fees/pending", {
          headers: { Authorization: `Bearer ${token}` }
        })
        setData({
          mandatoryFees: res.data?.mandatoryFees ?? [],
          contributionFees: res.data?.contributionFees ?? []
        })
      } catch (error) {
        console.error("Lỗi load phí:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchFees()
  }, [])

  const allFees = useMemo(() => {
    const mandatory = (data.mandatoryFees ?? []).map((fee) => ({ ...fee, type: "mandatory" }))
    const contribution = (data.contributionFees ?? []).map((fee) => ({ ...fee, type: "contribution" }))
    return [...mandatory, ...contribution]
  }, [data])

  // month filter: keep fee if [fromDate..toDate] intersects selected month
  const filteredFees = useMemo(() => {
    return allFees.filter((fee) => {
      if (selectedType !== "all" && fee.type !== selectedType) return false

      if (filterMonth) {
        const parts = String(filterMonth).split("-")
        const y = Number(parts[0])
        const m = Number(parts[1])

        if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
          const monthStart = new Date(y, m - 1, 1)
          const nextMonthStart = new Date(y, m, 1)

          const from = fee.fromDate ? new Date(fee.fromDate) : null
          const to = fee.toDate ? new Date(fee.toDate) : null

          const feeStart =
            from && !Number.isNaN(from.getTime()) ? from : new Date(-8640000000000000)
          const feeEnd =
            to && !Number.isNaN(to.getTime()) ? to : new Date(8640000000000000)

          // overlap check
          if (!(feeStart < nextMonthStart && feeEnd >= monthStart)) return false
        }
      }

      const feeName = fee.name
      if (searchName && !String(feeName ?? "").toLowerCase().includes(searchName.toLowerCase())) return false

      return true
    })
  }, [allFees, selectedType, filterMonth, searchName])

  const feeKey = (fee) => `${fee.type}-${fee.id}`
  const toggleExpand = (k) => setExpandedId(expandedId === k ? null : k)

  const getPaidAmount = (fee) => {
    if (fee.type === "contribution") return Number(fee.myPaidAmount ?? 0)
    return 0
  }

  const getTotalAmount = (fee) => {
    if (fee.type === "mandatory") return Number(fee.totalAmount ?? 0)
    return Number(fee.myPaidAmount ?? 0)
  }

  const getStatusText = (fee) => {
    if (fee.type === "mandatory") return "Chưa đóng"
    return fee.paidByHousehold ? "Đã đóng góp" : "Chưa đóng góp"
  }

  const getStatusClass = (fee) => {
    if (fee.type === "mandatory") return "status-0"
    return fee.paidByHousehold ? "status-paid" : "status-0"
  }

  const closePopup = () => setPopupFee(null)

  const togglePopupDesc = (e) => {
    e?.stopPropagation?.()
    setPopupFee((prev) => {
      if (!prev) return prev
      const nextShow = !prev.__showLong
      return { ...prev, __showLong: nextShow }
    })
  }

  return (
    <>
      <ResidentHeader />
      <div className="fee-wrapper">
        <div className="fee-container">
          <h1 className="page-title">Thông tin các khoản thu</h1>

          <div className="filter-bar">
            <div className="filter-tabs">
              <button className={selectedType === "all" ? "active" : ""} onClick={() => setSelectedType("all")}>
                Tất cả
              </button>
              <button
                className={selectedType === "mandatory" ? "active mandatory" : ""}
                onClick={() => setSelectedType("mandatory")}
              >
                Thu cố định
              </button>
              <button
                className={selectedType === "contribution" ? "active contribution" : ""}
                onClick={() => setSelectedType("contribution")}
              >
                Đóng góp
              </button>
            </div>

            <div className="filter-actions" style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ padding: 4 }} />
              <input
                type="text"
                placeholder="Tìm theo tên khoản thu..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{ padding: 4 }}
              />
            </div>
          </div>

          {loading ? (
            <p className="empty-text">Đang tải dữ liệu...</p>
          ) : filteredFees.length === 0 ? (
            <p className="empty-text">Không có khoản thu nào</p>
          ) : (
            <div className="fee-list">
              {filteredFees.map((fee) => {
                const k = feeKey(fee)
                const desc = fee.shortDescription || fee.longDescription || "Không có mô tả"
                const fromText = fee.fromDate ? new Date(fee.fromDate).toLocaleDateString("vi-VN") : "—"
                const toText = fee.toDate ? new Date(fee.toDate).toLocaleDateString("vi-VN") : null

                const unitText = fee.type === "mandatory" ? formatCurrency(fee.unitPrice) : "Tự nguyện"
                const residentsText = fee.type === "mandatory" ? `(${fee.residentsCount ?? 0} nhân khẩu)` : ""

                const totalText =
                  fee.type === "mandatory"
                    ? formatCurrency(fee.totalAmount)
                    : formatCurrency(fee.myPaidAmount ?? 0)

                const communityText =
                  fee.type === "contribution"
                    ? `Toàn dân đã góp: ${formatCurrency(fee.totalCommunityDonated ?? 0)}`
                    : null

                const disablePay = fee.type === "contribution" && fee.paidByHousehold

                return (
                  <div key={k} className={`fee-card ${fee.type}`}>
                    <div className="fee-main" onClick={() => toggleExpand(k)} style={{ cursor: "pointer" }}>
                      <div className={`fee-icon ${fee.type}`}>
                        {fee.type === "mandatory" ? <FaClipboardList /> : <FaHandHoldingUsd />}
                      </div>

                      <div className="fee-info">
                        <div className="fee-name">
                          {fee.name}
                          <span className={`fee-tag ${fee.type === "mandatory" ? "mandatory" : "voluntary"}`}>
                            {fee.type === "mandatory" ? "Bắt buộc" : "Đóng góp"}
                          </span>
                          {fee.type === "contribution" && fee.paidByHousehold && (
                            <span className="fee-tag voluntary" style={{ marginLeft: 8 }}>
                              Đã đóng góp
                            </span>
                          )}
                        </div>

                        <div className="fee-desc">
                          {desc}
                          {communityText ? ` • ${communityText}` : ""}
                        </div>

                        <div className="fee-date">
                          <div className="date-row">
                            <span className="date-item">
                              <FaCalendarAlt className="icon" />
                              {fromText}
                            </span>

                            {toText && (
                              <span className="date-item">
                                <FaCalendarAlt className="icon" />
                                {toText}
                              </span>
                            )}

                            <span className="date-item">
                              <FaMoneyBillWave className="icon" />
                              {fee.type === "mandatory" ? `${unitText} / người ${residentsText}` : unitText}
                            </span>

                            <span className="date-item">
                              <FaMoneyBillWave className="icon" />
                              {totalText}
                            </span>
                          </div>
                        </div>

                        {expandedId === k && (
                          <div className="fee-actions">
                            <button
                              className="pay"
                              disabled={disablePay}
                              onClick={() => alert(`Thanh toán khoản: ${fee.id}`)}
                              style={disablePay ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                            >
                              {disablePay ? "Đã đóng góp" : "Thanh toán"}
                            </button>
                            <button
                              className="detail"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPopupFee({ ...fee, __showLong: false })
                              }}
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="fee-right">
                      <div className="fee-paid">{formatCurrency(getTotalAmount(fee))}</div>
                      <span className={`fee-status ${getStatusClass(fee)}`}>{getStatusText(fee)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {popupFee && (
        <div className="fee-popup" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h2>📋 Chi tiết khoản thu</h2>

            <div className="popup-info-list">
              <div className="popup-info-item">
                <span className="label">Tên khoản thu</span>
                <span className="value">{popupFee.name}</span>
              </div>

              <div className="popup-info-item">
                <span className="label">Loại</span>
                <span className="value">{popupFee.type === "mandatory" ? "Thu bắt buộc" : "Đóng góp tự nguyện"}</span>
              </div>

              <div className="popup-info-item full">
                <span className="label">Mô tả</span>

                <span className="value">
                  {popupFee.__showLong
                    ? popupFee.longDescription || popupFee.shortDescription || "Không có mô tả"
                    : popupFee.shortDescription || popupFee.longDescription || "Không có mô tả"}
                </span>

                {popupFee.longDescription && String(popupFee.longDescription).trim() && (
                  <button
                    type="button"
                    onClick={togglePopupDesc}
                    style={{
                      marginTop: 8,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontWeight: 700,
                      color: "#2563eb"
                    }}
                  >
                    {popupFee.__showLong ? "Thu gọn" : "Xem chi tiết"}
                  </button>
                )}
              </div>

              <div className="popup-info-item">
                <span className="label">Từ ngày</span>
                <span className="value">{popupFee.fromDate ? new Date(popupFee.fromDate).toLocaleDateString("vi-VN") : "—"}</span>
              </div>

              <div className="popup-info-item">
                <span className="label">Đến ngày</span>
                <span className="value">{popupFee.toDate ? new Date(popupFee.toDate).toLocaleDateString("vi-VN") : "—"}</span>
              </div>

              <div className="popup-info-item">
                <span className="label">Đơn giá</span>
                <span className="value highlight">{popupFee.type === "mandatory" ? formatCurrency(popupFee.unitPrice) : "Tự nguyện"}</span>
              </div>

              {popupFee.type === "mandatory" && (
                <>
                  <div className="popup-info-item">
                    <span className="label">Số nhân khẩu</span>
                    <span className="value">{popupFee.residentsCount ?? 0}</span>
                  </div>

                  <div className="popup-info-item">
                    <span className="label">Tổng tiền phải nộp</span>
                    <span className="value highlight">{formatCurrency(popupFee.totalAmount ?? 0)}</span>
                  </div>
                </>
              )}

              {popupFee.type === "contribution" && (
                <>
                  <div className="popup-info-item">
                    <span className="label">Nhà bạn đã góp</span>
                    <span className="value">{formatCurrency(getPaidAmount(popupFee))}</span>
                  </div>
                  <div className="popup-info-item">
                    <span className="label">Toàn dân đã góp</span>
                    <span className="value">{formatCurrency(popupFee.totalCommunityDonated ?? 0)}</span>
                  </div>
                </>
              )}

              <div className="popup-info-item">
                <span className="label">Trạng thái</span>
                <span className={`value status ${getStatusClass(popupFee)}`}>{getStatusText(popupFee)}</span>
              </div>
            </div>

            <div className="popup-footer">
              <button onClick={closePopup}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
