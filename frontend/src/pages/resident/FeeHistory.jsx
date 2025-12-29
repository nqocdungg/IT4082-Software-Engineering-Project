import React, { useState, useEffect } from "react";
import ResidentHeader from "../../components/resident/ResidentHeader";
import axios from "axios";
import "../../styles/resident/ResidentFees.css";

const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function FeeHistory() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ history: [], statistics: {} });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/household/fees/history", {
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
        <h2 style={{ color: '#1f3c88', marginBottom: '25px' }}>Lịch sử & Thống kê</h2>

        {loading ? <p>Đang tải...</p> : (
          <>
            {/* Thống kê nhanh */}
            <div className="stats-grid">
               <div className="stat-card highlight">
                  <h4>Tổng tiền đã nộp</h4>
                  <div className="amount">{formatCurrency(data.statistics?.totalPaid || 0)}</div>
               </div>
               <div className="stat-card">
                  <h4>Phí dịch vụ</h4>
                  <div className="amount">{formatCurrency(data.statistics?.totalMandatory || 0)}</div>
               </div>
               <div className="stat-card">
                  <h4>Đóng góp xã hội</h4>
                  <div className="amount">{formatCurrency(data.statistics?.totalContribution || 0)}</div>
               </div>
            </div>

            {/* Bảng lịch sử */}
            <h3 style={{marginTop:'30px', color:'#444'}}>Chi tiết giao dịch đã thành công</h3>
            <table className="resident-table">
              <thead>
                <tr>
                  <th>Ngày thanh toán</th>
                  <th>Nội dung</th>
                  <th>Phân loại</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.history?.length > 0 ? data.history.map((fee) => (
                  <tr key={fee.id}>
                    <td>{new Date(fee.updatedAt).toLocaleDateString('vi-VN')} {new Date(fee.updatedAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</td>
                    <td style={{fontWeight:'500'}}>{fee.feeType.name}</td>
                    <td>
                        {fee.feeType.isMandatory 
                            ? <span style={{padding:'4px 8px', background:'#e0f2fe', color:'#0369a1', borderRadius:'4px', fontSize:'12px'}}>Phí cố định</span> 
                            : <span style={{padding:'4px 8px', background:'#fef3c7', color:'#b45309', borderRadius:'4px', fontSize:'12px'}}>Đóng góp</span>
                        }
                    </td>
                    <td style={{fontWeight: 'bold'}}>{formatCurrency(fee.amount)}</td>
                    <td><span className="status-badge" style={{background:'#dcfce7', color:'#166534'}}>Đã thanh toán</span></td>
                  </tr>
                )) : <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>Chưa có lịch sử giao dịch.</td></tr>}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}