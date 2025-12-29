import React, { useState, useEffect } from "react";
import ResidentHeader from "../../components/resident/ResidentHeader";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { Wallet, CheckCircle, Loader2, Heart, ShieldAlert } from "lucide-react";
import "../../styles/resident/ResidentFees.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function FeePayment() {
  const [loading, setLoading] = useState(false);
  const [mandatoryFees, setMandatoryFees] = useState([]);
  const [contributionFees, setContributionFees] = useState([]);
  const [donationInputs, setDonationInputs] = useState({});

  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    type: null,
    amount: 0,
    step: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/household/fees/pending", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMandatoryFees(res.data.mandatoryFees || []);
        setContributionFees(res.data.contributionFees || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDonationChange = (id, value) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    setDonationInputs((prev) => ({
      ...prev,
      [id]: numValue,
    }));
  };

  const totalDonationInput = Object.values(donationInputs).reduce((a, b) => a + b, 0);
  const totalMandatory = mandatoryFees.reduce((sum, item) => sum + item.amount, 0);

  const startPayment = (type) => {
    const amount = type === 'MANDATORY' ? totalMandatory : totalDonationInput;
    
    if (amount <= 0) {
      alert("Vui lòng nhập số tiền cần thanh toán!");
      return;
    }

    setPaymentModal({
      isOpen: true,
      type,
      amount,
      step: 0,
    });
  };

  useEffect(() => {
    let timer;

    if (paymentModal.isOpen && paymentModal.step === 0) {
      timer = setTimeout(() => {
        setPaymentModal((prev) => ({ ...prev, step: 1 }));
      }, 2000);
    }

    if (paymentModal.isOpen && paymentModal.step === 1) {
      const executePayment = async () => {
        try {
          const token = localStorage.getItem("token");
          
          let payload = { type: paymentModal.type };
          
          if (paymentModal.type === 'MANDATORY') {
            payload.feeRecordIds = mandatoryFees.map(f => f.id);
          } else {
            const donations = [];
            for (const [id, amount] of Object.entries(donationInputs)) {
              if (amount > 0) donations.push({ feeTypeId: parseInt(id), amount });
            }
            payload.donations = donations;
          }

          await axios.post("http://localhost:5000/api/household/pay", payload, {
            headers: { Authorization: `Bearer ${token}` },
          });

          timer = setTimeout(() => {
            setPaymentModal((prev) => ({ ...prev, step: 2 }));
            handleUpdateAfterPayment();
          }, 1000);

        } catch (error) {
          console.error("Lỗi thanh toán:", error);
          alert("Giao dịch thất bại! Vui lòng thử lại sau.");
          setPaymentModal({ isOpen: false, type: null, amount: 0, step: 0 });
        }
      };

      executePayment();
    }

    return () => clearTimeout(timer);
  }, [paymentModal.step, paymentModal.isOpen]);

  const handleUpdateAfterPayment = () => {
    if (paymentModal.type === 'MANDATORY') {
      setMandatoryFees([]);
    } else {
      const updatedContributions = contributionFees.map(fee => {
        const donated = donationInputs[fee.id] || 0;
        if (donated > 0) {
            return { 
                ...fee, 
                totalCommunityDonated: (fee.totalCommunityDonated || 0) + donated 
            };
        }
        return fee;
      });
      setContributionFees(updatedContributions);
      setDonationInputs({});
    }
  };

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, type: null, amount: 0, step: 0 });
  };

  return (
    <div>
      <ResidentHeader />
      <div className="square-layout">
        <h2 className="page-title">Thanh toán hóa đơn</h2>

        {loading ? <p>Đang tải...</p> : (
          <div className="payment-grid-layout">
            <div className="payment-column">
              <div className="column-header">
                <h3><ShieldAlert size={20} className="icon-mandatory"/> Phí Dịch Vụ</h3>
                <span className="status-badge badge-mandatory">Bắt buộc</span>
              </div>
              
              <div className="table-container">
                {mandatoryFees.length > 0 ? (
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Khoản phí</th>
                        <th>Hạn nộp</th>
                        <th className="text-right">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mandatoryFees.map((fee) => (
                        <tr key={fee.id}>
                          <td>
                            <div className="fee-name">{fee.feeType.name}</div>
                            <div className="fee-desc">{fee.feeType.description || "Thu định kỳ"}</div>
                          </td>
                          <td>{fee.feeType.toDate ? new Date(fee.feeType.toDate).toLocaleDateString('vi-VN') : '—'}</td>
                          <td className="text-right fee-amount">
                            {formatCurrency(fee.amount)}
                          </td>
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
                  onClick={() => startPayment('MANDATORY')}
                >
                  Thanh toán ngay
                </button>
              </div>
            </div>

            <div className="payment-column">
              <div className="column-header">
                <h3><Heart size={20} className="icon-voluntary"/> Quỹ Đóng Góp</h3>
                <span className="status-badge badge-voluntary">Tự nguyện</span>
              </div>

              <div className="table-container">
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th style={{width: '35%'}}>Quỹ vận động</th>
                      <th style={{width: '25%'}}>Thời gian</th>
                      <th style={{width: '40%', textAlign: 'right'}}>Ủng hộ (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributionFees.map((fee) => (
                      <tr key={fee.id}>
                        <td>
                          <div className="fee-name">{fee.name}</div>
                          <div className="fee-community">
                             Toàn dân đã góp: <span style={{color:'#059669', fontWeight:700}}>{formatCurrency(fee.totalCommunityDonated || 0)}</span>
                          </div>
                        </td>
                        <td>{fee.toDate ? new Date(fee.toDate).toLocaleDateString('vi-VN') : 'Không hạn'}</td>
                        <td className="text-right">
                          <input 
                            type="text" 
                            className="donation-input"
                            placeholder="Nhập số tiền..."
                            value={donationInputs[fee.id] ? donationInputs[fee.id].toLocaleString('vi-VN') : ''}
                            onChange={(e) => handleDonationChange(fee.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
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
                    onClick={() => startPayment('CONTRIBUTION')}
                >
                  <Wallet size={18}/> Gửi ủng hộ
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
                  <QRCodeCanvas 
                    value={`PAYMENT:${paymentModal.type}:${paymentModal.amount}`} 
                    size={200}
                    level={"H"}
                  />
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
  );
}