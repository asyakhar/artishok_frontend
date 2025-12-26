import './ExhibitionCard.css';

const ExhibitionCard = ({ event }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  const getDefaultGalleryImage = (galleryId) => {
    const defaultImages = {
      1: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzEuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9STI5UzUzWFpISVE1WkdQNDhJSTAlMkYyMDI1MTIyNSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTEyMjVUMTUwNDQxWiZYLUFtei1FeHBpcmVzPTQzMTk5JlgtQW16LVNlY3VyaXR5LVRva2VuPWV5SmhiR2NpT2lKSVV6VXhNaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpoWTJObGMzTkxaWGtpT2lKSk1qbFROVE5ZV2toSlVUVmFSMUEwT0VsSk1DSXNJbVY0Y0NJNk1UYzJOamN4TkRVeE15d2ljR0Z5Wlc1MElqb2liV2x1YVc5aFpHMXBiaUo5LmZGQ1hoX1BSNVVJUzZOM3FUczloWWVlQ25OcWdIQTZqMmYzSVdobWZzMEtLN1k4NkdINUM2ckNoR09abXJYQmV5OVBjbk9VN1ktdVZ4cTlGeDNnWWVRJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9Zjg4ZmUxNzFkMTNlZDc3ODAzYWRkZTk5ZWRmMzllODQ0N2M0ZTdmYzljMjFjNjRkY2RmMDFiMDVmYTcxZTAzYw",
      2: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzIuSlBHP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9STI5UzUzWFpISVE1WkdQNDhJSTAlMkYyMDI1MTIyNSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTEyMjVUMTUwNTExWiZYLUFtei1FeHBpcmVzPTQzMjAwJlgtQW16LVNlY3VyaXR5LVRva2VuPWV5SmhiR2NpT2lKSVV6VXhNaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpoWTJObGMzTkxaWGtpT2lKSk1qbFROVE5ZV2toSlVUVmFSMUEwT0VsSk1DSXNJbVY0Y0NJNk1UYzJOamN4TkRVeE15d2ljR0Z5Wlc1MElqb2liV2x1YVc5aFpHMXBiaUo5LmZGQ1hoX1BSNVVJUzZOM3FUczloWWVlQ25OcWdIQTZqMmYzSVdobWZzMEtLN1k4NkdINUM2ckNoR09abXJYQmV5OVBjbk9VN1ktdVZ4cTlGeDNnWWVRJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9OWRlMmUyYWRlZTRkY2Y2NDk2MGE5ZGJiNzI4YjdiNmExYzliNTQyMzIxNTZmYjUyMzEzZjRhZjBkMTFkYjE3Mw",
      3: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzMuYXZpZj9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUkyOVM1M1haSElRNVpHUDQ4SUkwJTJGMjAyNTEyMjUlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUxMjI1VDE1MDgyNlomWC1BbXotRXhwaXJlcz00MzIwMCZYLUFtei1TZWN1cml0eS1Ub2tlbj1leUpoYkdjaU9pSklVelV4TWlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaFkyTmxjM05MWlhraU9pSkpNamxUTlROWVdraEpVVFZhUjFBME9FbEpNQ0lzSW1WNGNDSTZNVGMyTmpjeE5EVXhNeXdpY0dGeVpXNTBJam9pYldsdWFXOWhaRzFwYmlKOS5mRkNYaF9QUjVVSVM2TjNxVHM5aFllZUNuTnFnSEE2ajJmM0lXaG1mczBLSzdZODZHSDVDNnJDaEdPWm1yWEJleTlQY25PVTdZLXVWeHE5RngzZ1llUSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmdmVyc2lvbklkPW51bGwmWC1BbXotU2lnbmF0dXJlPWJlM2ZlYWI3NTg3YTdjNTM3MmJmMjM0ODM5MDIzZGZiNDZlMzQwZmFiNjU4OGQzMzFkNmUyOGQ5MDY2ZWU4YzU",
      6: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzQuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9STI5UzUzWFpISVE1WkdQNDhJSTAlMkYyMDI1MTIyNSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTEyMjVUMTUwODUzWiZYLUFtei1FeHBpcmVzPTQzMTk5JlgtQW16LVNlY3VyaXR5LVRva2VuPWV5SmhiR2NpT2lKSVV6VXhNaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpoWTJObGMzTkxaWGtpT2lKSk1qbFROVE5ZV2toSlVUVmFSMUEwT0VsSk1DSXNJbVY0Y0NJNk1UYzJOamN4TkRVeE15d2ljR0Z5Wlc1MElqb2liV2x1YVc5aFpHMXBiaUo5LmZGQ1hoX1BSNVVJUzZOM3FUczloWWVlQ25OcWdIQTZqMmYzSVdobWZzMEtLN1k4NkdINUM2ckNoR09abXJYQmV5OVBjbk9VN1ktdVZ4cTlGeDNnWWVRJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9ZDgyYjI0YzA5NDVjMjQ0MGQxYzRiYmIwYjdkZDNjMjFlZjZhNzVmNjVjMzZjNjc3ODU2MWYyMjAzNjc0N2U1NQ",
      5: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzUuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9STI5UzUzWFpISVE1WkdQNDhJSTAlMkYyMDI1MTIyNSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTEyMjVUMTUwOTIxWiZYLUFtei1FeHBpcmVzPTQzMTk5JlgtQW16LVNlY3VyaXR5LVRva2VuPWV5SmhiR2NpT2lKSVV6VXhNaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpoWTJObGMzTkxaWGtpT2lKSk1qbFROVE5ZV2toSlVUVmFSMUEwT0VsSk1DSXNJbVY0Y0NJNk1UYzJOamN4TkRVeE15d2ljR0Z5Wlc1MElqb2liV2x1YVc5aFpHMXBiaUo5LmZGQ1hoX1BSNVVJUzZOM3FUczloWWVlQ25OcWdIQTZqMmYzSVdobWZzMEtLN1k4NkdINUM2ckNoR09abXJYQmV5OVBjbk9VN1ktdVZ4cTlGeDNnWWVRJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9ZjM4ZGNhMGE3MDM1OWMyMWM5MzgxOGQ3ZTI1YTRjZjU4YjkyZjI3MzVjZWFjNzVjMDA0NDg1OTQ3NTc4NDQ4Mg",
      4: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzYuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9STI5UzUzWFpISVE1WkdQNDhJSTAlMkYyMDI1MTIyNSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTEyMjVUMTUwOTQ2WiZYLUFtei1FeHBpcmVzPTQzMjAwJlgtQW16LVNlY3VyaXR5LVRva2VuPWV5SmhiR2NpT2lKSVV6VXhNaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpoWTJObGMzTkxaWGtpT2lKSk1qbFROVE5ZV2toSlVUVmFSMUEwT0VsSk1DSXNJbVY0Y0NJNk1UYzJOamN4TkRVeE15d2ljR0Z5Wlc1MElqb2liV2x1YVc5aFpHMXBiaUo5LmZGQ1hoX1BSNVVJUzZOM3FUczloWWVlQ25OcWdIQTZqMmYzSVdobWZzMEtLN1k4NkdINUM2ckNoR09abXJYQmV5OVBjbk9VN1ktdVZ4cTlGeDNnWWVRJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9NDg0M2FlYjNkOWNlOWIzMzQ4MjgxMzQ2ZTBkZjA2MDIwYTFiOTU0YjdlZTU0NjhlNmY4OWYyZmJkMDhhYTAxZg"
    };

    
    return defaultImages[galleryId] || defaultImages[6];
  };

  const getDefaultGalleryStatus = (galleryId) => {
    const defaultStatus = {
      1: "Современное искусство",
      2: "Аванградное направление",
      3: "Классические произведения",
      4: "Новое течение",
      5: "Сезонная выставка",
      6: ""
    };

    
    return defaultStatus[galleryId] || defaultStatus[6];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'current':
        return { bg: '#10b981', text: 'Сейчас идёт' };
      case 'upcoming':
        return { bg: '#3b82f6', text: 'Скоро' };
      case 'featured':
        return { bg: '#f59e0b', text: 'Рекомендуем' };
      default:
        return { bg: '#6b7280', text: 'Завершена' };
    }
  };

  const status = getStatusColor('current');

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
          {event.description || "Краткое описание выставки современного искусства, которое рассказывает о концепции, художниках и особенностях экспозиции."}
        </p>

        <div className="card-details">
          <div className="detail-item">
            <div className="detail-icon">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="detail-content">
              <span className="detail-label">Дата начала</span>
              <span className="detail-value">{event.startDate ? formatDate(event.startDate) : "Дата не указана"}</span>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon">
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <div className="detail-content">
              <span className="detail-label">Место</span>
              <span className="detail-value">{event.gallery?.address || "Галерея АРТиШОК"}</span>
            </div>
          </div>




        </div>
      </div>




    </div>
  );
};

export default ExhibitionCard;