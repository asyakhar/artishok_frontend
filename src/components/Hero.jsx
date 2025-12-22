import { useEffect, useState, useRef } from 'react';
import './Hero.css';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nextSlide, setNextSlide] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const slidesRef = useRef([]);

  // Массив локальных изображений из public/images/hero/
  const slides = [
    {
      id: 1,
      image: "/images/hero/gallery1.jpg",
      alt: "Интерьер современной галереи",
    },
    {
      id: 2,
      image: "/images/hero/gallery2.jpg",
      alt: "Выставка современного искусства",
    },
    {
      id: 3,
      image: "/images/hero/gallery3.jpg",
      alt: "Работы современных художников",
    },
    {
      id: 4,
      image: "/images/hero/gallery4.jpg",
      alt: "Арт-пространство галереи",
    }
  ];

  // Предзагрузка всех изображений
  useEffect(() => {
    const loadImages = async () => {
      const promises = slides.map((slide, index) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = slide.image;
          img.onload = () => {
            setImagesLoaded(prev => ({ ...prev, [index]: true }));
            resolve();
          };
          img.onerror = reject;
        });
      });

      try {
        await Promise.all(promises);
        console.log('Все изображения предзагружены');
      } catch (error) {
        console.error('Ошибка загрузки изображений:', error);
      }
    };

    loadImages();
  }, []);

  // Автопрокрутка карусели
  useEffect(() => {
    const interval = setInterval(() => {
      handleNextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide]);

  const handleNextSlide = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const nextIndex = (currentSlide + 1) % slides.length;
    setNextSlide(nextIndex);
    
    // Начинаем переход
    slidesRef.current[nextIndex]?.classList.add('next');
    
    setTimeout(() => {
      setCurrentSlide(nextIndex);
      setIsTransitioning(false);
      
      // Убираем класс next с предыдущего слайда
      slidesRef.current.forEach((slide, index) => {
        if (slide) {
          slide.classList.remove('next');
        }
      });
    }, 1500); // Длительность анимации
  };

  const handlePrevSlide = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
    setNextSlide(prevIndex);
    
    slidesRef.current[prevIndex]?.classList.add('next');
    
    setTimeout(() => {
      setCurrentSlide(prevIndex);
      setIsTransitioning(false);
      
      slidesRef.current.forEach((slide, index) => {
        if (slide) {
          slide.classList.remove('next');
        }
      });
    }, 1500);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentSlide) return;
    
    setIsTransitioning(true);
    setNextSlide(index);
    
    slidesRef.current[index]?.classList.add('next');
    
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
      
      slidesRef.current.forEach((slide, i) => {
        if (slide) {
          slide.classList.remove('next');
        }
      });
    }, 1500);
  };

  return (
    <section className="hero" id="home">
      {/* Карусель с локальными изображениями */}
      <div className="hero-carousel">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            ref={el => slidesRef.current[index] = el}
            className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
            style={{
              transitionDelay: index === currentSlide ? '0ms' : '1500ms'
            }}
          >
            {imagesLoaded[index] ? (
              <>
                <img 
                  src={slide.image} 
                  alt={slide.alt}
                  className="slide-image"
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
                <div className="slide-overlay"></div>
              </>
            ) : (
              // Плейсхолдер пока изображение грузится
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div className="spinner"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Контент поверх карусели */}
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="hero-title-line">Искусство, которое</span>
              <span className="hero-title-line accent">шокирует и вдохновляет</span>
            </h1>

            <p className="hero-subtitle">
              Платформа для организации выставок современного искусства.
              Связываем художников, галереи и ценителей искусства в одном пространстве.
            </p>
          </div>
        </div>
      </div>

     

      {/* Скролл индикатор */}
      <div className="hero-scroll-indicator">
        <a href="#exhibitions" className="scroll-down">
          <i className="fas fa-chevron-down"></i>
        </a>
      </div>
    </section>
  );
};

export default Hero;