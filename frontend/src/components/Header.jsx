import "../styles/header.css"
import { FiUser, FiSearch } from "react-icons/fi"

export default function Header() {
  return (
    <header className="header">
      
      <div className="header-right">
        <span className="welcome-label">Welcome, Admin</span>
        <button className="icon-btn">
          <FiUser />
        </button>
      </div>
    </header>
  )
}