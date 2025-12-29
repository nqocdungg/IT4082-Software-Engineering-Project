import "../../styles/staff/sidebar.css"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  FiGrid,
  FiHome,
  FiUsers,
  FiRepeat,
  FiClock,
  FiTrendingUp,
  FiFileText,
  FiDollarSign,
  FiUser,
  FiShield,
  FiActivity,
  FiLogOut
} from "react-icons/fi"
import logo from "../../assets/images/new-logo.png"

const menuGroups = [
  {
    title: "TỔNG QUAN",
    items: [
      { icon: FiGrid, label: "Thống kê", path: "/dashboard" }
    ]
  },
  {
    title: "QUẢN LÝ DÂN CƯ",
    items: [
      { icon: FiHome, label: "Hộ khẩu", path: "/households" },
      { icon: FiUsers, label: "Cư dân", path: "/residents" },
      { icon: FiRepeat, label: "Biến đổi nhân khẩu", path: "/resident-changes" },
      { icon: FiClock, label: "Lịch sử biến động", disabled: true }
    ]
  },
  {
    title: "TÀI CHÍNH",
    items: [
      { icon: FiTrendingUp, label: "Khoản thu", path: "/revenues" },
      { icon: FiFileText, label: "Báo cáo - Thống kê", path: "/fees-report" },
      { icon: FiDollarSign, label: "Hóa đơn", disabled: true }
    ]
  },
  {
    title: "HỆ THỐNG",
    items: [
      { icon: FiUser, label: "Quản lý tài khoản", disabled: true }
    ]
  }
]

export default function SideBar() {
  const location = useLocation()
  const navigate = useNavigate()

  const logout = () => {
    localStorage.clear()
    navigate("/login")
  }

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar-logo">
        <img src={logo} alt="CiviHub" />
        <span className="sidebar-brand">CIVIHUB</span>
      </div>

      {/* NAV */}
      <nav className="sidebar-nav">
        {menuGroups.map(group => (
          <div key={group.title} className="sidebar-group">
            <div className="sidebar-section">{group.title}</div>

            {group.items.map(item => {
              const Icon = item.icon
              const isActive = item.path && location.pathname === item.path

              if (item.disabled) {
                return (
                  <div key={item.label} className="nav-item disabled">
                    <Icon />
                    <span>
                      {item.label}
                    </span>
                  </div>
                )
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        <button className="logout-btn" onClick={logout}>
          <FiLogOut />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
