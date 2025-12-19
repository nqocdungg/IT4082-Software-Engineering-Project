import "../styles/header.css"
import { FiUser } from "react-icons/fi"

export default function Header() {
  return (
    <header className="header">
      <div className="header-left" />

      <div className="header-right">
        <span className="welcome-label">Welcome, Admin</span>
        <span className="header-divider" />
        <button className="icon-btn" aria-label="User">
          <FiUser />
        </button>
      </div>
    </header>
  )
}
