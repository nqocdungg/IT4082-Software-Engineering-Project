import Header from "../components/Header.jsx";
import SideBar from "../components/SideBar.jsx";

function Households() {
    return (
        <>
            <div className="appMain">
                <Header />
                <div className="mainContentWrapper">
                    <SideBar />
                    <div className="mainContent">
                        <h1>Hộ khẩu</h1>
                        <p>Đây là nội dung chính...</p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Households;