import { useState } from "react";
import axios from "axios";
import "../styles/Authentication.css";
import Logo from "../assets/images/Logo.png";
import UserIcon from "../assets/images/user.jpg";

function Authentication({ onSuccess }) {
  const [invalidloginName, setInvalidloginName] = useState(false);
  const [invalidPass, setInvalidPass] = useState(false);
  const [enteredloginName, setEnteredloginName] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const loginNameNotValid = submitted && enteredloginName.trim().length == 0;
  const PassNotValid = submitted && enteredPassword.trim().length < 5;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setInvalidloginName(loginNameNotValid);
    setInvalidPass(PassNotValid);

    if (!loginNameNotValid && !PassNotValid) {
      try {
        const res = await axios.post("http://localhost:5000/api/auth/login", {
          username: enteredloginName,
          password: enteredPassword,
        });

        const { accessToken, user } = res.data;

        localStorage.setItem("token", accessToken);
        localStorage.setItem("role", user.role);

        if (onSuccess) onSuccess();
      } catch (err) {
        setInvalidloginName(true);
        setInvalidPass(true);
      }
    }
  };

  return (
    <div className="auth-wrapper">
      <img src={Logo} alt="Logo" className="logo" />
      <div id="auth">
        <div id="auth-inputs">
          <img src={UserIcon} alt="User Icon" className="user-icon" />
          <h2>ĐĂNG NHẬP</h2>
          <form className="controls" onSubmit={handleSubmit} noValidate>
            <div className="control">
              <input
                type="tel"
                placeholder=" "
                className={`loginName ${invalidloginName ? "invalid" : ""}`}
                onChange={(event) => setEnteredloginName(event.target.value)}
              />
              <label>Tên đăng nhập</label>
              {invalidloginName && <p className="error-text">Sai tên đăng nhập</p>}
            </div>

            <div className="control">
              <input
                type="password"
                placeholder=" "
                className={`password ${invalidPass ? "invalid" : ""}`}
                onChange={(event) => setEnteredPassword(event.target.value)}
              />
              <label>Mật khẩu</label>
              {invalidPass && <p className="error-text">Sai mật khẩu</p>}
            </div>

            <button type="button" className="forgetPass">Quên mật khẩu</button>
            <button type="submit">Đăng nhập</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Authentication;
