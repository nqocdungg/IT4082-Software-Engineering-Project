// src/components/Layout.jsx
import Sidebar from "./SideBar"
import Header from "./Header"
import { Outlet } from "react-router-dom"
import "../styles/layout.css"

export default function Layout() {
  return (
    <div className="app-layout">
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* RIGHT AREA */}
      <div className="main-area">
        {/* TOP HEADER */}
        <Header />

        {/* PAGE CONTENT */}
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
