import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ResidentHeader from "../../components/resident/ResidentHeader";
import axios from "axios";
import { 
  FiClock, FiX, FiInfo, FiAlertTriangle, 
  FiCalendar, FiGift, FiDollarSign,
  FiChevronLeft, FiChevronRight, FiFilter
} from "react-icons/fi";
import "../../styles/resident/ResidentNoti.css";

const API_BASE = "http://localhost:5000/api";
const ITEMS_PER_PAGE = 5;

export default function ResidentNotifications() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get("tab") || "general";

  // --- States ---
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoti, setSelectedNoti] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("all"); // all, unread, read
  const [filterMonth, setFilterMonth] = useState(""); // YYYY-MM
  const [filterType, setFilterType] = useState("all"); // ANNOUNCEMENT, WARNING...

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // --- Effects ---

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterStatus, filterMonth, filterType]);

  useEffect(() => {
    setFilterType("all");
  }, [activeTab]);

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
    setFilterMonth("");
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
    if (["FEE_REMINDER", "FEE_ANNOUNCEMENT", "PAYMENT_SUCCESS"].includes(item.type)) {
      return true;
    }
    const title = (item.title || "").toLowerCase();
    return title.includes("phí") || title.includes("sinh nhật");
  };

  const getTheme = (item) => {
    if (item.type === "FEE_REMINDER" || item.title?.includes("Nhắc nhở đóng phí")) 
      return { class: "gold", icon: <FiDollarSign />, label: "Nhắc nợ" };

    if (item.type === "FEE_ANNOUNCEMENT" || item.title?.includes("Thông báo thu phí")) 
      return { class: "purple", icon: <FiDollarSign />, label: "Phí mới" };

    if (item.title?.includes("Chúc mừng sinh nhật")) 
      return { class: "pink", icon: <FiGift />, label: "Lời chúc" };

    if (item.type === "WARNING") 
      return { class: "red", icon: <FiAlertTriangle />, label: "Khẩn cấp" };
    if (item.type === "EVENT") 
      return { class: "green", icon: <FiCalendar />, label: "Sự kiện" };
    
    return { class: "blue", icon: <FiInfo />, label: "Tin tức" }; 
  };

  const processedData = useMemo(() => {
    // 1. Lọc theo Tab (Chung / Cá nhân)
    let baseList = notifications.filter(item => {
      const isPersonal = isPersonalMessage(item);
      return activeTab === "general" ? !isPersonal : isPersonal;
    });

    // Tính toán badge count (cho toàn bộ tab, chưa áp dụng bộ lọc con)
    const unreadGeneral = notifications.filter(i => !isPersonalMessage(i) && !i.isRead).length;
    const unreadPersonal = notifications.filter(i => isPersonalMessage(i) && !i.isRead).length;

    // 2. Lọc theo Trạng thái đọc (Status)
    if (filterStatus === "unread") baseList = baseList.filter(i => !i.isRead);
    if (filterStatus === "read") baseList = baseList.filter(i => i.isRead);

    // 3. Lọc theo Tháng (Month)
    if (filterMonth) {
      baseList = baseList.filter(i => {
        const d = new Date(i.createdAt);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return monthStr === filterMonth;
      });
    }

    // 4. Lọc theo Loại (Type)
    if (filterType !== "all") {
      baseList = baseList.filter(i => i.type === filterType);
    }

    // 5. Phân trang (Pagination)
    const totalItems = baseList.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentItems = baseList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { 
        list: currentItems, 
        counts: { general: unreadGeneral, personal: unreadPersonal },
        pagination: { totalItems, totalPages }
    };
  }, [notifications, activeTab, filterStatus, filterMonth, filterType, currentPage]);

  // --- Render Helpers ---

  const renderPagination = () => {
    const { totalPages } = processedData.pagination;
    if (totalPages <= 1) return null;

    return (
      <div className="pagination-controls">
        <button 
          className="page-btn" 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(c => Math.max(c - 1, 1))}
        >
          <FiChevronLeft />
        </button>
        <span className="page-info">Trang {currentPage} / {totalPages}</span>
        <button 
          className="page-btn" 
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(c => Math.min(c + 1, totalPages))}
        >
          <FiChevronRight />
        </button>
      </div>
    );
  };

  const renderTypeOptions = () => {
    if (activeTab === "general") {
      return (
        <>
          <option value="ANNOUNCEMENT">Tin tức</option>
          <option value="WARNING">Cảnh báo</option>
          <option value="EVENT">Sự kiện</option>
        </>
      );
    } else {
      return (
        <>
          <option value="FEE_ANNOUNCEMENT">Phí mới</option>
          <option value="FEE_REMINDER">Nhắc nợ</option>
          <option value="PAYMENT_SUCCESS">Thanh toán</option>
        </>
      );
    }
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

          {(theme.label === "Nhắc nợ" || theme.label === "Phí mới") && (
             <div className="card-actions">
               <button className="btn-action-pay" onClick={(e) => {
                 e.stopPropagation();
                 markRead(item.id, item.isRead);
                 navigate('/resident/payment');
               }}>
                 Xem chi tiết & Đóng phí
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

        {/* --- TAB CONTROL --- */}
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

        {/* --- FILTER BAR --- */}
        <div className="filter-row">
            <div className="filter-group-left">
              <button className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>Tất cả</button>
              <button className={`filter-chip ${filterStatus === 'unread' ? 'active' : ''}`} onClick={() => setFilterStatus('unread')}>Chưa đọc</button>
              <button className={`filter-chip ${filterStatus === 'read' ? 'active' : ''}`} onClick={() => setFilterStatus('read')}>Đã đọc</button>
            </div>

            <div className="filter-group-right">
               <div className="custom-select-wrapper">
                  <FiFilter className="select-icon"/>
                  <select 
                    className="custom-select" 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">-- Tất cả loại --</option>
                    {renderTypeOptions()}
                  </select>
               </div>

               <div className="custom-date-wrapper">
                  <input 
                    type="month" 
                    className="custom-date-input"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  />
               </div>
            </div>
        </div>

        {/* --- LIST AREA --- */}
        <div className="list-area">
          {loading ? <div className="state-msg">Đang tải...</div> : (
            processedData.list.length === 0 ? (
              <div className="state-msg">
                {filterMonth || filterType !== 'all' ? "Không tìm thấy kết quả phù hợp." : "Không có thông báo nào."}
              </div>
            ) : (
              <>
                <div className="card-stack">
                   {processedData.list.map(item => renderCard(item))}
                </div>
                {/* --- PAGINATION --- */}
                {renderPagination()}
              </>
            )
          )}
        </div>
      </div>

      {/* --- MODAL --- */}
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