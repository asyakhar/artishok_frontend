import "./ExhibitionCard.css";

const ExhibitionCard = ({ event }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  const getDefaultGalleryImage = (galleryId) => {
    const defaultImages = {
      // 0 - фото выставки не загружено

      0: "http://192.168.0.101:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uL3Bob3RvXzIwMjYtMDEtMTUlMjAyMy4wMS4xMC5qcGVnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9T1lSOThJWlNZRVpUV0pPN1RKVEMlMkYyMDI2MDExNSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNjAxMTVUMjAwMzAyWiZYLUFtei1FeHBpcmVzPTQzMTk5JlgtQW16LVNlY3VyaXR5LVRva2VuPWV5SmhiR2NpT2lKSVV6VXhNaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpoWTJObGMzTkxaWGtpT2lKUFdWSTVPRWxhVTFsRldsUlhTazgzVkVwVVF5SXNJbVY0Y0NJNk1UYzJPRFUxTURVMU1pd2ljR0Z5Wlc1MElqb2liV2x1YVc5aFpHMXBiaUo5LkdxUE5XendjRFdoYkxTeVMwbEh0LVJDbks1U3NsandpQkFLbVJrTWFsQ3JRUFg3MDFlbUtTaEItZDNaSFhyWURUaDNNNXRyRXRxTV9GSi16WVZlbWZnJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9ZDAwZGI3MzUyNGRlNWZiYjU3YmFiMDU5NzFkYzc4MjM5M2ZiNWJiNGY4NWE1MzA4MGFjNTBmNTBjNjhmN2YzNA",
      10: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzAyNTVhNDM4ZmM3YzIwY2UxYmEyMmI4YjdjMWQzY2EwLmpwZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUw0TjZWTFJYRlpUVFRCSFpRSUpJJTJGMjAyNjAxMTUlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMTE1VDE0MjMwN1omWC1BbXotRXhwaXJlcz00MzIwMCZYLUFtei1TZWN1cml0eS1Ub2tlbj1leUpoYkdjaU9pSklVelV4TWlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaFkyTmxjM05MWlhraU9pSk1ORTQyVmt4U1dFWmFWRlJVUWtoYVVVbEtTU0lzSW1WNGNDSTZNVGMyT0RVeU9UazFNeXdpY0dGeVpXNTBJam9pYldsdWFXOWhaRzFwYmlKOS5GSFVpYTctY1MtT1ZSOGJjcUdpY3F4OUR0XzNOLVNXXzNYdVZydVduWE1SUWUxcFRITjBsMzkwUGIyY1I2M2VPZlJMdEZ4aVJMS3l1SFZORUplY1FhQSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmdmVyc2lvbklkPW51bGwmWC1BbXotU2lnbmF0dXJlPTJmMTQ5ZTk3MmE0ZWVmOWZiNjdjNWRmMzU0MDRkNWZkMzViZjgyYzAyZWQxYWViZmRiMmU1ODZiNGQ3N2NhMmU",
      6: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzYwMV9pbWFnZV9tYWluLmpwZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUw0TjZWTFJYRlpUVFRCSFpRSUpJJTJGMjAyNjAxMTUlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMTE1VDE0MjM0NFomWC1BbXotRXhwaXJlcz00MzIwMCZYLUFtei1TZWN1cml0eS1Ub2tlbj1leUpoYkdjaU9pSklVelV4TWlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaFkyTmxjM05MWlhraU9pSk1ORTQyVmt4U1dFWmFWRlJVUWtoYVVVbEtTU0lzSW1WNGNDSTZNVGMyT0RVeU9UazFNeXdpY0dGeVpXNTBJam9pYldsdWFXOWhaRzFwYmlKOS5GSFVpYTctY1MtT1ZSOGJjcUdpY3F4OUR0XzNOLVNXXzNYdVZydVduWE1SUWUxcFRITjBsMzkwUGIyY1I2M2VPZlJMdEZ4aVJMS3l1SFZORUplY1FhQSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmdmVyc2lvbklkPW51bGwmWC1BbXotU2lnbmF0dXJlPTI3MDA2N2JlODI1MGU5NGVmZjAzM2UwNTJkZmUzNGY5ZWQ3NDFkOGM0OGU4YjhkNmVjMjdmYmZkNTliMGI5ODQ",
      7: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzY4NDc4YWEyZGY5MmRkODFkZDYxMTNlODljZjMwNWViLmpwZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUw0TjZWTFJYRlpUVFRCSFpRSUpJJTJGMjAyNjAxMTUlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMTE1VDE0MjQxMVomWC1BbXotRXhwaXJlcz00MzIwMCZYLUFtei1TZWN1cml0eS1Ub2tlbj1leUpoYkdjaU9pSklVelV4TWlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaFkyTmxjM05MWlhraU9pSk1ORTQyVmt4U1dFWmFWRlJVUWtoYVVVbEtTU0lzSW1WNGNDSTZNVGMyT0RVeU9UazFNeXdpY0dGeVpXNTBJam9pYldsdWFXOWhaRzFwYmlKOS5GSFVpYTctY1MtT1ZSOGJjcUdpY3F4OUR0XzNOLVNXXzNYdVZydVduWE1SUWUxcFRITjBsMzkwUGIyY1I2M2VPZlJMdEZ4aVJMS3l1SFZORUplY1FhQSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmdmVyc2lvbklkPW51bGwmWC1BbXotU2lnbmF0dXJlPTUxZGYxMGEwMjVlYzMyMTg1NGQ4NjU1YWI2ZTkyMTU3NGZmNjUyY2UwMTgwOTAwYjg5Y2ViZWVkYTg4YjIxYjk",
      9: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uL2ltZ183MTY2LmpwZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUw0TjZWTFJYRlpUVFRCSFpRSUpJJTJGMjAyNjAxMTUlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMTE1VDE0MjQzMlomWC1BbXotRXhwaXJlcz00MzIwMCZYLUFtei1TZWN1cml0eS1Ub2tlbj1leUpoYkdjaU9pSklVelV4TWlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaFkyTmxjM05MWlhraU9pSk1ORTQyVmt4U1dFWmFWRlJVUWtoYVVVbEtTU0lzSW1WNGNDSTZNVGMyT0RVeU9UazFNeXdpY0dGeVpXNTBJam9pYldsdWFXOWhaRzFwYmlKOS5GSFVpYTctY1MtT1ZSOGJjcUdpY3F4OUR0XzNOLVNXXzNYdVZydVduWE1SUWUxcFRITjBsMzkwUGIyY1I2M2VPZlJMdEZ4aVJMS3l1SFZORUplY1FhQSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmdmVyc2lvbklkPW51bGwmWC1BbXotU2lnbmF0dXJlPWM2ZTlmMWM3NjA1ZmIzNDRlMmEyMzU0NGUxMzk1NzJlNDNlMmViNjUzOGM2NDI0NzFmNzI0OWRkMGMzODllZmI",
      11: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uL3dvbWFuLWFydC1leGhpYml0aW9uXzUzODc2LTE0Mzc5LmpwZy5hdmlmP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9TDRONlZMUlhGWlRUVEJIWlFJSkklMkYyMDI2MDExNSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNjAxMTVUMTQyNDUxWiZYLUFtei1FeHBpcmVzPTQzMjAwJlgtQW16LVNlY3VyaXR5LVRva2VuPWV5SmhiR2NpT2lKSVV6VXhNaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpoWTJObGMzTkxaWGtpT2lKTU5FNDJWa3hTV0VaYVZGUlVRa2hhVVVsS1NTSXNJbVY0Y0NJNk1UYzJPRFV5T1RrMU15d2ljR0Z5Wlc1MElqb2liV2x1YVc5aFpHMXBiaUo5LkZIVWlhNy1jUy1PVlI4YmNxR2ljcXg5RHRfM04tU1dfM1h1VnJ1V25YTVJRZTFwVEhOMGwzOTBQYjJjUjYzZU9mUkx0RnhpUkxLeXVIVk5FSmVjUWFBJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9YmNmN2YzMTEwNjQyNzE5ZWYzOGM5MmJkNTUxMjcyNmYxMWZkMjBmMjZkZmU0M2NlNTgyMjhkOGFiODM5N2E1ZQ",
      19: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzI5N2I3MjRiN2I4Y2YzMGY4MGZiMGZlY2M4ODcxNGVlLmpwZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUw0TjZWTFJYRlpUVFRCSFpRSUpJJTJGMjAyNjAxMTUlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMTE1VDE0MjU1OVomWC1BbXotRXhwaXJlcz00MzIwMCZYLUFtei1TZWN1cml0eS1Ub2tlbj1leUpoYkdjaU9pSklVelV4TWlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaFkyTmxjM05MWlhraU9pSk1ORTQyVmt4U1dFWmFWRlJVUWtoYVVVbEtTU0lzSW1WNGNDSTZNVGMyT0RVeU9UazFNeXdpY0dGeVpXNTBJam9pYldsdWFXOWhaRzFwYmlKOS5GSFVpYTctY1MtT1ZSOGJjcUdpY3F4OUR0XzNOLVNXXzNYdVZydVduWE1SUWUxcFRITjBsMzkwUGIyY1I2M2VPZlJMdEZ4aVJMS3l1SFZORUplY1FhQSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmdmVyc2lvbklkPW51bGwmWC1BbXotU2lnbmF0dXJlPWY2ODYyOWE4MjBiMGE5MTQyODE5MDE1MDAwNDQ3OWU4YzIxNTBmNjMyM2M1NjBkYWU1N2MxMjI2YjBmY2RhNjQ",
    };

    return defaultImages[galleryId] || defaultImages[0];
  };

  const getDefaultGalleryStatus = (galleryId) => {
    const defaultStatus = {
      1: "Современное искусство",
      2: "Аванградное направление",
      3: "Классические произведения",
      4: "Новое течение",
      5: "Сезонная выставка",
      6: "",
    };

    return defaultStatus[galleryId] || defaultStatus[6];
  };

  // const getStatusColor = (status) => {
  //   switch (status) {
  //     case "current":
  //       return { bg: "#10b981", text: "Сейчас идёт" };
  //     case "upcoming":
  //       return { bg: "#3b82f6", text: "Скоро" };
  //     case "featured":
  //       return { bg: "#f59e0b", text: "Рекомендуем" };
  //     default:
  //       return { bg: "#6b7280", text: "Завершена" };
  //   }
  // };

  // const status = getStatusColor("current");

  return (
    <div className="exhibition-card">
      <div className="card-header">
        <div className="card-image">
          <img
            src={event.image || getDefaultGalleryImage(event.id)}
            alt={event.title}
            loading="lazy"
          />
          <div className="card-overlay"></div>
          <span className="card-status" style={{ backgroundColor: status.bg }}>
            {status.text}
          </span>
        </div>

        <div className="card-category">
          <i className="fas fa-paint-brush"></i>
          <span>{event.category || getDefaultGalleryStatus(event.id)}</span>
        </div>
      </div>

      <div className="card-body">
        <div className="card-title-section">
          <h3 className="card-title">{event.title || "Название выставки"}</h3>
        </div>

        <p className="card-description">
          {event.description ||
            "Краткое описание выставки современного искусства, которое рассказывает о концепции, художниках и особенностях экспозиции."}
        </p>

        <div className="card-details">
          <div className="detail-item">
            <div className="detail-icon">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="detail-content">
              <span className="detail-label">Дата начала</span>
              <span className="detail-value">
                {event.startDate
                  ? formatDate(event.startDate)
                  : "Дата не указана"}
              </span>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon">
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <div className="detail-content">
              <span className="detail-label">Место</span>
              <span className="detail-value">
                {event.gallery?.address || "Галерея АРТиШОК"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExhibitionCard;
