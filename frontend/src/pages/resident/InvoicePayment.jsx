import React, { useEffect, useMemo, useState } from "react"
import ResidentHeader from "../../components/resident/ResidentHeader"
import axios from "axios"
import { QRCodeCanvas } from "qrcode.react"
import { Wallet, CheckCircle, Loader2, Heart, ShieldAlert } from "lucide-react"
import "../../styles/resident/InvoicePayment.css"

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount ?? 0)

export default function FeePayment() {
  const [loading, setLoading] = useState(false)
  const [mandatoryFees, setMandatoryFees] = useState([])
  const [contributionFees, setContributionFees] = useState([])
  const [donationInputs, setDonationInputs] = useState({})

  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    type: null,
    amount: 0,
    step: 0
  })

  const fetchPending = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get("http://localhost:5000/api/household/fees/pending", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMandatoryFees(res.data?.mandatoryFees ?? [])
      setContributionFees(res.data?.contributionFees ?? [])
    } catch (error) {
      console.error(error)
      setMandatoryFees([])
      setContributionFees([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleDonationChange = (id, value) => {
    const numValue = parseInt(String(value).replace(/[^0-9]/g, ""), 10) || 0
    setDonationInputs((prev) => ({
      ...prev,
      [id]: numValue
    }))
  }

  const totalDonationInput = useMemo(() => {
    return Object.values(donationInputs).reduce((a, b) => a + (Number(b) || 0), 0)
  }, [donationInputs])

  const totalMandatory = useMemo(() => {
    return (mandatoryFees ?? []).reduce((sum, item) => sum + Number(item?.totalAmount ?? 0), 0)
  }, [mandatoryFees])

  const startPayment = (type) => {
    const amount = type === "MANDATORY" ? totalMandatory : totalDonationInput
    if (amount <= 0) {
      alert("Vui lòng nhập số tiền cần thanh toán!")
      return
    }
    setPaymentModal({
      isOpen: true,
      type,
      amount,
      step: 0
    })
  }

  useEffect(() => {
    let timer
    if (!paymentModal.isOpen) return

    if (paymentModal.step === 0) {
      timer = setTimeout(() => {
        setPaymentModal((prev) => ({ ...prev, step: 1 }))
      }, 2000)
    }

    if (paymentModal.step === 1) {
      const executePayment = async () => {
        try {
          const token = localStorage.getItem("token")
          const payload = { type: paymentModal.type }

          if (paymentModal.type === "MANDATORY") {
            payload.feeTypeIds = (mandatoryFees ?? []).map((f) => f.id).filter(Boolean)
          } else {
            const donations = []
            for (const [id, amount] of Object.entries(donationInputs)) {
              const feeTypeId = parseInt(id, 10)
              const v = Number(amount) || 0
              if (feeTypeId && v > 0) donations.push({ feeTypeId, amount: v })
            }
            payload.donations = donations
          }

          await axios.post("http://localhost:5000/api/household/pay", payload, {
            headers: { Authorization: `Bearer ${token}` }
          })

          timer = setTimeout(async () => {
            setPaymentModal((prev) => ({ ...prev, step: 2 }))
            setDonationInputs({})
            await fetchPending()
          }, 600)
        } catch (error) {
          console.error("Lỗi thanh toán:", error)
          console.log("SERVER SAID:", error?.response?.data)
          alert("Giao dịch thất bại! Vui lòng thử lại sau.")
          setPaymentModal({ isOpen: false, type: null, amount: 0, step: 0 })
        }
      }

      executePayment()
    }

    return () => clearTimeout(timer)
  }, [paymentModal.isOpen, paymentModal.step])

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, type: null, amount: 0, step: 0 })
  }

  return (
    <div>
      <ResidentHeader />
      <div className="square-layout">
        <h2 className="page-title">Thanh toán hóa đơn</h2>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="payment-grid-layout">
            {/* ================= MANDATORY ================= */}
            <div className="payment-column">
              <div className="column-header">
                <h3>
                  <ShieldAlert size={20} className="icon-mandatory" /> Phí Dịch Vụ
                </h3>
                <span className="status-badge badge-mandatory">Bắt buộc</span>
              </div>

              <div className="table-container">
                {(mandatoryFees ?? []).length > 0 ? (
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Khoản phí</th>
                        <th>Hạn nộp</th>
                        <th className="text-right">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(mandatoryFees ?? []).map((fee) => (
                        <tr key={fee?.id ?? Math.random()}>
                          <td>
                            <div className="fee-name">{fee?.name ?? "—"}</div>
                            <div className="fee-desc">{fee?.shortDescription || fee?.longDescription || "Thu định kỳ"}</div>
                            <div className="fee-desc">
                              {Number(fee?.residentsCount ?? 0) > 0
                                ? `${formatCurrency(fee?.unitPrice)} / người • ${fee.residentsCount} nhân khẩu`
                                : `${formatCurrency(fee?.unitPrice)} / người`}
                            </div>
                          </td>
                          <td>{fee?.toDate ? new Date(fee.toDate).toLocaleDateString("vi-VN") : "—"}</td>
                          <td className="text-right fee-amount">{formatCurrency(fee?.totalAmount ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">Bạn đã hoàn thành tất cả khoản phí bắt buộc!</div>
                )}
              </div>

              <div className="column-footer">
                <div className="total-row">
                  <span>Tổng cần nộp:</span>
                  <span className="total-amount mandatory">{formatCurrency(totalMandatory)}</span>
                </div>
                <button
                  className="pay-btn btn-mandatory"
                  disabled={totalMandatory === 0}
                  onClick={() => startPayment("MANDATORY")}
                >
                  Thanh toán ngay
                </button>
              </div>
            </div>

            {/* ================= CONTRIBUTION ================= */}
            <div className="payment-column">
              <div className="column-header">
                <h3>
                  <Heart size={20} className="icon-voluntary" /> Quỹ Đóng Góp
                </h3>
                <span className="status-badge badge-voluntary">Tự nguyện</span>
              </div>

              <div className="table-container">
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th style={{ width: "35%" }}>Quỹ vận động</th>
                      <th style={{ width: "25%" }}>Thời gian</th>
                      <th style={{ width: "40%", textAlign: "right" }}>Ủng hộ (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(contributionFees ?? []).map((fee) => {
                      const paid = !!fee?.paidByHousehold
                      return (
                        <tr key={fee?.id ?? Math.random()}>
                          <td>
                            <div className="fee-name">{fee?.name ?? "—"}</div>

                            <div className="fee-community">
                              Toàn dân đã góp:{" "}
                              <span style={{ color: "#059669", fontWeight: 700 }}>
                                {formatCurrency(fee?.totalCommunityDonated ?? 0)}
                              </span>
                            </div>

                            <div className="fee-community">
                              Nhà bạn đã góp:{" "}
                              <span style={{ color: paid ? "#16a34a" : "#6b7280", fontWeight: 700 }}>
                                {formatCurrency(fee?.myPaidAmount ?? 0)}
                              </span>
                              {paid ? " ✅" : ""}
                            </div>
                          </td>

                          <td>{fee?.toDate ? new Date(fee.toDate).toLocaleDateString("vi-VN") : "Không hạn"}</td>

                          <td className="text-right">
                            <input
                              type="text"
                              className="donation-input"
                              placeholder="Nhập số tiền muốn ủng hộ thêm..."
                              value={donationInputs[fee?.id] ? Number(donationInputs[fee.id]).toLocaleString("vi-VN") : ""}
                              onChange={(e) => handleDonationChange(fee?.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="column-footer">
                <div className="total-row">
                  <span>Tổng tiền ủng hộ:</span>
                  <span className="total-amount voluntary">{formatCurrency(totalDonationInput)}</span>
                </div>
                <button
                  className="pay-btn btn-voluntary"
                  disabled={totalDonationInput === 0}
                  onClick={() => startPayment("CONTRIBUTION")}
                >
                  <Wallet size={18} /> Gửi ủng hộ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {paymentModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            {paymentModal.step === 0 && (
              <div className="modal-step fade-in">
                <h3>Quét mã để thanh toán</h3>
                <div className="qr-box">
                  <QRCodeCanvas value={`PAYMENT:${paymentModal.type}:${paymentModal.amount}`} size={200} level={"H"} />
                </div>
                <p className="modal-amount">{formatCurrency(paymentModal.amount)}</p>
                <p className="modal-note">Hệ thống đang chờ xác nhận...</p>
              </div>
            )}

            {paymentModal.step === 1 && (
              <div className="modal-step fade-in">
                <div className="loader-box">
                  <Loader2 size={48} className="spinner" />
                </div>
                <h3>Đang xử lý giao dịch...</h3>
                <p>Vui lòng không tắt trình duyệt</p>
              </div>
            )}

            {paymentModal.step === 2 && (
              <div className="modal-step fade-in">
                <div className="success-box">
                  <CheckCircle size={64} color="#16a34a" />
                </div>
                <h3 className="text-success">Thanh toán thành công!</h3>
                <p>Cảm ơn bạn đã đóng góp cho tổ dân phố.</p>
                <button className="close-modal-btn" onClick={closePaymentModal}>
                  Hoàn tất
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
