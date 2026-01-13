import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ArtistDashboard.css";
import AddArtworkModal from "./AddArtworkModal";

const API_BASE_URL = "http://localhost:8080";

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState({
    profile: true,
    bookings: true,
    artworks: true,
    exhibitions: true,
  });
  const [selectedBookingComment, setSelectedBookingComment] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings");
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableBookings, setAvailableBookings] = useState([]);
  const [editingArtwork, setEditingArtwork] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const user = JSON.parse(sessionStorage.getItem("user") || "null");

    if (!token || !user) {
      navigate("/login");
      return;
    }

    if (user.role !== "ARTIST") {
      navigate("/");
      return;
    }

    setUserData(user);
    fetchBookings(user.id);
    fetchArtworks(user.id);
    fetchExhibitions();
    fetchUserProfile(token);
  }, [navigate]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const user = await response.json();
        setUserData(user);
        sessionStorage.setItem("user", JSON.stringify(user));
      }
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error);
    } finally {
      setLoading((prev) => ({ ...prev, profile: false }));
    }
  };

  const fetchBookings = async (artistId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/artist/${artistId}`
      );
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки бронирований:", error);
      setError("Не удалось загрузить бронирования");
    } finally {
      setLoading((prev) => ({ ...prev, bookings: false }));
    }
  };

  const fetchArtworks = async (artistId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/artworks/artist/${artistId}`
      );
      if (response.ok) {
        const data = await response.json();
        setArtworks(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки картин:", error);
      setError("Не удалось загрузить картины");
    } finally {
      setLoading((prev) => ({ ...prev, artworks: false }));
    }
  };

  const fetchExhibitions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/exhibition-events`);
      if (response.ok) {
        const data = await response.json();
        setExhibitions(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки выставок:", error);
      setError("Не удалось загрузить список выставок");
    } finally {
      setLoading((prev) => ({ ...prev, exhibitions: false }));
    }
  };

  useEffect(() => {
    if (bookings.length > 0) {
      const confirmedBookings = bookings.filter(
        (booking) => booking.status === "CONFIRMED"
      );
      setAvailableBookings(confirmedBookings);
    }
  }, [bookings]);

  const handleAddArtworkSuccess = () => {
    setShowAddModal(false);
    if (userData?.id) {
      fetchArtworks(userData.id);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Вы уверены, что хотите отменить это бронирование?"))
      return;
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        alert("Бронирование успешно отменено!");
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
        fetchBookings(user.id);
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Ошибка отмены бронирования:", error);
      alert("Произошла ошибка при отмене бронирования");
    }
  };

  const handleViewComment = (booking) => {
    setSelectedBookingComment({
      id: booking.id,
      comment: booking.adminComment || "Комментарий отсутствует",
      status: booking.status,
      date: booking.bookingDate,
      updatedAt: booking.updatedAt || booking.bookingDate,
    });
    setShowCommentModal(true);
  };

  const handlePublishArtwork = async (artworkId) => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(
        `${API_BASE_URL}/artworks/${artworkId}/publish`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        alert("Картина опубликована!");
        fetchArtworks(userData.id);
      }
    } catch (error) {
      console.error("Ошибка публикации:", error);
    }
  };

  const handleDraftArtwork = async (artworkId) => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(
        `${API_BASE_URL}/artworks/${artworkId}/draft`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        alert("Картина переведена в черновик");
        fetchArtworks(userData.id);
      }
    } catch (error) {
      console.error("Ошибка:", error);
    }
  };

  const handleDeleteArtwork = async (artworkId) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту картину?")) return;
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/artworks/${artworkId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        alert("Картина удалена!");
        fetchArtworks(userData.id);
      }
    } catch (error) {
      console.error("Ошибка удаления:", error);
    }
  };

  const handleEditArtwork = (artwork) => {
    const formData = {
      bookingId: artwork.booking?.id || "",
      title: artwork.title || "",
      description: artwork.description || "",
      creationYear: artwork.creationYear || new Date().getFullYear(),
      technique: artwork.technique || "",
      imageUrl: artwork.imageUrl || "",
      status: artwork.status || "DRAFT",
    };
    setEditingArtwork({ id: artwork.id, ...formData });
    setIsEditMode(true);
    setShowAddModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "artist-status-badge artist-confirmed";
      case "PENDING":
        return "artist-status-badge artist-pending";
      case "CANCELLED":
        return "artist-status-badge artist-cancelled";
      default:
        return "artist-status-badge";
    }
  };

  const getArtworkStatusBadgeClass = (status) => {
    switch (status) {
      case "PUBLISHED":
        return "artist-status-badge artist-published";
      case "DRAFT":
        return "artist-status-badge artist-draft";
      default:
        return "artist-status-badge";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading.profile) {
    return (
      <div className="artist-dashboard-loading">
        <div className="artist-spinner"></div>
        <p>Загрузка личного кабинета...</p>
      </div>
    );
  }

  return (
    <div className="artist-dashboard">
      {/* Шапка профиля */}
      <div className="artist-dashboard-header">
        <div className="artist-profile-card">
          <div className="artist-profile-avatar">
            {userData?.avatarUrl ? (
              <img
                src={userData.avatarUrl}
                alt="Аватар"
                className="artist-avatar-image"
              />
            ) : (
              <div className="artist-avatar-placeholder">
                <i className="fas fa-palette"></i>
              </div>
            )}
          </div>
          <div className="artist-profile-info">
            <h1 className="artist-profile-name">{userData?.fullName || "Художник"}</h1>
            <div className="artist-profile-details">
              <div className="artist-detail-item">
                <i className="fas fa-envelope"></i>
                <span>{userData?.email || "Email не указан"}</span>
              </div>
              {userData?.phoneNumber && (
                <div className="artist-detail-item">
                  <i className="fas fa-phone"></i>
                  <span>{userData.phoneNumber}</span>
                </div>
              )}
              <div className="artist-detail-item">
                <i className="fas fa-user-tag"></i>
                <span className="artist-role-badge artist-role-artist">Художник</span>
              </div>
            </div>
            {userData?.bio && <p className="artist-profile-bio">{userData.bio}</p>}
          </div>
        </div>
      </div>

      {/* Навигация по вкладкам */}
      <div className="artist-dashboard-tabs">
        <button
          className={`artist-tab-btn ${activeTab === "bookings" ? "artist-active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          <i className="fas fa-calendar-check"></i>
          Мои бронирования
          <span className="artist-tab-badge">{bookings.length}</span>
        </button>
        <button
          className={`artist-tab-btn ${activeTab === "artworks" ? "artist-active" : ""}`}
          onClick={() => setActiveTab("artworks")}
        >
          <i className="fas fa-paint-brush"></i>
          Мои картины
          <span className="artist-tab-badge">{artworks.length}</span>
        </button>
        <button
          className={`artist-tab-btn ${activeTab === "exhibitions" ? "artist-active" : ""}`}
          onClick={() => setActiveTab("exhibitions")}
        >
          <i className="fas fa-calendar"></i>
          Все выставки
          <span className="artist-tab-badge">{exhibitions.length}</span>
        </button>
      </div>

      {error && (
        <div className="artist-error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      <div className="artist-dashboard-content">
        {activeTab === "bookings" && (
          <div className="artist-bookings-section">
            <div className="artist-section-header">
              <h2>
                Мои бронирования
              </h2>

              <button
                className="artist-btn artist-btn-primary artist-btn-sm"
                onClick={() => setActiveTab("exhibitions")}
                style={{
                  marginLeft: "15px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >

                Перейти к бронированию
              </button>
            </div>

            {loading.bookings ? (
              <div className="artist-loading-placeholder">
                Загрузка бронирований...
              </div>
            ) : bookings.length === 0 ? (
              <div className="artist-empty-state">
                <i className="fas fa-calendar-times"></i>
                <p>У вас пока нет бронирований</p>
              </div>
            ) : (
              <div className="artist-bookings-table-container">
                <table className="artist-bookings-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Статус</th>
                      <th>Дата</th>
                      <th>Галерея</th>
                      <th>Мероприятие</th>
                      <th>Стенд</th>
                      <th>Размер</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => {
                      const gallery =
                        booking.exhibitionStand?.exhibitionHallMap
                          ?.exhibitionEvent?.gallery;
                      const event =
                        booking.exhibitionStand?.exhibitionHallMap
                          ?.exhibitionEvent;
                      const stand = booking.exhibitionStand;
                      return (
                        <tr key={booking.id}>
                          <td>#{booking.id}</td>
                          <td>
                            <span
                              className={getStatusBadgeClass(booking.status)}
                            >
                              {booking.status || "Нет статуса"}
                            </span>
                          </td>
                          <td>{formatDate(booking.bookingDate)}</td>
                          <td>{gallery?.name || "—"}</td>
                          <td>{event?.title || "—"}</td>
                          <td>{stand?.standNumber || "—"}</td>
                          <td>
                            {stand?.width && stand?.height
                              ? `${stand.width}×${stand.height} см`
                              : "—"}
                          </td>
                          <td>
                            <div className="artist-table-actions">
                              {(booking.status === "PENDING" ||
                                booking.status === "CONFIRMED") && (
                                  <button
                                    className="artist-btn artist-btn-danger artist-btn-sm"
                                    onClick={() =>
                                      handleCancelBooking(booking.id)
                                    }
                                    title="Отменить"
                                    style={{ marginLeft: "5px" }}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                )}
                              {booking.status === "CANCELLED" && (
                                <span
                                  className="artist-cancelled-text"
                                  style={{ color: "#dc3545", fontSize: "12px" }}
                                >
                                  Отменено
                                </span>
                              )}
                            </div>
                            <button
                              className="artist-btn artist-btn-info artist-btn-sm"
                              onClick={() => handleViewComment(booking)}
                              title="Просмотреть комментарий"
                              style={{ marginLeft: "5px" }}
                            >
                              <i className="fas fa-comment-alt"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "artworks" && (
          <div className="artist-artworks-section">
            <div className="artist-section-header">
              <h2>
                Мои картины
              </h2>
              <button
                className="artist-btn artist-btn-primary artist-btn-sm"
                onClick={() => setShowAddModal(true)}
              >
                Добавить новую картину
              </button>
            </div>

            {loading.artworks ? (
              <div className="artist-loading-placeholder">Загрузка картин...</div>
            ) : artworks.length === 0 ? (
              <div className="artist-empty-state">
                <i className="fas fa-palette"></i>
                <p>У вас пока нет картин</p>
                <button
                  className="artist-btn artist-btn-outline"
                  onClick={() => setShowAddModal(true)}
                >
                  Добавить первую картину
                </button>
              </div>
            ) : (
              <div className="artist-artworks-grid">
                {artworks.map((artwork) => (
                  <div key={artwork.id} className="artist-artwork-card">
                    <div className="artist-artwork-image">
                      {artwork.imageUrl ? (
                        <img src={artwork.imageUrl} alt={artwork.title} />
                      ) : (
                        <div className="artist-image-placeholder">
                          <i className="fas fa-image"></i>
                          <span>Нет изображения</span>
                        </div>
                      )}
                    </div>
                    <div className="artist-artwork-content">
                      <div className="artist-artwork-header">
                        <h3>{artwork.title || "Без названия"}</h3>
                        <span
                          className={getArtworkStatusBadgeClass(artwork.status)}
                        >
                          {artwork.status === "PUBLISHED" && "Опубликовано"}
                          {artwork.status === "DRAFT" && "Черновик"}
                        </span>
                      </div>
                      <div className="artist-artwork-details">
                        {artwork.description && (
                          <p className="artist-artwork-description">
                            {artwork.description.length > 100
                              ? `${artwork.description.substring(0, 100)}...`
                              : artwork.description}
                          </p>
                        )}
                        <div className="artist-detail-grid">
                          {artwork.technique && (
                            <div className="artist-detail-item">
                              <b>Техника:</b>
                              <span>{artwork.technique}</span>
                            </div>
                          )}
                          {artwork.year && (
                            <div className="artist-detail-item">
                              <i className="fas fa-calendar"></i>
                              <span>{artwork.year} год</span>
                            </div>
                          )}
                          {artwork.dimensions && (
                            <div className="artist-detail-item">
                              <i className="fas fa-expand-alt"></i>
                              <span>{artwork.dimensions}</span>
                            </div>
                          )}
                          {artwork.price && (
                            <div className="artist-detail-item">
                              <i className="fas fa-tag"></i>
                              <span>{artwork.price} руб.</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="artist-artwork-actions">
                        <button
                          className="artist-btn artist-btn-outline artist-btn-sm"
                          onClick={() => handleEditArtwork(artwork)}
                        >
                          <i className="fas fa-edit"></i> Редактировать
                        </button>
                        {artwork.status === "DRAFT" ? (
                          <button
                            className="artist-btn artist-btn-success artist-btn-sm"
                            onClick={() => handlePublishArtwork(artwork.id)}
                          >
                            <i className="fas fa-upload"></i> Опубликовать
                          </button>
                        ) : (
                          <button
                            className="artist-btn artist-btn-warning artist-btn-sm"
                            onClick={() => handleDraftArtwork(artwork.id)}
                          >
                            <i className="fas fa-save"></i> В черновик
                          </button>
                        )}
                        <button
                          className="artist-btn artist-btn-danger artist-btn-sm"
                          onClick={() => handleDeleteArtwork(artwork.id)}
                        >
                          <i className="fas fa-trash"></i> Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "exhibitions" && (
          <div className="artist-exhibitions-section">
            <div className="artist-section-header">
              <h2>
                Все выставки
              </h2>
            </div>

            {loading.exhibitions ? (
              <div className="artist-loading-placeholder">Загрузка выставок...</div>
            ) : exhibitions.length === 0 ? (
              <div className="artist-empty-state">
                <i className="fas fa-calendar-times"></i>
                <p>Нет доступных выставок</p>
              </div>
            ) : (
              <div className="artist-exhibitions-list">
                {exhibitions.map((event) => (
                  <div key={event.id} className="artist-exhibition-item">
                    <div className="artist-exhibition-info">
                      <h3>{event.title || "Без названия"}</h3>
                      <p>
                        <strong>Галерея:</strong> {event.gallery?.name || "—"}
                      </p>
                      <p>
                        <strong>Даты:</strong> {formatDate(event.startDate)} –{" "}
                        {formatDate(event.endDate)}
                      </p>
                      {event.location && (
                        <p>
                          <strong>Место:</strong> {event.location}
                        </p>
                      )}
                    </div>
                    <button
                      className="artist-btn artist-btn-primary artist-btn-sm"
                      onClick={() => navigate(`/map/${event.id}`)}
                    >
                      Перейти к
                      бронированию
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="artist-dashboard-stats">
        <div className="artist-stat-card">
          <div className="artist-stat-icon artist-booking">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="artist-stat-content">
            <h3>{bookings.length}</h3>
            <p>Бронирований</p>
          </div>
        </div>
        <div className="artist-stat-card">
          <div className="artist-stat-icon artist-artwork">
            <i className="fas fa-paint-brush"></i>
          </div>
          <div className="artist-stat-content">
            <h3>{artworks.length}</h3>
            <p>Картин</p>
          </div>
        </div>
        <div className="artist-stat-card">
          <div className="artist-stat-icon artist-confirmed">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="artist-stat-content">
            <h3>{bookings.filter((b) => b.status === "CONFIRMED").length}</h3>
            <p>Подтверждено</p>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddArtworkModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setIsEditMode(false);
            setEditingArtwork(null);
          }}
          onSuccess={handleAddArtworkSuccess}
          bookings={availableBookings}
          artistId={userData?.id}
          editData={editingArtwork}
          isEditMode={isEditMode}
        />
      )}

      {showCommentModal && selectedBookingComment && (
        <div className="artist-modal-overlay">
          <div className="artist-modal artist-comment-modal">
            <div className="artist-modal-header">
              <h3>Комментарий к бронированию #{selectedBookingComment.id}</h3>
              <button
                className="artist-modal-close"
                onClick={() => setShowCommentModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="artist-modal-body">
              <div className="artist-comment-status">
                <span className={getStatusBadgeClass(selectedBookingComment.status)}>
                  {selectedBookingComment.status}
                </span>
                <span className="artist-comment-date">
                  Обновлено: {selectedBookingComment.updatedAt}
                </span>
              </div>
              <div className="artist-comment-content">
                {selectedBookingComment.comment}
              </div>
            </div>
            <div className="artist-modal-footer">
              <button
                className="artist-btn artist-btn-secondary"
                onClick={() => setShowCommentModal(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistDashboard;