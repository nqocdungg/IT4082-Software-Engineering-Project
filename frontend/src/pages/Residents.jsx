import Header from "../components/Header.jsx";
import SideBar from "../components/SideBar.jsx";

export default function Residents() {
  return (
    <div className="appMain">
      <Header />
      <div className="mainContentWrapper">
        <SideBar />

        <main className="mainContent">
          <h1>Dân cư</h1>
          <p>Đây là nội dung chính..</p>
        </main>
      </div>
    </div>
  );
}
