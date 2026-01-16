import React, { useState, useEffect } from "react";
import ExhibitionCard from "./ExhibitionCard";
import "./ExhibitionsSection.css";
import { Link } from "react-router-dom";

const ExhibitionsSection = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(6);

  const API_BASE_URL = "http://localhost:8080";

  const filters = [
    { id: "all", label: " Все" },
    { id: "current", label: " Идут сейчас" },
    { id: "upcoming", label: " Скоро" },
    { id: "past", label: " Прошедшие" },
  ];

  const getAuthToken = () => {
    return (
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("auth_token")
    );
  };

  useEffect(() => {
    fetchExhibitions();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, activeFilter]);

  const filterEvents = () => {
    if (!Array.isArray(events) || events.length === 0) {
      setFilteredEvents([]);
      return;
    }

    const now = new Date();
    let filtered = [...events];

    switch (activeFilter) {
      case "current":
        filtered = events.filter((event) => {
          try {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            return start <= now && end >= now;
          } catch {
            return false;
          }
        });
        break;
      case "upcoming":
        filtered = events.filter((event) => {
          try {
            const start = new Date(event.startDate);
            return start > now;
          } catch {
            return false;
          }
        });
        break;
      case "past":
        filtered = events.filter((event) => {
          try {
            const end = new Date(event.endDate);
            return end < now;
          } catch {
            return false;
          }
        });
        break;
      case "all":
      default:
        break;
    }

    filtered.sort((a, b) => {
      try {
        const now = new Date();
        const aStart = new Date(a.startDate);
        const aEnd = new Date(a.endDate);
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);

        const getPriority = (start, end) => {
          if (start <= now && end >= now) return 1;
          if (start > now) return 2;
          return 3;
        };

        const aPriority = getPriority(aStart, aEnd);
        const bPriority = getPriority(bStart, bEnd);

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        return aStart - bStart;
      } catch {
        return 0;
      }
    });

    setFilteredEvents(filtered);
    setVisibleCount(6);
  };

  const getEventStatus = (event) => {
    try {
      const now = new Date();
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      if (startDate > now) return "upcoming";
      if (endDate < now) return "past";
      if (startDate <= now && endDate >= now) return "current";
      return "unknown";
    } catch {
      return "unknown";
    }
  };

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/exhibition-events`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 204) {
          setEvents([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error("Ошибка при загрузке выставок:", err);
      setError("Не удалось загрузить выставки. Пожалуйста, попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  const getFilterCount = (filterId) => {
    if (!Array.isArray(events) || events.length === 0) return 0;

    const now = new Date();

    switch (filterId) {
      case "current":
        return events.filter((event) => {
          try {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            return start <= now && end >= now;
          } catch {
            return false;
          }
        }).length;

      case "upcoming":
        return events.filter((event) => {
          try {
            const start = new Date(event.startDate);
            return start > now;
          } catch {
            return false;
          }
        }).length;

      case "past":
        return events.filter((event) => {
          try {
            const end = new Date(event.endDate);
            return end < now;
          } catch {
            return false;
          }
        }).length;

      case "all":
      default:
        return events.length;
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 6, filteredEvents.length));
  };

  const handleShowAll = () => {
    setVisibleCount(filteredEvents.length);
  };

  const handleCollapse = () => {
    setVisibleCount(6);
    const section = document.getElementById("exhibitions");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleRetry = () => {
    fetchExhibitions();
  };

  const displayedEvents = filteredEvents.slice(0, visibleCount);
  const hasMoreEvents = visibleCount < filteredEvents.length;
  const allEventsShown =
    visibleCount >= filteredEvents.length && filteredEvents.length > 6;

  if (loading) {
    return (
      <section id="exhibitions" className="section exhibitions-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Текущие выставки</h2>
            {/* <Link to="/exhibition-events" className="section-link">
              Все выставки <i className="fas fa-arrow-right"></i>
            </Link> */}
          </div>
          <div className="loading-state">
            <div className="spinner">
              <i className="fas fa-palette fa-spin"></i>
            </div>
            <p>Загружаем выставки...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="exhibitions" className="section exhibitions-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Текущие выставки</h2>
            {/* <Link to="/exhibition-events" className="section-link">
              Все выставки <i className="fas fa-arrow-right"></i>
            </Link> */}
          </div>
          <div className="error-state">
            <i className="fas fa-exclamation-triangle"></i>
            <h3>Ошибка загрузки</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={handleRetry}>
              <i className="fas fa-redo"></i>
              Попробовать снова
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!Array.isArray(events) || events.length === 0) {
    return (
      <section id="exhibitions" className="section exhibitions-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Текущие выставки</h2>
            {/* <Link to="/exhibition-events" className="section-link">
              Все выставки <i className="fas fa-arrow-right"></i>
            </Link> */}
          </div>
          <div className="no-results">
            <i className="fas fa-calendar-times"></i>
            <h3>Выставок пока нет</h3>
            <p>Скоро здесь появятся интересные выставки</p>
            <button className="btn btn-primary" onClick={handleRetry}>
              <i className="fas fa-redo"></i>
              Обновить
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="exhibitions" className="section exhibitions-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Текущие выставки</h2>
          {/* <Link to="/exhibition-events" className="section-link">
            Все выставки <i className="fas fa-arrow-right"></i>
          </Link> */}
        </div>

        <div className="exhibitions-filters">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`filter-btn ${
                activeFilter === filter.id ? "active" : ""
              }`}
              onClick={() => setActiveFilter(filter.id)}
              title={filter.label}
            >
              <i className={filter.icon}></i>
              <span className="filter-label">{filter.label}</span>
              <span className="filter-count">
                ({getFilterCount(filter.id)})
              </span>
            </button>
          ))}
        </div>

        {/* {activeFilter !== "all" && filteredEvents.length > 0 && (
          <div className="filter-status">
            <div className="active-filter-info">
              <i className="fas fa-filter"></i>
              <span>
                Показаны <strong>{filteredEvents.length}</strong> выставок в
                категории "{filters.find((f) => f.id === activeFilter)?.label}"
              </span>
            </div>
          </div>
        )} */}

        {displayedEvents.length > 0 ? (
          <>
            <div className="exhibitions-grid">
              {displayedEvents.map((event) => (
                <ExhibitionCard
                  key={event.id}
                  event={event}
                  status={getEventStatus(event)}
                />
              ))}
            </div>

            <div className="pagination-section">
              {/* <div className="pagination-info">
                <p>
                  Показано <strong>{displayedEvents.length}</strong> из{" "}
                  <strong>{filteredEvents.length}</strong> выставок
                  {activeFilter !== "all" && ` (всего: ${events.length})`}
                </p>
              </div> */}

              {hasMoreEvents && (
                <div className="load-more-container">
                  <button
                    className="btn btn-outline load-more-btn"
                    onClick={handleLoadMore}
                  >
                    <i className="fas fa-plus"></i>
                    Показать еще{" "}
                    {Math.min(6, filteredEvents.length - visibleCount)}
                  </button>
                  <button
                    className="btn btn-outline show-all-btn"
                    onClick={handleShowAll}
                  >
                    <i className="fas fa-eye"></i>
                    Показать все {filteredEvents.length}
                  </button>
                </div>
              )}

              {allEventsShown && (
                <div className="all-shown-container">
                  {/* <div className="all-shown-info">
                    <i className="fas fa-check-circle"></i>
                    <span>Показаны все {filteredEvents.length} выставок</span>
                  </div> */}
                  <button
                    className="btn btn-outline collapse-btn"
                    onClick={handleCollapse}
                  >
                    <i className="fas fa-chevron-up"></i>
                    Свернуть обратно
                  </button>
                </div>
              )}

              {!hasMoreEvents &&
                !allEventsShown &&
                filteredEvents.length > 6 && (
                  <div className="show-actions">
                    <button className="btn btn-outline" onClick={handleShowAll}>
                      <i className="fas fa-eye"></i>
                      Показать все {filteredEvents.length}
                    </button>
                  </div>
                )}
            </div>
          </>
        ) : (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>Ничего не найдено</h3>
            <p>
              {activeFilter === "current"
                ? "В данный момент нет идущих выставок"
                : activeFilter === "upcoming"
                ? "Нет предстоящих выставок"
                : "Нет прошедших выставок"}
            </p>
            <div className="no-results-actions">
              <button
                className="btn btn-primary"
                onClick={() => setActiveFilter("all")}
              >
                <i className="fas fa-th-large"></i>
                Показать все выставки ({events.length})
              </button>
              <Link to="/exhibition-events" className="btn btn-outline">
                <i className="fas fa-search"></i>
                Расширенный поиск
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExhibitionsSection;
