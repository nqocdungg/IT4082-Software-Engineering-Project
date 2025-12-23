import React, { useEffect, useState } from "react";
import ResidentHeader from "../../components/resident/ResidentHeader";
import "./HouseholdInfo.css";

export default function HouseholdInfo() {
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Bạn chưa đăng nhập");
      return;
    }

    const fetchHouseholdInfo = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/resident/household/info",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Không thể tải thông tin hộ khẩu");

        const data = await res.json();
        setHousehold(data);
      } catch (err) {
        setError(err.message || "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };

    fetchHouseholdInfo();
  }, [token]);

  return (
    <>
      <ResidentHeader />

      {loading && <p className="loading">Đang tải thông tin hộ khẩu...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && household && (
        <div className="household-page">
          <h1>Thông tin hộ khẩu</h1>

          <div className="household-container">
            <div className="left-panel">
              <div className="info-card">
                <h2>Danh sách nhân khẩu</h2>
                {household.residents?.length === 0 ? (
                  <p>Không có nhân khẩu</p>
                ) : (
                  <table className="resident-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Họ tên</th>
                        <th>Quan hệ với chủ hộ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {household.residents.map((r, idx) => (
                        <tr key={r.id || idx}>
                          <td>{idx + 1}</td>
                          <td>{r.fullname || "Chưa cập nhật"}</td>
                          <td>{r.relationToOwner || "Chưa cập nhật"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="right-panel">
              <div className="info-card">
                <h2>Chi tiết</h2>
                <p>
                  <b>Họ tên chủ hộ:</b>{" "}
                  {household.owner?.fullname || "Chưa cập nhật"}
                </p>
                <p>
                  <b>CCCD:</b>{" "}
                  {household.owner?.residentCCCD || "Chưa cập nhật"}
                </p>
                <p>
                  <b>Địa chỉ:</b> {household.address || "Chưa cập nhật"}
                </p>
                <p>
                  <b>Mã hộ khẩu:</b>{" "}
                  {household.householdCode || "Chưa cập nhật"}
                </p>
                <p>
                  <b>Số nhân khẩu:</b> {household.residents?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
