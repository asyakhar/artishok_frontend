import "./GalleryCard.css";

const GalleryCard = ({ gallery }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "var(--status-approved, #10b981)";
      case "PENDING":
        return "var(--status-pending, #f59e0b)";
      case "REJECTED":
        return "var(--status-rejected, #ef4444)";
      default:
        return "var(--status-default, #6b7280)";
    }
  };

  // const getStatusText = (status) => {
  //   switch (status) {
  //     case 'APPROVED': return 'Одобрена';
  //     case 'PENDING': return 'На рассмотрении';
  //     case 'REJECTED': return 'Отклонена';
  //     default: return status;
  //   }
  // };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    return phone.replace(
      /^(\+\d)(\d{3})(\d{3})(\d{2})(\d{2})$/,
      "$1 ($2) $3-$4-$5"
    );
  };

  const getDefaultGalleryImage = (galleryId) => {
    const defaultImages = {
      1: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzEuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9N0dJVVNKWTZOWkhJVzQ3N1RVNlglMkYyMDI2MDExNiUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNjAxMTZUMDcyNTExWiZYLUFtei1FeHBpcmVzPTQzMTk5JlgtQW16LVNlY3VyaXR5LVRva2VuPWV5SmhiR2NpT2lKSVV6VXhNaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpoWTJObGMzTkxaWGtpT2lJM1IwbFZVMHBaTms1YVNFbFhORGMzVkZVMldDSXNJbVY0Y0NJNk1UYzJPRFU1TVRVd01pd2ljR0Z5Wlc1MElqb2liV2x1YVc5aFpHMXBiaUo5LlRINTE5TlRYdEVlY1RvRmtMV2RSdlljZ2RKZDh1cmdLWS1sekx6djNHR1E3UzluVzJiNHo3aEotUEoxUDNUcW04aXYxZ04zUEZLRC1xMHNTQkM0VEZnJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9NTg3ZmI3NDFiNTBiYWZmZDJiNDEwZjAxNTEzZjc4ZmNmOTE5MmU1YzBkMjk5ODAxMDdiZTRiOTZkMzdjY2U0ZA",
      2: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLyVEMCVCRCVEMCVCNSVEMSU4Ml8lRDElODQlRDAlQkUlRDElODIlRDAlQkUuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9N0dJVVNKWTZOWkhJVzQ3N1RVNlglMkYyMDI2MDExNiUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNjAxMTZUMDcyNzA5WiZYLUFtei1FeHBpcmVzPTQzMjAwJlgtQW16LVNlY3VyaXR5LVRva2VuPWV5SmhiR2NpT2lKSVV6VXhNaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpoWTJObGMzTkxaWGtpT2lJM1IwbFZVMHBaTms1YVNFbFhORGMzVkZVMldDSXNJbVY0Y0NJNk1UYzJPRFU1TVRVd01pd2ljR0Z5Wlc1MElqb2liV2x1YVc5aFpHMXBiaUo5LlRINTE5TlRYdEVlY1RvRmtMV2RSdlljZ2RKZDh1cmdLWS1sekx6djNHR1E3UzluVzJiNHo3aEotUEoxUDNUcW04aXYxZ04zUEZLRC1xMHNTQkM0VEZnJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9MjVhN2VlMmFkN2MyZDYxZjVhMDI2NzE1MTk2ODkxMTVhYzNlMTU2MmU5NjA3YTBhZGIyYmU5YWQxYjk5MGFmNg",
      4: "http://127.0.0.1:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLyVEMCVCRCVEMCVCNSVEMSU4Ml8lRDElODQlRDAlQkUlRDElODIlRDAlQkUuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9N0dJVVNKWTZOWkhJVzQ3N1RVNlglMkYyMDI2MDExNiUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNjAxMTZUMDcyNzA5WiZYLUFtei1FeHBpcmVzPTQzMjAwJlgtQW16LVNlY3VyaXR5LVRva2VuPWV5SmhiR2NpT2lKSVV6VXhNaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpoWTJObGMzTkxaWGtpT2lJM1IwbFZVMHBaTms1YVNFbFhORGMzVkZVMldDSXNJbVY0Y0NJNk1UYzJPRFU1TVRVd01pd2ljR0Z5Wlc1MElqb2liV2x1YVc5aFpHMXBiaUo5LlRINTE5TlRYdEVlY1RvRmtMV2RSdlljZ2RKZDh1cmdLWS1sekx6djNHR1E3UzluVzJiNHo3aEotUEoxUDNUcW04aXYxZ04zUEZLRC1xMHNTQkM0VEZnJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9MjVhN2VlMmFkN2MyZDYxZjVhMDI2NzE1MTk2ODkxMTVhYzNlMTU2MmU5NjA3YTBhZGIyYmU5YWQxYjk5MGFmNg",
      5: "http://192.168.0.101:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzI5N2I3MjRiN2I4Y2YzMGY4MGZiMGZlY2M4ODcxNGVlLmpwZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPU9ZUjk4SVpTWUVaVFdKTzdUSlRDJTJGMjAyNjAxMTYlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMTE2VDA2MTE0NFomWC1BbXotRXhwaXJlcz00MzE5OSZYLUFtei1TZWN1cml0eS1Ub2tlbj1leUpoYkdjaU9pSklVelV4TWlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaFkyTmxjM05MWlhraU9pSlBXVkk1T0VsYVUxbEZXbFJYU2s4M1ZFcFVReUlzSW1WNGNDSTZNVGMyT0RVMU1EVTFNaXdpY0dGeVpXNTBJam9pYldsdWFXOWhaRzFwYmlKOS5HcVBOV3p3Y0RXaGJMU3lTMGxIdC1SQ25LNVNzbGp3aUJBS21Sa01hbENyUVBYNzAxZW1LU2hCLWQzWkhYcllEVGgzTTV0ckV0cU1fRkotellWZW1mZyZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmdmVyc2lvbklkPW51bGwmWC1BbXotU2lnbmF0dXJlPTQ0YmRjZWViOWFhYjE4MzUwMThkNDFmNjc3NWNjOGZhNTE5Y2ZmNTA1Y2M3NWUyM2YxNDljYTAwZmI2MDVhYmM",
      6: "http://192.168.0.101:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uLzAyNTVhNDM4ZmM3YzIwY2UxYmEyMmI4YjdjMWQzY2EwLmpwZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPU9ZUjk4SVpTWUVaVFdKTzdUSlRDJTJGMjAyNjAxMTYlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMTE2VDA2MTIxMlomWC1BbXotRXhwaXJlcz00MzIwMCZYLUFtei1TZWN1cml0eS1Ub2tlbj1leUpoYkdjaU9pSklVelV4TWlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaFkyTmxjM05MWlhraU9pSlBXVkk1T0VsYVUxbEZXbFJYU2s4M1ZFcFVReUlzSW1WNGNDSTZNVGMyT0RVMU1EVTFNaXdpY0dGeVpXNTBJam9pYldsdWFXOWhaRzFwYmlKOS5HcVBOV3p3Y0RXaGJMU3lTMGxIdC1SQ25LNVNzbGp3aUJBS21Sa01hbENyUVBYNzAxZW1LU2hCLWQzWkhYcllEVGgzTTV0ckV0cU1fRkotellWZW1mZyZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmdmVyc2lvbklkPW51bGwmWC1BbXotU2lnbmF0dXJlPThjNzVhYWE1MDM1YjIyMDFjYjYyMjU2ZTcxYmIwODc5MmFkZDQxNTBlOWZlMTBiNDYwOGRlZjlhMzNjYzY4NGM",
      11: "http://192.168.0.101:9001/api/v1/download-shared-object/aHR0cDovLzEyNy4wLjAuMTo5MDAwL2FydGlzaG9rLWltYWdlcy9leGhpYml0aW9uL3dvbWFuLWFydC1leGhpYml0aW9uXzUzODc2LTE0Mzc5LmpwZy5hdmlmP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9T1lSOThJWlNZRVpUV0pPN1RKVEMlMkYyMDI2MDExNiUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNjAxMTZUMDYxMzEzWiZYLUFtei1FeHBpcmVzPTQzMTk5JlgtQW16LVNlY3VyaXR5LVRva2VuPWV5SmhiR2NpT2lKSVV6VXhNaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpoWTJObGMzTkxaWGtpT2lKUFdWSTVPRWxhVTFsRldsUlhTazgzVkVwVVF5SXNJbVY0Y0NJNk1UYzJPRFUxTURVMU1pd2ljR0Z5Wlc1MElqb2liV2x1YVc5aFpHMXBiaUo5LkdxUE5XendjRFdoYkxTeVMwbEh0LVJDbks1U3NsandpQkFLbVJrTWFsQ3JRUFg3MDFlbUtTaEItZDNaSFhyWURUaDNNNXRyRXRxTV9GSi16WVZlbWZnJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZ2ZXJzaW9uSWQ9bnVsbCZYLUFtei1TaWduYXR1cmU9NDA2ZWJkNWY0NjNhZDNlOTJhYTRiNjA5NTliZDJlZTJlZWJmNWJiZDRkOWZiZjBlMmY4OWM2MjRmZWYyNGU2MA",
      3: "",
    };

    return defaultImages[galleryId];
  };

  return (
    <div className="gallery-card">
      <div className="gallery-image-container">
        <img
          src={
            gallery.logoUrl ||
            "https://www.google.com/url?sa=t&source=web&rct=j&url=https%3A%2F%2Fpetersburg24.ru%2Fpost%2Ftop-10-besplatnyh-galerej-v-sankt-peterburge&ved=0CBUQjRxqFwoTCNj3ku_22JEDFQAAAAAdAAAAABAH&opi=89978449"
          }
          alt={gallery.name}
          className="gallery-logo"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getDefaultGalleryImage(gallery.id);
          }}
        />
      </div>

      <div className="gallery-content">
        <div className="gallery-header">
          <h3 className="gallery-title">
            {gallery.name || "Название галереи"}
          </h3>
          {gallery.admin_comment && (
            <div
              className="gallery-admin-comment"
              title="Комментарий администратора"
            >
              <i className="comment-icon">💬</i>
            </div>
          )}
        </div>

        <p className="gallery-description">
          {gallery.description || "Описание галереи отсутствует"}
        </p>

        <div className="gallery-info-section">
          <div className="gallery-info-item">
            <i className="info-icon">📍</i>
            <span className="info-text">
              {gallery.address || "Адрес не указан"}
            </span>
          </div>

          {gallery.contact_phone && (
            <div className="gallery-info-item">
              <i className="info-icon">📞</i>
              <a href={`tel:${gallery.contact_phone}`} className="info-link">
                {formatPhoneNumber(gallery.contact_phone)}
              </a>
            </div>
          )}

          {gallery.contact_email && (
            <div className="gallery-info-item">
              <i className="info-icon">✉️</i>
              <a href={`mailto:${gallery.contact_email}`} className="info-link">
                {gallery.contact_email}
              </a>
            </div>
          )}
        </div>

        {gallery.admin_comment && (
          <div className="gallery-admin-note">
            <strong>Примечание администратора:</strong>
            <p>{gallery.admin_comment}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryCard;
