import Header from "../components/Header.jsx";
import SideBar from "../components/SideBar.jsx";

function Revenues() {
    return (
        <>
            <div className="appMain">
                <Header />
                <div className="mainContentWrapper">
                    <SideBar />
                    <div className="mainContent">
                        <h1>Khoản thu</h1>
                        <p>Đây là nội dung chính...</p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Revenues