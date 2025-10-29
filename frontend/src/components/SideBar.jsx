import { Link, useLocation } from "react-router-dom";
import { FaHome, FaUsers, FaAddressCard, FaClipboard } from "react-icons/fa";

const menuItems = [
  { icon: FaHome, label: "Trang chủ", path: "/" },
  { icon: FaUsers, label: "Hộ khẩu", path: "/households" },
  { icon: FaAddressCard, label: "Nhân khẩu", path: "/residents" },
  { icon: FaClipboard, label: "Khoản thu", path: "/revenues" },
  { icon: FaClipboard, label: "Khoản chi", path: "/expenses" },
];

export default function SideBar() {
  const location = useLocation(); 

  return (
    <aside className="sidebar">
      <ul>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <li key={index}>
              <Link to={item.path} className={isActive ? "active" : ""}>
                <div className="menu-item">
                  <span className="icon">
                    <Icon size={20} />
                  </span>
                  <span className="label">{item.label}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
