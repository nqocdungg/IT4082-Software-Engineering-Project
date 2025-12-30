import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ResidentHeader from "../../components/resident/ResidentHeader";
import axios from "axios";
import { 
  FiClock, FiCheck, FiX, FiInfo, FiAlertTriangle, 
  FiCalendar, FiGift, FiDollarSign 
} from "react-icons/fi";
import "../../styles/resident/ResidentNoti.css";

const API_BASE = "http://localhost:5000/api";

export default function ResidentNotifications() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get("tab") || "general";
  const [filterStatus, setFilterStatus] = useState("all"); 

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedNoti, setSelectedNoti] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/resident/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tabName) => {
    navigate(`?tab=${tabName}`);
    setFilterStatus("all");
  };

  const markRead = async (id, isRead) => {
    if (isRead) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/resident/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n));
    } catch (e) { console.error(e) }
  }

  const handleCardClick = (item) => {
    markRead(item.id, item.isRead);
    setSelectedNoti(item);
  };

  const isPersonalMessage = (item) => {
    const title = item.title || "";
    return title.includes("Nhắc nhở đóng phí") || title.includes("Chúc mừng sinh nhật");
  };

  const processedData = useMemo(() => {
    let tabFiltered = notifications.filter(item => {
      const isPersonal = isPersonalMessage(item);
      return activeTab === "general" ? !isPersonal : isPersonal;
    });

    const unreadGeneral = notifications.filter(i => !isPersonalMessage(i) && !i.isRead).length;
    const unreadPersonal = notifications.filter(i => isPersonalMessage(i) && !i.isRead).length;

    let finalFiltered = tabFiltered;
    if (filterStatus === "unread") finalFiltered = tabFiltered.filter(i => !i.isRead);
    if (filterStatus === "read") finalFiltered = tabFiltered.filter(i => i.isRead);

    return { 
        list: finalFiltered, 
        counts: { general: unreadGeneral, personal: unreadPersonal } 
    };
  }, [notifications, activeTab, filterStatus]);

  const getTheme = (item) => {
    if (item.title?.includes("Nhắc nhở đóng phí")) 
      return { class: "gold", icon: <FiDollarSign />, label: "Nhắc phí" };
    if (item.title?.includes("Chúc mừng sinh nhật")) 
      return { class: "pink", icon: <FiGift />, label: "Lời chúc" };

    if (item.type === "WARNING") 
      return { class: "red", icon: <FiAlertTriangle />, label: "Khẩn cấp" };
    if (item.type === "EVENT") 
      return { class: "green", icon: <FiCalendar />, label: "Sự kiện" };
    
    return { class: "blue", icon: <FiInfo />, label: "Tin tức" }; 
  };

  const renderCard = (item) => {
    const theme = getTheme(item);
    const isReadClass = item.isRead ? 'read' : 'unread';

    return (
      <div 
        key={item.id} 
        className={`noti-card ${isReadClass}`} 
        onClick={() => handleCardClick(item)}
      >
        <div className={`status-stripe ${theme.class}`}></div>

        <div className="card-content-wrapper">
          <div className="card-top">
            <div className={`icon-box ${theme.class}`}>
              {theme.icon}
            </div>
            <div className="card-meta">
               <div className="meta-header">
                 <span className={`tag ${theme.class}`}>{theme.label}</span>
                 <span className="time"><FiClock /> {new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
               </div>
               <h4 className="card-title">{item.title}</h4>
            </div>
            {!item.isRead && <div className="unread-dot"></div>}
          </div>
          
          <p className="card-preview">
            {item.message}
          </p>

          {theme.label === "Nhắc phí" && (
             <div className="card-actions">
               <button className="btn-action-pay" onClick={(e) => {
                 e.stopPropagation();
                 markRead(item.id, item.isRead);
                 navigate('/resident/payment');
               }}>
                 Thanh toán ngay
               </button>
             </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <ResidentHeader />
      
      <div className="res-container">
        <div className="page-header">
           <h2>🔔 Thông báo của bạn</h2>
        </div>

        <div className="segmented-control">
          <button 
            className={`seg-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => switchTab('general')}
          >
            Thông báo chung
            {processedData.counts.general > 0 && <span className="badge-count">{processedData.counts.general}</span>}
          </button>
          <button 
            className={`seg-btn ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => switchTab('personal')}
          >
            Cá nhân & Phí
             {processedData.counts.personal > 0 && <span className="badge-count red">{processedData.counts.personal}</span>}
          </button>
        </div>

        <div className="filter-row">
            <button className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>Tất cả</button>
            <button className={`filter-chip ${filterStatus === 'unread' ? 'active' : ''}`} onClick={() => setFilterStatus('unread')}>Chưa đọc</button>
            <button className={`filter-chip ${filterStatus === 'read' ? 'active' : ''}`} onClick={() => setFilterStatus('read')}>Đã đọc</button>
        </div>

        <div className="list-area">
          {loading ? <div className="state-msg">Đang tải...</div> : (
            processedData.list.length === 0 ? (
              <div className="state-msg">Không có thông báo nào.</div>
            ) : (
              <div className="card-stack">
                 {processedData.list.map(item => renderCard(item))}
              </div>
            )
          )}
        </div>
      </div>

      {selectedNoti && (
        <div className="modal-backdrop" onClick={() => setSelectedNoti(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className={`modal-header ${getTheme(selectedNoti).class}`}>
              <div className="modal-icon-large">
                {getTheme(selectedNoti).icon}
              </div>
              <div className="modal-title-group">
                <span className="modal-type">{getTheme(selectedNoti).label}</span>
                <h3>{selectedNoti.title}</h3>
              </div>
              <button className="btn-close" onClick={() => setSelectedNoti(null)}><FiX /></button>
            </div>

            <div className="modal-body">
              <div className="modal-time">
                <FiClock /> {new Date(selectedNoti.createdAt).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })}
              </div>
              <div className="modal-message">
                {selectedNoti.message}
              </div>

              {selectedNoti.title.includes("Nhắc nhở đóng phí") && (
                 <button className="btn-modal-action" onClick={() => navigate('/resident/payment')}>
                    Đến trang thanh toán
                 </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}