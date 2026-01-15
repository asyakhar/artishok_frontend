import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";

const API_BASE_URL = "http://localhost:8080";

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("не активирован")) {
          throw new Error(
            `${data.error} Проверьте почту или запросите повторную отправку.`
          );
        }
        throw new Error(data.error || "Неверные учетные данные");
      }

      sessionStorage.setItem("authToken", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      if (rememberMe) {
        sessionStorage.setItem("rememberMe", "true");
        sessionStorage.setItem("rememberedEmail", formData.email);
      } else {
        sessionStorage.removeItem("rememberMe");
        sessionStorage.removeItem("rememberedEmail");
      }
      window.dispatchEvent(
        new CustomEvent("authStateChanged", {
          detail: { user: data.user, token: data.token },
        })
      );
      switch (data.user.role) {
        case "ADMIN":
          navigate("/admin/dashboard");
          break;
        case "GALLERY_OWNER":
          navigate("/gallery/dashboard");
          break;
        case "ARTIST":
          navigate("/artist/dashboard");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = (email, password) => {
    setFormData({
      email: email,
      password: password,
    });
  };

  return (
    <div className="minimal-login-page">
      <div className="minimal-login-container">
        {/* Декоративные элементы */}
        <div className="login-decoration">
          <div className="login-brush-stroke"></div>
          <div className="login-palette-dot"></div>
          <div className="login-canvas-line"></div>
        </div>

        <div className="login-header">
          <Link to="/" className="login-back-home">
            <i className="fas fa-arrow-left"></i>
            <span>На главную</span>
          </Link>
          <h1 className="login-title">Вход в систему</h1>
          <p className="login-subtitle">Добро пожаловать обратно</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required"></span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="login-input"
              placeholder="example@mail.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Пароль <span className="required"></span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="login-input"
              placeholder="Введите ваш пароль"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className="login-button-container">
            <button
              type="submit"
              className="login-button"
              disabled={loading || !formData.email || !formData.password}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Вход...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Войти
                </>
              )}
            </button>
          </div>
        </form>

        {/* Ссылка на регистрацию */}
        <div className="login-register-prompt">
          <span>Нет аккаунта?</span>
          <Link to="/register">Зарегистрироваться</Link>
        </div>

        {/* Тестовые аккаунты (только для разработки) */}
        <div className="login-test">
          <p
            style={{
              fontSize: "12px",
              color: "#6c757d",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            Для тестирования:
          </p>
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              marginTop: "10px",
            }}
          >
            <button
              onClick={() => handleTestLogin("sdan@mail.ru", "itmoitmo")}
              className="btn-outline"
              style={{ fontSize: "12px", padding: "5px 10px" }}
            >
              Artist
            </button>
            <button
              onClick={() =>
                handleTestLogin("artist5676@artplatform.com", "admin12345")
              }
              className="btn-outline"
              style={{ fontSize: "12px", padding: "5px 10px" }}
            >
              Gallery Owner
            </button>
            <button
              onClick={() => handleTestLogin("admin@test.com", "password123")}
              className="btn-outline"
              style={{ fontSize: "12px", padding: "5px 10px" }}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Декоративные элементы внизу */}
        <div className="login-art-elements">
          <div className="login-art-element login-paint-tube">
            <i className="fas fa-fill-drip"></i>
          </div>
          <div className="login-art-element login-brush">
            <i className="fas fa-paint-brush"></i>
          </div>
          <div className="login-art-element login-palette">
            <i className="fas fa-palette"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
