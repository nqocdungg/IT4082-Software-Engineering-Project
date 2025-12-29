import React, { useEffect, useState, useMemo } from "react";
import { 
  Hash, MapPin, Calendar, Users, 
  CreditCard, User, Globe, Flag, Heart, Briefcase, Home
} from "lucide-react"; 
import ResidentHeader from "../../components/resident/ResidentHeader";
import "./HouseholdInfo.css";

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

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    const fetchHouseholdInfo = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/resident/household/info", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Lỗi tải dữ liệu");
        const data = await res.json();
        setHousehold(data);
        
        if (data.residents && data.residents.length > 0) {
          const owner = data.residents.find(r => r.relationToOwner === "Chủ hộ") || data.residents[0];
          setSelectedResident(owner);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHouseholdInfo();
  }, [token]);

  const residentStatusMap = {
    0: "Thường trú", 1: "Tạm trú", 2: "Tạm vắng", 3: "Đã chuyển đi", 4: "Đã qua đời",
  };

  const formatDate = (dateStr) => {
    return dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "---";
  };

  const calculateAge = (dob) => {
    if (!dob) return "";
    const year = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    return `${currentYear - year} tuổi`;
  };

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const formatGender = (gender) => {
    if (!gender) return "---";
    const g = gender.toString().toLowerCase(); 
    if (g === 'm' || g === 'male' || g === 'nam') return 'Nam';
    if (g === 'f' || g === 'female' || g === 'nu' || g === 'nữ') return 'Nữ';
    return gender;
  };

  return (
    <>
      <ResidentHeader />
      
      {loading && <div className="loading-state">Đang tải dữ liệu...</div>}
      {error && <div className="error-state">{error}</div>}

      {!loading && household && (
        <div className="main-container fade-in">
          
          {/* --- SECTION 1: HOUSEHOLD HEADER --- */}
          <div className="household-header-wrapper">
            <div className="header-banner">
              <div className="banner-left">
                <Home size={20} className="banner-icon" />
                <h2>Thông tin Hộ khẩu</h2>
              </div>
              <div className="banner-right">
                <span className="badge-member">
                  <Users size={14} /> {household.residents.length} thành viên
                </span>
                <span className={`badge-status ${household.status === 1 ? 'active' : 'inactive'}`}>
                  {household.status === 1 ? "✓ Đang hoạt động" : "Ngừng hoạt động"}
                </span>
              </div>
            </div>

            <div className="header-info-cards">
              <div className="info-card-item">
                <div className="icon-box purple-bg">
                  <Hash size={24} color="#8b5cf6" />
                </div>
                <div>
                  <div className="label">Mã hộ khẩu</div>
                  <div className="value">{household.householdCode}</div>
                </div>
              </div>

              <div className="info-card-item">
                <div className="icon-box green-bg">
                  <MapPin size={24} color="#10b981" />
                </div>
                <div>
                  <div className="label">Địa chỉ thường trú</div>
                  <div className="value address-truncate" title={household.address}>{household.address}</div>
                </div>
              </div>

              <div className="info-card-item">
                <div className="icon-box pink-bg">
                  <Calendar size={24} color="#ec4899" />
                </div>
                <div>
                  <div className="label">Ngày đăng ký</div>
                  <div className="value">{formatDate(household.registrationDate)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* --- SECTION 2: SPLIT LAYOUT --- */}
          <div className="content-grid">
            
            <div className="panel-container">
              <div className="panel-header blue-header">
                <Users size={18} />
                <h3>Danh sách nhân khẩu</h3>
                <span className="count-badge">{household.residents.length} người</span>
              </div>
              
              <div className="resident-list-scroll">
                {household.residents.map((r) => (
                  <div 
                    key={r.id}
                    className={`resident-card ${selectedResident?.id === r.id ? 'active' : ''}`}
                    onClick={() => setSelectedResident(r)}
                  >
                    <div className="resident-avatar-small">
                      {getInitials(r.fullname)}
                    </div>
                    <div className="resident-info-brief">
                      <div className="brief-top">
                        <span className="brief-name">{r.fullname}</span>
                        {r.relationToOwner === "Chủ hộ" && (
                          <span className="owner-badge">Chủ hộ</span>
                        )}
                      </div>
                      <div className="brief-meta">
                         {r.residentCCCD || "---"} • {calculateAge(r.dob)}
                      </div>
                      <div className="brief-role">{r.relationToOwner}</div>
                    </div>
                    <div className="resident-status-dot">
                       <span className="dot active"></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-container">
              <div className="panel-header blue-header">
                <User size={18} />
                <h3>Thông tin chi tiết nhân khẩu</h3>
              </div>

              {selectedResident ? (
                <div className="detail-content">
                  <div className="profile-header">
                    <div className="profile-avatar-large">
                      {getInitials(selectedResident.fullname)}
                    </div>
                    <div className="profile-main-info">
                      <h2>{selectedResident.fullname}</h2>
                      <div className="profile-tags">
                        {selectedResident.relationToOwner === "Chủ hộ" && <span className="tag-owner">Chủ hộ</span>}
                        <span className="tag-status">Đang cư trú</span>
                      </div>
                      <div className="profile-sub">
                        <span><Calendar size={14}/> {calculateAge(selectedResident.dob)} ({formatDate(selectedResident.dob)})</span>
                        <span><Briefcase size={14}/> {selectedResident.occupation || "Tự do"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section-title">
                    <span>|</span> Thông tin cá nhân
                  </div>

                  <div className="info-grid-cards">
                    <InfoBox 
                      bgClass="bg-indigo" 
                      icon={<CreditCard size={20} color="#373abeff"/>} 
                      label="CCCD" 
                      value={selectedResident.residentCCCD} 
                    />
                    <InfoBox 
                      bgClass="bg-amber" 
                      icon={<Calendar size={20} color="#ec9600ff"/>} 
                      label="Ngày sinh" 
                      value={formatDate(selectedResident.dob)} 
                    />
                    <InfoBox 
                      bgClass="bg-blue" 
                      icon={<User size={20} color="#0e5ad3ff"/>} 
                      label="Giới tính" 
                      value={formatGender(selectedResident.gender)} 
                    />
                    <InfoBox 
                      bgClass="bg-emerald" 
                      icon={<Globe size={20} color="#009664ff"/>} 
                      label="Quốc tịch" 
                      value={selectedResident.nationality} 
                    />
                    <InfoBox 
                      bgClass="bg-pink" 
                      icon={<Home size={20} color="#da1778ff"/>} 
                      label="Dân tộc" 
                      value={selectedResident.ethnicity} 
                    />
                    <InfoBox 
                      bgClass="bg-red" 
                      icon={<Heart size={20} color="#d82222ff"/>} 
                      label="Tôn giáo" 
                      value={selectedResident.religion} 
                    />
                    <InfoBox 
                      bgClass="bg-purple" 
                      icon={<MapPin size={20} color="#5d2ccfff"/>} 
                      label="Quê quán" 
                      value={selectedResident.hometown} 
                    />
                    <InfoBox 
                      bgClass="bg-slate" 
                      icon={<Briefcase size={20} color="#424b57ff"/>} 
                      label="Nghề nghiệp" 
                      value={selectedResident.occupation} 
                    />
                  </div>

                </div>
              ) : (
                <div className="empty-state">Chọn một nhân khẩu để xem chi tiết</div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}

const InfoBox = ({ icon, label, value, bgClass }) => (
  <div className="info-box-card">
    <div className={`info-box-icon ${bgClass}`}>{icon}</div>
    <div className="info-box-text">
      <span className="ib-label">{label}</span>
      <span className="ib-value">{value || "---"}</span>
    </div>
  </div>
);