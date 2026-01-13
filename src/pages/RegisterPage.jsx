import React, { useState, useRef, useEffect } from "react";
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

  const [fieldErrors, setFieldErrors] = useState({});

  const steps = [
    {
      title: "Личные данные",
      question: "Как вас зовут?",
      field: "fullName",
      type: "text",
      placeholder: "Иванов Иван Иванович",
      required: true,
      description: "Введите ваше полное имя (ФИО)",
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
      placeholder: "+7 (___) ___-__-__",
      required: true,
      description: "Введите номер в формате +7 (999) 999-99-99",
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

  // Форматирование телефона в реальном времени
  const formatPhoneNumber = (value) => {
    // Убираем все нецифровые символы
    const cleaned = value.replace(/\D/g, "");

    // Если начинается с 8 или 7, приводим к +7
    let formatted = cleaned;
    if (cleaned.startsWith("8") || cleaned.startsWith("7")) {
      formatted = "7" + cleaned.slice(1);
    }

    // Форматируем по маске
    const match = formatted.match(
      /^(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/
    );

    if (!match) return "";

    const [, code, part1, part2, part3, part4] = match;

    let result = "";
    if (code) result += `+${code}`;
    if (part1) result += ` (${part1}`;
    if (part2) result += `) ${part2}`;
    if (part3) result += `-${part3}`;
    if (part4) result += `-${part4}`;

    return result;
  };

  // Валидация поля Full Name
  const validateFullName = (name) => {
    if (!name.trim()) {
      return "ФИО обязательно для заполнения";
    }
    if (name.trim().split(" ").length < 2) {
      return "Введите имя и фамилию (минимум 2 слова)";
    }
    if (name.length < 3) {
      return "ФИО должно содержать минимум 3 символа";
    }
    if (name.length > 100) {
      return "ФИО не должно превышать 100 символов";
    }
    return "";
  };

  // Валидация поля Email
  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email обязателен для заполнения";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Введите корректный email адрес";
    }
    if (email.length > 100) {
      return "Email не должен превышать 100 символов";
    }
    return "";
  };

  // Валидация поля Password
  const validatePassword = (password) => {
    if (!password) {
      return "Пароль обязателен для заполнения";
    }
    if (password.length < 6) {
      return "Пароль должен содержать минимум 6 символов";
    }
    if (password.length > 50) {
      return "Пароль не должен превышать 50 символов";
    }
    return "";
  };

  // Валидация поля Confirm Password
  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) {
      return "Подтверждение пароля обязательно";
    }
    if (confirmPassword !== password) {
      return "Пароли не совпадают";
    }
    return "";
  };

  // Валидация поля Phone Number
  const validatePhoneNumber = (phone) => {
    if (!phone.trim()) {
      return "Телефон обязателен для заполнения";
    }

    // Получаем только цифры из отформатированного номера
    const cleaned = phone.replace(/\D/g, "");

    // Проверяем, что номер содержит 11 цифр (для российских номеров)
    if (cleaned.length !== 11) {
      return "Номер телефона должен содержать 11 цифр";
    }

    // Проверяем, что номер начинается с 7 или 8
    if (!cleaned.match(/^(7|8)/)) {
      return "Номер должен начинаться с +7 или 8";
    }

    // Проверяем форматирование - должен быть полный шаблон
    const phoneRegex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
    if (!phoneRegex.test(phone)) {
      return "Заполните телефон полностью в формате +7 (999) 999-99-99";
    }

    return "";
  };

  // Валидация поля Bio
  const validateBio = (bio) => {
    if (bio && bio.length > 500) {
      return "Биография не должна превышать 500 символов";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    // Специальная обработка для телефона
    if (name === "phoneNumber") {
      newValue = formatPhoneNumber(value);

      // Ограничиваем максимальную длину
      if (newValue.length > 18) {
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Очищаем ошибку для этого поля при вводе
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
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
      if (!file.type.startsWith("image/")) {
        setError("Выберите файл изображения (JPG, PNG)");
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));

      setFormData((prev) => ({
        ...prev,
        avatarUrl: "",
      }));

      setError("");
    }
  };

  const validateCurrentStep = () => {
    const currentStepData = steps[step];
    const fieldValue = formData[currentStepData.field];
    let error = "";

    switch (currentStepData.field) {
      case "fullName":
        error = validateFullName(fieldValue);
        break;
      case "email":
        error = validateEmail(fieldValue);
        break;
      case "password":
        error = validatePassword(fieldValue);
        break;
      case "confirmPassword":
        error = validateConfirmPassword(fieldValue, formData.password);
        break;
      case "phoneNumber":
        error = validatePhoneNumber(fieldValue);
        break;
      case "bio":
        error = validateBio(fieldValue);
        break;
      case "role":
        if (!fieldValue) {
          error = "Выберите вашу роль";
        }
        break;
      case "avatar":
        // Аватар не обязателен, но если выбран, проверяем
        if (avatarFile) {
          if (avatarFile.size > 10 * 1024 * 1024) {
            error = "Файл слишком большой (макс. 10MB)";
          }
          if (!avatarFile.type.startsWith("image/")) {
            error = "Выберите файл изображения (JPG, PNG)";
          }
        }
        break;
      default:
        break;
    }

    if (error) {
      setFieldErrors((prev) => ({
        ...prev,
        [currentStepData.field]: error,
      }));
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) {
      return;
    }

    setFieldErrors({});
    setError("");

    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
      setFieldErrors({});
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    // Валидация всех полей перед отправкой
    const errors = {};

    // Проверяем все обязательные поля
    steps.forEach((stepItem) => {
      if (stepItem.required) {
        const fieldValue = formData[stepItem.field];
        let error = "";

        switch (stepItem.field) {
          case "fullName":
            error = validateFullName(fieldValue);
            break;
          case "email":
            error = validateEmail(fieldValue);
            break;
          case "password":
            error = validatePassword(fieldValue);
            break;
          case "confirmPassword":
            error = validateConfirmPassword(fieldValue, formData.password);
            break;
          case "phoneNumber":
            error = validatePhoneNumber(fieldValue);
            break;
          case "role":
            if (!fieldValue) {
              error = "Выберите вашу роль";
            }
            break;
          default:
            break;
        }

        if (error) {
          errors[stepItem.field] = error;
        }
      }
    });

    // Если есть ошибки, показываем их и останавливаем отправку
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);

      // Переходим к первому полю с ошибкой
      const firstErrorField = Object.keys(errors)[0];
      const errorStepIndex = steps.findIndex(
        (step) => step.field === firstErrorField
      );
      if (errorStepIndex !== -1) {
        setStep(errorStepIndex);
      }

      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("email", formData.email.trim());
      formDataToSend.append("password", formData.password);
      formDataToSend.append("fullName", formData.fullName.trim());
      formDataToSend.append("role", formData.role);

      // Очищаем телефон от форматирования перед отправкой
      const cleanPhone = formData.phoneNumber.replace(/\D/g, "");
      formDataToSend.append("phoneNumber", cleanPhone);

      formDataToSend.append("bio", formData.bio?.trim() || "");

      if (avatarFile) {
        formDataToSend.append("avatarFile", avatarFile);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/auth/register-with-avatar`,
        {
          method: "POST",
          body: formDataToSend,
        }
      );

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
      setError(
        err.message || "Ошибка регистрации. Проверьте подключение к серверу."
      );
    } finally {
      setLoading(false);
    }
  };

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  // Получаем ошибку для текущего поля
  const currentFieldError = fieldErrors[currentStep?.field] || "";

  // Если регистрация завершена, показываем финальный экран
  if (step === steps.length) {
    return (
      <div className="minimal-register-page">
        <div className="minimal-register-container success-container">
          <div className="success-icon">
            <i className="fas fa-envelope-circle-check"></i>
          </div>
          <h1 className="register-title">Регистрация завершена!</h1>

          <div className="success-message">
            {formData.role === "GALLERY_OWNER" ? (
              <>
                <div className="success-role-title">
                  <strong>Владелец галереи успешно зарегистрирован!</strong>
                </div>
                <div className="email-confirmation-section">
                  <div className="email-content">
                    <p className="email-label">Мы отправили письмо на адрес:</p>
                    <div className="email-address">
                      <i className="fas fa-at"></i>
                      <span>{formData.email}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="email-confirmation-section">
                <div className="email-content">
                  <p className="email-label">Мы отправили письмо на адрес:</p>
                  <div className="email-address">
                    <i className="fas fa-at"></i>
                    <span>{formData.email}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {formData.role === "GALLERY_OWNER" && (
            <div className="gallery-owner-info">
              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className="info-content">
                  <h4>Что дальше?</h4>
                  <p>После подтверждения email:</p>
                  <ol className="next-steps-list">
                    <li>
                      <i className="fas fa-sign-in-alt"></i>
                      <span>Войдите в свой аккаунт</span>
                    </li>
                    <li>
                      <i className="fas fa-user-cog"></i>
                      <span>Перейдите в личный кабинет</span>
                    </li>
                    <li>
                      <i className="fas fa-plus-circle"></i>
                      <span>Создайте свою первую галерею</span>
                    </li>
                    <li>
                      <i className="fas fa-map-marked-alt"></i>
                      <span>Настройте план галереи и места</span>
                    </li>
                    <li>
                      <i className="fas fa-images"></i>
                      <span>Начните организовывать выставки</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <div className="success-instructions">
            <div className="instruction-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <p className="instruction-text">
              Пожалуйста, проверьте вашу почту и перейдите по ссылке в письме,
              чтобы активировать ваш аккаунт.
            </p>
          </div>

          <div className="success-actions">
            <Link to="/login" className="btn btn-primary btn-icon">
              <i className="fas fa-sign-in-alt"></i>
              <span>Перейти к входу</span>
            </Link>
            <button
              className="btn btn-outline btn-icon"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-user-plus"></i>
              <span>Зарегистрировать ещё</span>
            </button>
          </div>

          <div className="email-tips-card">
            <div className="tips-header">
              <i className="fas fa-question-circle"></i>
              <h4>Не получили письмо?</h4>
            </div>
            <ul className="tips-list">
              <li>
                <i className="fas fa-inbox"></i>
                <span>Проверьте папку "Спам" или "Рассылки"</span>
              </li>
              <li>
                <i className="fas fa-check-double"></i>
                <span>Убедитесь, что адрес указан верно: {formData.email}</span>
              </li>
              <li>
                <i className="fas fa-redo"></i>
                <span>Попробуйте отправить письмо повторно через 5 минут</span>
              </li>
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
                    className={`option-button ${
                      formData.role === option.value ? "selected" : ""
                    }`}
                    onClick={() => handleOptionSelect(option.value)}
                  >
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
              <>
                <textarea
                  name={currentStep.field}
                  value={formData[currentStep.field]}
                  onChange={handleChange}
                  placeholder={currentStep.placeholder}
                  className="form-textarea"
                  rows={4}
                  maxLength="500"
                />
                <div className="char-counter">
                  {formData[currentStep.field]?.length || 0}/500 символов
                </div>
              </>
            ) : currentStep.type === "file" ? (
              <div className="file-upload-container">
                <input
                  type="file"
                  name="avatarFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  ref={avatarFileInputRef}
                  style={{ display: "none" }}
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
                maxLength={
                  currentStep.field === "email"
                    ? "100"
                    : currentStep.field === "fullName"
                    ? "100"
                    : currentStep.field === "password"
                    ? "50"
                    : currentStep.field === "confirmPassword"
                    ? "50"
                    : currentStep.field === "phoneNumber"
                    ? "18"
                    : ""
                }
              />
            )}

            {/* Показываем ошибку для конкретного поля */}
            {currentFieldError && (
              <div className="field-error-message">
                <i className="fas fa-exclamation-circle"></i>
                {currentFieldError}
              </div>
            )}

            {/* Общие ошибки */}
            {error && !currentFieldError && (
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
                disabled={loading}
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
