import React, { useState, useEffect } from "react";
import ResidentHeader from "../../components/resident/ResidentHeader";
import axios from "axios";
import "../../styles/resident/ResidentFees.css";

const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function FeePayment() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ mandatoryFees: [], contributionFees: [], totalAmount: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/household/fees/pending", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <ResidentHeader />
      <div className="square-layout">
        <h2 style={{ color: '#1f3c88', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
          Thanh toán hóa đơn
        </h2>

        {loading ? <p>Đang tải...</p> : (
          <>
            {/* --- LAYOUT 2 CỘT --- */}
            <div className="payment-grid-layout">
              
              {/* === CỘT TRÁI: PHÍ BẮT BUỘC === */}
              <div className="payment-column">
                <div className="column-header">
                  <h3>
                    <span style={{fontSize:'20px'}}>📋</span> Phí Dịch Vụ
                  </h3>
                  <span className="status-badge" style={{background:'#e0f2fe', color:'#1f3c88'}}>Bắt buộc</span>
                </div>
                
                {data.mandatoryFees.length > 0 ? (
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Khoản phí</th>
                        <th>Hạn nộp</th>
                        <th style={{textAlign:'right'}}>Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.mandatoryFees.map((fee) => (
                        <tr key={fee.id}>
                          <td>
                            <div style={{fontWeight:'600', color:'#1f3c88'}}>{fee.feeType.name}</div>
                            <div style={{fontSize:'12px', color:'#94a3b8'}}>{fee.feeType.description || "Thu định kỳ"}</div>
                          </td>
                          <td style={{fontSize:'13px'}}>
                            {fee.feeType.toDate ? new Date(fee.feeType.toDate).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td style={{textAlign:'right', fontWeight:'700', color:'#dc2626', fontSize:'15px'}}>
                            {formatCurrency(fee.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state" style={{padding:'20px 0'}}>Không có khoản phí nào.</div>
                )}
              </div>

              {/* === CỘT PHẢI: ĐÓNG GÓP === */}
              <div className="payment-column">
                <div className="column-header">
                  <h3><span style={{fontSize:'20px'}}>🤝</span> Đóng Góp</h3>
                  <span className="status-badge" style={{background:'#f1f5f9', color:'#64748b'}}>Tự nguyện</span>
                </div>

                {data.contributionFees.length > 0 ? (
                  <table className="mini-table">
                    <thead>
                      <tr>
                        {/* CỘT 1: TÊN QUỸ */}
                        <th>Quỹ vận động</th>
                        
                        {/* CỘT 2: THỜI GIAN */}
                        <th>Thời gian</th>
                        
                        {/* CỘT 3: TỔNG TOÀN DÂN ĐÃ ĐÓNG */}
                        <th style={{textAlign:'right'}}>Đã ủng hộ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.contributionFees.map((fee) => (
                        <tr key={fee.id}>
                          {/* 1. Tên Quỹ */}
                          <td>
                            <div style={{fontWeight:'600', color:'#334155'}}>{fee.name}</div>
                            <div style={{fontSize:'12px', color:'#64748b'}}>
                               {fee.description}
                            </div>
                          </td>

                          {/* 2. Thời gian */}
                          <td style={{fontSize:'13px'}}>
                            {fee.toDate ? new Date(fee.toDate).toLocaleDateString('vi-VN') : 'Không hạn'}
                          </td>
                          
                          {/* 3. Tổng tiền cả tổ dân phố */}
                          <td style={{textAlign:'right'}}>
                             <div style={{
                               fontWeight:'700', 
                               color:'#059669', 
                               fontSize:'15px'
                             }}>
                               {formatCurrency(fee.totalCommunityDonated || 0)}
                             </div>
                             <div style={{fontSize:'11px', color:'#94a3b8'}}>Toàn tổ dân phố</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state" style={{padding:'20px 0'}}>Không có đợt vận động nào.</div>
                )}
              </div>
            </div>

            {/* --- FOOTER: HƯỚNG DẪN NỘP TIỀN --- */}
            {data.totalAmount > 0 && (
               <div className="total-payment-section" style={{
                 flexDirection: 'column', 
                 alignItems: 'flex-end', 
                 gap: '10px'
               }}>
                  <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                    <div style={{textAlign:'right'}}>
                        <div className="total-label" style={{color:'#334155'}}>Tổng phí bắt buộc cần nộp</div>
                    </div>
                    <span className="total-value" style={{color:'#dc2626'}}>{formatCurrency(data.totalAmount)}</span>
                  </div>
                  
                  <div style={{
                    fontSize: '14px', 
                    color: '#1f3c88', 
                    background: '#eff6ff', 
                    padding: '10px 15px', 
                    borderRadius: '8px',
                    border: '1px dashed #1f3c88',
                    marginTop: '5px'
                  }}>
                    ℹ️ Vui lòng đến <strong>Nhà văn hóa TDP 7</strong> để hoàn thành đóng phí.
                  </div>
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}