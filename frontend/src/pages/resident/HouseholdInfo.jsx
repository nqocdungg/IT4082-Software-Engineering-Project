import React, { useEffect, useState, useMemo } from "react";
import ResidentHeader from "../../components/resident/ResidentHeader";
import "./HouseholdInfo.css";

// debounce hook nhỏ để search mượt
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function HouseholdInfo() {
  const [household, setHousehold] = useState(null);
  const [selectedResident, setSelectedResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebouncedValue(search, 300);

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

  const residentStatusMap = {
    0: "Thường trú",
    1: "Tạm trú",
    2: "Tạm vắng",
    3: "Đã chuyển đi",
    4: "Đã qua đời",
  };

  const householdStatusMap = {
    0: "Đang hoạt động",
    1: "Không hoạt động",
  };

  // danh sách nhân khẩu đã lọc theo search
  const filteredResidents = useMemo(() => {
    if (!household || !household.residents) return [];
    if (!debouncedSearch.trim()) return household.residents;
    return household.residents.filter((r) =>
      (r.fullname || "").toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [household, debouncedSearch]);

  return (
    <>
      <ResidentHeader />

      {loading && <p className="loading">Đang tải thông tin hộ khẩu...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && household && (
        <div className="household-page">
          {/* DANH SÁCH NHÂN KHẨU */}
          <div className="square-layout resident-table-wrapper">
            <h2>Danh sách nhân khẩu</h2>

            {/* ô tìm kiếm */}
            <div className="toolbar-search" style={{ marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="Tìm kiếm nhân khẩu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "6px 10px",
                  width: "300px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <table className="resident-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Họ tên</th>
                  <th>CCCD</th>
                  <th>Ngày sinh</th>
                  <th>Giới tính</th>
                  <th>Trạng thái cư trú</th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      Không có dữ liệu nào để hiển thị
                    </td>
                  </tr>
                ) : (
                  filteredResidents.map((r, idx) => (
                    <tr
                      key={r.resident_id || idx}
                      className={
                        selectedResident?.resident_id === r.resident_id
                          ? "selected"
                          : ""
                      }
                      onClick={() => setSelectedResident(r)}
                    >
                      <td>{idx + 1}</td>
                      <td>{r.fullname || "Chưa cập nhật"}</td>
                      <td>{r.residentCCCD || "Chưa cập nhật"}</td>
                      <td>
                        {r.dob
                          ? new Date(r.dob).toLocaleDateString()
                          : "Chưa cập nhật"}
                      </td>
                      <td>{r.gender || "Chưa cập nhật"}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            r.status === 0
                              ? "status-thuong_tru"
                              : r.status === 1
                              ? "status-tam_tru"
                              : r.status === 2
                              ? "status-tam_vang"
                              : r.status === 3
                              ? "status-da_chuyen_di"
                              : r.status === 4
                              ? "status-da_qua_doi"
                              : ""
                          }`}
                        >
                          {r.status !== undefined
                            ? residentStatusMap[r.status]
                            : "Chưa cập nhật"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* CHI TIẾT NHÂN KHẨU (MODAL OVERLAY) */}
          {selectedResident && (
            <div className="resident-overlay">
              <div className="info-card resident-details square-layout">
                <div className="overlay-header">
                  <h2>Chi tiết nhân khẩu</h2>
                  <button
                    className="close-btn"
                    onClick={() => setSelectedResident(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="info-grid">
                  <div>
                    <b>Họ tên:</b> {selectedResident.fullname}
                  </div>
                  <div>
                    <b>CCCD:</b>{" "}
                    {selectedResident.residentCCCD || "Chưa cập nhật"}
                  </div>
                  <div>
                    <b>Ngày sinh:</b>{" "}
                    {selectedResident.dob
                      ? new Date(selectedResident.dob).toLocaleDateString()
                      : "Chưa cập nhật"}
                  </div>
                  <div>
                    <b>Giới tính:</b>{" "}
                    {selectedResident.gender || "Chưa cập nhật"}
                  </div>
                  <div>
                    <b>Dân tộc:</b>{" "}
                    {selectedResident.ethnicity || "Chưa cập nhật"}
                  </div>
                  <div>
                    <b>Tôn giáo:</b>{" "}
                    {selectedResident.religion || "Chưa cập nhật"}
                  </div>
                  <div>
                    <b>Quốc tịch:</b>{" "}
                    {selectedResident.nationality || "Chưa cập nhật"}
                  </div>
                  <div>
                    <b>Quê quán:</b>{" "}
                    {selectedResident.hometown || "Chưa cập nhật"}
                  </div>
                  <div>
                    <b>Nghề nghiệp:</b>{" "}
                    {selectedResident.occupation || "Chưa cập nhật"}
                  </div>
                  <div>
                    <b>Quan hệ với chủ hộ:</b>{" "}
                    {selectedResident.relationToOwner || "Chưa cập nhật"}
                  </div>
                  <div>
                    <b>Trạng thái cư trú:</b>{" "}
                    <span
                      className={`status-badge ${
                        selectedResident.status === 0
                          ? "status-thuong_tru"
                          : selectedResident.status === 1
                          ? "status-tam_tru"
                          : selectedResident.status === 2
                          ? "status-tam_vang"
                          : selectedResident.status === 3
                          ? "status-da_chuyen_di"
                          : selectedResident.status === 4
                          ? "status-da_qua_doi"
                          : ""
                      }`}
                    >
                      {residentStatusMap[selectedResident.status]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BẢNG CHI TIẾT HỘ KHẨU */}
          <div className="household-detail-wrapper">
            <h2>Chi tiết hộ khẩu</h2>
            <table className="household-info-table">
              <tbody>
                <tr>
                  <th>Mã hộ khẩu</th>
                  <td>{household.householdCode}</td>
                  <th>Trạng thái</th>
                  <td>
                    <span
                      className={`household-status-badge ${
                        household.status === 0
                          ? "status-hoat_dong"
                          : "status-khong_hoat_dong"
                      }`}
                    >
                      {householdStatusMap[household.status]}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th>Địa chỉ</th>
                  <td>{household.address}</td>
                  <th>Ngày lập hộ khẩu</th>
                  <td>
                    {household.registrationDate
                      ? new Date(
                          household.registrationDate
                        ).toLocaleDateString()
                      : "Chưa cập nhật"}
                  </td>
                </tr>
                <tr>
                  <th>Chủ hộ</th>
                  <td>{household.owner?.fullname}</td>
                  <th>CCCD chủ hộ</th>
                  <td>{household.owner?.residentCCCD}</td>
                </tr>
                <tr>
                  <th>Số nhân khẩu</th>
                  <td>{household.residents.length}</td>
                  <th>Ngày cập nhật</th>
                  <td>
                    {household.updatedAt
                      ? new Date(household.updatedAt).toLocaleDateString()
                      : "Chưa cập nhật"}
                  </td>
                </tr>
                <tr>
                  <th>Ghi chú</th>
                  <td colSpan={3}>{household.note || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
