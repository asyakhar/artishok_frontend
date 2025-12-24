import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RegisterPage.css";

const API_BASE_URL = "http://localhost:8080";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Аватар пользователя
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const avatarFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "ARTIST",
    phoneNumber: "",
    bio: "",
    avatarUrl: "",
  });

  const steps = [
    {
      title: "Личные данные",
      question: "Как вас зовут?",
      field: "fullName",
      type: "text",
      placeholder: "Иванов Иван Иванович",
      required: true,
      description: "Введите ваше полное имя",
    },
    {
      title: "Контактная информация",
      question: "Ваш email адрес?",
      field: "email",
      type: "email",
      placeholder: "example@mail.com",
      required: true,
      description: "Мы отправим на него подтверждение регистрации",
    },
    {
      title: "Безопасность",
      question: "Придумайте пароль",
      field: "password",
      type: "password",
      placeholder: "Минимум 6 символов",
      required: true,
      description: "Пароль должен содержать не менее 6 символов",
    },
    {
      title: "Подтверждение пароля",
      question: "Повторите пароль",
      field: "confirmPassword",
      type: "password",
      placeholder: "Повторите пароль",
      required: true,
      description: "Для подтверждения",
    },
    {
      title: "Ваша роль",
      question: "Кто вы?",
      field: "role",
      type: "select",
      options: [
        {
          value: "ARTIST",
          label: "Художник 🎨",
          description: "Создаю и продаю свои работы",
        },
        {
          value: "GALLERY_OWNER",
          label: "Владелец галереи 🏛️",
          description: "Организую выставки и управляю галереей",
        },
      ],
      required: true,
      description: "Выберите свою роль в мире искусства",
    },
    {
      title: "Контактный телефон",
      question: "Ваш телефон",
      field: "phoneNumber",
      type: "tel",
      placeholder: "+7 (999) 000-00-00",
      required: true,
      description: "Для связи и уведомлений. Обязательное поле",
    },
    {
      title: "О себе",
      question: "Расскажите о себе (необязательно)",
      field: "bio",
      type: "textarea",
      placeholder: "Мой творческий путь...",
      required: false,
      description: "Коротко о вашем опыте и стиле",
    },
    {
      title: "Аватар",
      question: "Загрузите аватар (необязательно)",
      field: "avatar",
      type: "file",
      required: false,
      description: "Максимальный размер 10MB",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOptionSelect = (value) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверяем размер
      if (file.size > 10 * 1024 * 1024) {
        setError("Файл слишком большой (макс. 10MB)");
        return;
      }

      // Проверяем тип
      if (!file.type.startsWith('image/')) {
        setError("Выберите файл изображения (JPG, PNG)");
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));

      setFormData(prev => ({
        ...prev,
        avatarUrl: "",
        hasAvatar: true
      }));

      setError("");
    }
  };

  const nextStep = () => {
    const currentStep = steps[step];

    if (currentStep.required) {
      // Для файлового поля проверяем avatarFile
      if (currentStep.type === "file") {
        // Файл не обязателен, пропускаем проверку
      } else if (!formData[currentStep.field]?.trim()) {
        setError(`Пожалуйста, заполните это поле`);
        return;
      }
    }

    if (currentStep.field === "email" && formData.email) {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(formData.email)) {
        setError("Введите корректный email адрес");
        return;
      }
    }

    if (
      currentStep.field === "confirmPassword" &&
      formData.password !== formData.confirmPassword
    ) {
      setError("Пароли не совпадают");
      return;
    }

    // Валидация телефона для шага phoneNumber
    if (currentStep.field === "phoneNumber" && formData.phoneNumber) {
      const phoneRegex = /^\+?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        setError("Введите корректный номер телефона");
        return;
      }
    }

    setError("");
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("fullName", formData.fullName);
      formDataToSend.append("role", formData.role);
      formDataToSend.append("phoneNumber", formData.phoneNumber || "");
      formDataToSend.append("bio", formData.bio || "");

      if (avatarFile) {
        formDataToSend.append("avatarFile", avatarFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register-with-avatar`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Ошибка ${response.status}`);
      }

      if (data.success) {
        // Успешная регистрация для всех ролей
        setStep(steps.length);

        // Разные сообщения для разных ролей
        if (formData.role === "GALLERY_OWNER") {
          setSuccess(
            `Регистрация владельца галереи успешна! Мы отправили письмо с подтверждением на ${formData.email}. После подтверждения email вы сможете создать свою галерею в личном кабинете.`
          );
        } else {
          setSuccess(
            `Регистрация успешна! Мы отправили письмо с подтверждением на ${formData.email}`
          );
        }
      } else {
        throw new Error(data.error || "Ошибка регистрации");
      }
    } catch (err) {
      setError(err.message || "Ошибка регистрации. Проверьте подключение к серверу.");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  // Если регистрация завершена, показываем финальный экран
  if (step === steps.length) {
    return (
      <div className="minimal-register-page">
        <div className="minimal-register-container success-container">
          <div className="success-icon">
            <i className="fas fa-envelope-circle-check"></i>
          </div>
          <h1 className="register-title">Регистрация завершена!</h1>
          <p className="success-message">
            {formData.role === "GALLERY_OWNER" ? (
              <>
                <strong>Владелец галереи успешно зарегистрирован!</strong>
                <br /><br />
                Мы отправили письмо с подтверждением на адрес:
                <br />
                <strong>{formData.email}</strong>
              </>
            ) : (
              <>
                Мы отправили письмо с подтверждением на адрес:
                <br />
                <strong>{formData.email}</strong>
              </>
            )}
          </p>

          {formData.role === "GALLERY_OWNER" && (
            <div className="gallery-owner-info">
              <div className="info-card">
                <i className="fas fa-info-circle"></i>
                <div className="info-content">
                  <h4>Что дальше?</h4>
                  <p>После подтверждения email:</p>
                  <ol>
                    <li>Войдите в свой аккаунт</li>
                    <li>Перейдите в личный кабинет</li>
                    <li>Создайте свою первую галерею</li>
                    <li>Настройте план галереи и места</li>
                    <li>Начните организовывать выставки</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <p className="success-description">
            Пожалуйста, проверьте вашу почту и перейдите по ссылке в письме,
            <br />
            чтобы активировать ваш аккаунт.
          </p>
          <div className="success-actions">
            <Link to="/login" className="btn btn-primary">
              <i className="fas fa-sign-in-alt"></i>
              Перейти к входу
            </Link>
            <button
              className="btn btn-outline"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-user-plus"></i>
              Зарегистрировать ещё
            </button>
          </div>
          <div className="email-tips">
            <h4>Не получили письмо?</h4>
            <ul>
              <li>Проверьте папку "Спам" или "Рассылки"</li>
              <li>Убедитесь, что адрес указан верно: {formData.email}</li>
              <li>Попробуйте отправить письмо повторно через 5 минут</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="minimal-register-page">
      <div className="minimal-register-container">
        {/* Декоративный элемент */}
        <div className="art-decoration">
          <div className="brush-stroke"></div>
          <div className="palette-dot"></div>
          <div className="canvas-line"></div>
        </div>

        <div className="register-header">
          <Link to="/" className="back-home">
            <i className="fas fa-arrow-left"></i>
            <span>На главную</span>
          </Link>
          <h1 className="register-title">Добро пожаловать</h1>
          <p className="register-subtitle">Давайте создадим ваш профиль</p>
        </div>

        {/* Прогресс */}
        <div className="progress-container">
          <div className="progress-track">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="step-info">
            <span className="step-title">{currentStep.title}</span>
            <div className="step-counter">
              <span className="current-step">Шаг {step + 1}</span>
              <span className="total-steps">из {steps.length}</span>
            </div>
          </div>
        </div>

        {/* Форма с вопросами */}
        <form onSubmit={handleSubmit} className="question-form">
          <div className="question-card">
            <div className="question-header">
              <div className="question-number">0{step + 1}</div>
              <h2 className="question-text">{currentStep.question}</h2>
            </div>

            <p className="question-description">{currentStep.description}</p>

            {/* Поле ввода */}
            {currentStep.type === "select" ? (
              <div className="options-container">
                {currentStep.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`option-button ${formData.role === option.value ? "selected" : ""
                      }`}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    <span className="option-emoji">
                      {option.label.split(" ")[0]}
                    </span>
                    <div className="option-content">
                      <span className="option-title">{option.label}</span>
                      <span className="option-description">
                        {option.description}
                      </span>
                    </div>
                    {formData.role === option.value && (
                      <i className="fas fa-check check-icon"></i>
                    )}
                  </button>
                ))}
              </div>
            ) : currentStep.type === "textarea" ? (
              <textarea
                name={currentStep.field}
                value={formData[currentStep.field]}
                onChange={handleChange}
                placeholder={currentStep.placeholder}
                className="form-textarea"
                rows={4}
              />
            ) : currentStep.type === "file" ? (
              <div className="file-upload-container">
                <input
                  type="file"
                  name="avatarFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  ref={avatarFileInputRef}
                  style={{ display: 'none' }}
                />

                <div className="avatar-preview-container">
                  {avatarPreview ? (
                    <div className="avatar-preview">
                      <img src={avatarPreview} alt="Preview" />
                      <button
                        type="button"
                        className="remove-avatar"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview("");
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div
                      className="avatar-placeholder"
                      onClick={() => avatarFileInputRef.current.click()}
                    >
                      <i className="fas fa-user-plus"></i>
                      <span>Нажмите для загрузки</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => avatarFileInputRef.current.click()}
                >
                  <i className="fas fa-upload"></i>
                  Выбрать файл
                </button>
              </div>
            ) : (
              <input
                type={currentStep.type}
                name={currentStep.field}
                value={formData[currentStep.field]}
                onChange={handleChange}
                placeholder={currentStep.placeholder}
                className="form-input"
                autoFocus
              />
            )}

            {/* Сообщения */}
            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}
          </div>

          {/* Навигация */}
          <div className="navigation-buttons">
            {step > 0 && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={prevStep}
                disabled={loading}
              >
                <i className="fas fa-arrow-left"></i>
                Назад
              </button>
            )}

            {step < steps.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={nextStep}
                disabled={
                  loading ||
                  (currentStep.required && !formData[currentStep.field]?.trim())
                }
              >
                {step === steps.length - 2 ? "Перейти к завершению" : "Далее"}
                <i className="fas fa-arrow-right"></i>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Регистрируем...
                  </>
                ) : (
                  <>
                    Завершить регистрацию
                    <i className="fas fa-check"></i>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="login-prompt">
            Уже есть аккаунт? <Link to="/login">Войдите</Link>
          </div>
        </form>

        {/* Декоративные элементы */}
        <div className="art-elements">
          <div className="art-element paint-tube">
            <i className="fas fa-fill-drip"></i>
          </div>
          <div className="art-element brush">
            <i className="fas fa-paint-brush"></i>
          </div>
          <div className="art-element palette">
            <i className="fas fa-palette"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;