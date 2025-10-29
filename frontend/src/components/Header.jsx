import { FaBars, FaBell, FaUser } from "react-icons/fa";

export default function Header() {
  return (
    <header className="header">
      <button className="main-btn">
        <FaBars />
      </button>
      <div className="user">
        <button className="bell"><FaBell /></button>
        <button className="user-account"><FaUser /></button>
      </div>
    </header>
  );
}
