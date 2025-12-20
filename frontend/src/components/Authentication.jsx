import { useState } from "react";
import "./Authentication.css";
import Logo from "../assets/images/Logo.png";
import UserIcon from "../assets/images/user.jpg";

function Authentication() {
  // --- Khai báo các state để lưu trữ thông tin và trạng thái lỗi ---
  const [invalidloginName, setInvalidloginName] = useState(false); // sai tên đăng nhập?
  const [invalidPass, setInvalidPass] = useState(false); // sai mật khẩu?
  const [enteredloginName, setEnteredloginName] = useState(""); // giá trị người dùng nhập (login)
  const [enteredPassword, setEnteredPassword] = useState(""); // giá trị người dùng nhập (password)
  const [submitted, setSubmitted] = useState(false); // đánh dấu đã nhấn nút đăng nhập hay chưa

  // --- Kiểm tra hợp lệ (chỉ chạy khi đã nhấn submit) ---
  const loginNameNotValid = submitted && enteredloginName.trim().length !== 10; // tên đăng nhập phải đủ 10 ký tự
  const PassNotValid = submitted && enteredPassword.trim().length < 8; // mật khẩu phải >= 8 ký tự

  // --- Hàm xử lý khi người dùng nhấn "Đăng nhập" ---
  const handleSubmit = (event) => {
    event.preventDefault(); // ngăn reload trang
    setSubmitted(true); // đánh dấu đã submit

    // cập nhật trạng thái lỗi dựa vào kết quả kiểm tra
    setInvalidloginName(loginNameNotValid);
    setInvalidPass(PassNotValid);

    // nếu không có lỗi → xử lý đăng nhập thành công
    if (!loginNameNotValid && !PassNotValid) {
      console.log("Đăng nhập thành công");
      // 👉 Có thể thêm logic: gọi API, điều hướng, lưu token, v.v.
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Logo ở trên cùng */}
      <img src={Logo} alt="Logo" className="logo" />

      <div id="auth">
        <div id="auth-inputs">
          {/* Icon người dùng hiển thị phía trên tiêu đề */}
          <img src={UserIcon} alt="User Icon" className="user-icon" />
          <h2>ĐĂNG NHẬP</h2>

          {/* Form chứa các input */}
          <form className="controls" onSubmit={handleSubmit} noValidate>
            {/* --- Ô nhập tên đăng nhập --- */}
            <div className="control">
              <input
                type="tel"
                placeholder=" "
                className={`loginName ${invalidloginName ? "invalid" : ""}`} // thêm class 'invalid' nếu sai
                onChange={(event) => setEnteredloginName(event.target.value)} // cập nhật giá trị khi người dùng nhập
              />
              <label>Tên đăng nhập</label>
              {/* Hiển thị lỗi nếu tên đăng nhập sai */}
              {invalidloginName && (
                <p className="error-text">Sai tên đăng nhập</p>
              )}
            </div>

            {/* --- Ô nhập mật khẩu --- */}
            <div className="control">
              <input
                type="password"
                placeholder=" "
                className={`password ${invalidPass ? "invalid" : ""}`} // thêm class 'invalid' nếu sai
                onChange={(event) => setEnteredPassword(event.target.value)} // cập nhật giá trị khi nhập
              />
              <label>Mật khẩu</label>
              {/* Hiển thị lỗi nếu mật khẩu sai */}
              {invalidPass && <p className="error-text">Sai mật khẩu</p>}
            </div>

            {/* --- Nút "Quên mật khẩu" --- */}
            <button type="button" className="forgetPass">
              Quên mật khẩu
            </button>

            {/* --- Nút submit form --- */}
            <button type="submit">Đăng nhập</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Authentication;
