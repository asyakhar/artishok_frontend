import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RegisterPage.css";

const API_BASE_URL = "http://localhost:8080";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [galleryData, setGalleryData] = useState({
    name: "",
    address: "",
    description: "",
    phone: "",
    website: "",
  });

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
      question: "URL вашего аватара (необязательно)",
      field: "avatarUrl",
      type: "url",
      placeholder: "https://example.com/avatar.jpg",
      required: false,
      description: "Ссылка на ваше фото",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGalleryChange = (e) => {
    const { name, value } = e.target;
    setGalleryData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOptionSelect = (value) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }));

    // Если выбрана роль владельца галереи, показываем форму для галереи
    if (value === "GALLERY_OWNER") {
      setShowGalleryForm(true);
    } else {
      setShowGalleryForm(false);
    }
  };

  const nextStep = () => {
    const currentStep = steps[step];

    // Валидация
    if (currentStep.required && !formData[currentStep.field]?.trim()) {
      setError(`Пожалуйста, заполните это поле`);
      return;
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
      const userData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
        phoneNumber: formData.phoneNumber || "",
        bio: formData.bio || "",
        avatarUrl: formData.avatarUrl || "",
      };

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Ошибка ${response.status}`);
      }

      if (data.success) {
        // Если пользователь - владелец галереи, показываем форму для создания галереи
        if (formData.role === "GALLERY_OWNER") {
          setShowGalleryForm(true);
        } else {
          // Показываем экран успешной регистрации
          setStep(steps.length);
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

  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Сначала регистрируем пользователя
      const userData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
        phoneNumber: formData.phoneNumber || "",
        bio: formData.bio || "",
        avatarUrl: formData.avatarUrl || "",
      };

      // Регистрация пользователя
      const userResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const userDataResult = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(userDataResult.error || `Ошибка регистрации пользователя`);
      }

      console.log('Телефон пользователя при регистрации:', galleryData.phoneNumber);
      console.log('Полные данные пользователя:', userDataResult);
      // Если пользователь зарегистрирован, создаем галерею
      const galleryResponse = await fetch(`${API_BASE_URL}/api/galleries/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userDataResult.token || ''}`
        },
        body: JSON.stringify({
          ...galleryData,
          ownerId: userDataResult.userId
        }),
      });

      const galleryResult = await galleryResponse.json();

      if (!galleryResponse.ok) {
        throw new Error(galleryResult.error || `Ошибка создания галереи`);
      }

      // Показываем экран успешной регистрации
      setStep(steps.length);
      setSuccess(
        `Регистрация успешна! Галерея "${galleryData.name}" создана. Мы отправили письмо с подтверждением на ${formData.email}`
      );

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
            Мы отправили письмо с подтверждением на адрес:
            <br />
            <strong>{formData.email}</strong>
          </p>
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

  // Если выбрана роль владельца галереи и показываем форму для галереи
  if (showGalleryForm && formData.role === "GALLERY_OWNER") {
    return (
      <div className="minimal-register-page">
        <div className="minimal-register-container">
          <div className="register-header">
            <button
              className="back-home"
              onClick={() => setShowGalleryForm(false)}
            >
              <i className="fas fa-arrow-left"></i>
              <span>Назад к регистрации</span>
            </button>
            <h1 className="register-title">Создание галереи</h1>
            <p className="register-subtitle">
              Заполните информацию о вашей галерее
            </p>
          </div>

          <form onSubmit={handleGallerySubmit} className="gallery-form">
            <div className="form-group">
              <label htmlFor="name">Название галереи *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={galleryData.name}
                onChange={handleGalleryChange}
                placeholder="Например: Галерея современного искусства"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Адрес галереи *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={galleryData.address}
                onChange={handleGalleryChange}
                placeholder="Город, улица, дом"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Описание галереи</label>
              <textarea
                id="description"
                name="description"
                value={galleryData.description}
                onChange={handleGalleryChange}
                placeholder="Расскажите о вашей галерее, концепции, направлении..."
                className="form-textarea"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Телефон галереи</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={galleryData.phone}
                onChange={handleGalleryChange}
                placeholder="+7 (999) 000-00-00"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Веб-сайт</label>
              <input
                type="url"
                id="website"
                name="website"
                value={galleryData.website}
                onChange={handleGalleryChange}
                placeholder="https://example.com"
                className="form-input"
              />
            </div>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowGalleryForm(false)}
                disabled={loading}
              >
                <i className="fas fa-arrow-left"></i>
                Назад
              </button>
              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Создаем галерею...
                  </>
                ) : (
                  <>
                    Создать галерею
                    <i className="fas fa-check"></i>
                  </>
                )}
              </button>
            </div>

            <p className="form-note">
              * После регистрации вы сможете загрузить план галереи и настроить
              карту мест в личном кабинете
            </p>
          </form>
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
                className="btn btn-outline"
                onClick={nextStep}
                disabled={
                  loading || (currentStep.required && !formData[currentStep.field])
                }
              >
                Далее
                <i className="fas fa-arrow-right"></i>
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-success"
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