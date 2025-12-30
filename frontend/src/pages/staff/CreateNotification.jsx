import React, { useState, useEffect, useMemo } from "react"
import axios from "axios"
import {
  FiSend, FiBell, FiClock, FiInfo, FiAlertTriangle, FiCalendar,
  FiRotateCw, FiTrash2, FiEye, FiX, FiLayers, FiCheckCircle
} from "react-icons/fi"

import "../../styles/staff/create-notification.css"

const API_BASE = "http://localhost:5000/api"

export default function CreateNotification() {
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [viewingItem, setViewingItem] = useState(null)

  const [formData, setFormData] = useState({
    type: "ANNOUNCEMENT",
    title: "",
    message: "",
  })

  const typeConfig = {
    ANNOUNCEMENT: { label: "Tin tức chung", color: "blue", hex: "#2563eb", icon: <FiInfo /> },
    WARNING: { label: "Cảnh báo / Khẩn cấp", color: "red", hex: "#dc2626", icon: <FiAlertTriangle /> },
    EVENT: { label: "Sự kiện", color: "green", hex: "#16a34a", icon: <FiCalendar /> }
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await axios.get(`${API_BASE}/notifications/history`, {
        headers: getAuthHeaders()
      })
      setHistory(res.data)
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm("Bạn chắc chắn muốn xóa thông báo này?")) return

    try {
      await axios.delete(`${API_BASE}/notifications/${id}`, {
        headers: getAuthHeaders()
      })
      setHistory(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      alert("Xóa thất bại: " + (error.response?.data?.message || "Lỗi server"))
    }
  }

  const stats = useMemo(() => {
    return {
      total: history.length,
      announcement: history.filter(i => i.type === 'ANNOUNCEMENT').length,
      warning: history.filter(i => i.type === 'WARNING').length,
      event: history.filter(i => i.type === 'EVENT').length,
    }
  }, [history])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.message.trim()) {
      alert("Vui lòng nhập đủ thông tin!")
      return
    }
    if (!window.confirm("Xác nhận gửi thông báo này tới toàn bộ cư dân?")) return

    setSending(true)
    try {
      await axios.post(`${API_BASE}/notifications/create`, formData, { headers: getAuthHeaders() })
      setFormData({ type: "ANNOUNCEMENT", title: "", message: "" })
      alert("Đã gửi thông báo thành công!")
      fetchHistory()
    } catch (error) {
      alert("Gửi thất bại: " + (error.response?.data?.message || "Lỗi server"))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="split-layout">
        
        {/* CỘT TRÁI: FORM SOẠN THẢO */}
        <div className="panel compose-panel">
          <div className="panel-head">
            <h3><FiBell /> Soạn thông báo mới</h3>
            <p className="panel-sub">Gửi tin tức, cảnh báo hoặc sự kiện tới cư dân</p>
          </div>
          
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-group">
              <label>Loại thông báo</label>
              <div className="type-selector">
                {Object.keys(typeConfig).map((key) => {
                  const isActive = formData.type === key
                  const cfg = typeConfig[key]
                  return (
                    <div 
                      key={key}
                      className={`type-option ${isActive ? 'active' : ''} ${cfg.color}`}
                      onClick={() => setFormData({...formData, type: key})}
                    >
                      <span className="icon">{cfg.icon}</span>
                      <span className="label">{cfg.label}</span>
                      {isActive && <FiCheckCircle className="check" />}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="form-group">
              <label>Tiêu đề thông báo</label>
              <input
                type="text"
                name="title"
                className="input-field"
                maxLength={100}
                value={formData.title}
                onChange={handleChange}
                placeholder="Ví dụ: Thông báo bảo trì thang máy..."
                required
              />
            </div>

            <div className="form-group flex-grow">
              <label>Nội dung chi tiết</label>
              <textarea
                name="message"
                className="input-field textarea-field"
                value={formData.message}
                onChange={handleChange}
                placeholder="Nhập nội dung đầy đủ..."
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? <FiRotateCw className="spin" /> : <FiSend />}
              {sending ? "Đang xử lý..." : "Phát hành thông báo"}
            </button>
          </form>
        </div>

        {/* CỘT PHẢI: LỊCH SỬ */}
        <div className="panel history-panel">
          <div className="panel-head">
            <div>
              <h3>Lịch sử gửi tin</h3>
              <p className="panel-sub">Danh sách các thông báo đã phát hành</p>
            </div>
            <button onClick={fetchHistory} className="btn-icon-only">
              <FiRotateCw className={loadingHistory ? "spin" : ""} />
            </button>
          </div>

          {/* Mini Stats Bar */}
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-val">{stats.total}</span>
              <span className="stat-lbl">Tổng</span>
            </div>
            <div className="stat-item blue">
              <span className="stat-val">{stats.announcement}</span>
              <span className="stat-lbl">Tin tức</span>
            </div>
            <div className="stat-item red">
              <span className="stat-val">{stats.warning}</span>
              <span className="stat-lbl">Khẩn cấp</span>
            </div>
            <div className="stat-item green">
              <span className="stat-val">{stats.event}</span>
              <span className="stat-lbl">Sự kiện</span>
            </div>
          </div>

          <div className="history-list-wrapper">
            {loadingHistory ? (
              <div className="state-text">Đang tải dữ liệu...</div>
            ) : history.length === 0 ? (
              <div className="state-text">Chưa có dữ liệu.</div>
            ) : (
              <div className="history-list">
                {history.map((item) => {
                  const config = typeConfig[item.type] || typeConfig.ANNOUNCEMENT
                  return (
                    <div key={item.id} className="history-row" onClick={() => setViewingItem(item)}>
                      <div className={`row-icon-box ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="row-content">
                        <div className="row-top">
                          <span className="row-title">{item.title}</span>
                          <span className="row-time">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p className="row-desc">{item.message}</p>
                      </div>
                      <div className="row-actions">
                        <button 
                          className="btn-action delete"
                          onClick={(e) => handleDelete(item.id, e)}
                          title="Xóa"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL CHI TIẾT (WIDE) */}
      {viewingItem && (
        <div className="modal-overlay" onClick={() => setViewingItem(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className={`modal-header ${typeConfig[viewingItem.type]?.color || 'blue'}`}>
              <div className="modal-icon">
                {typeConfig[viewingItem.type]?.icon}
              </div>
              <div className="modal-title-group">
                <span className="modal-label">{typeConfig[viewingItem.type]?.label}</span>
                <h2>{viewingItem.title}</h2>
              </div>
              <button className="close-btn" onClick={() => setViewingItem(null)}><FiX /></button>
            </div>
            
            <div className="modal-body">
              <div className="meta-info">
                <FiClock /> 
                <span>Ngày gửi: {new Date(viewingItem.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="content-text">
                {viewingItem.message}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewingItem(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}