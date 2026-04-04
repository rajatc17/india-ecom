import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { SlArrowRight, SlArrowLeft } from "react-icons/sl";
import { HERO_COPY_VARIANTS, HERO_TRUST_METRICS } from "./heroCampaigns";

const imageFiles = import.meta.glob(
  "../../../assets/hero/*.{jpg,jpeg,png,webp,avif}"
);

const HERO_VARIANT_STORAGE_KEY = "shilpika:heroCopyVariant";

const HeroSlide = ({ image, slide, recommendations, activeIndex, totalSlides }) => {
  const secondaryTo = slide.secondaryTo || recommendations?.[0]?.to || "/search";

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 w-screen shrink-0 items-stretch justify-center">
      <img
        className="hidden md:block w-full h-full object-cover col-span-1 blur-md scale-105"
        src={image.default}
        alt=""
        aria-hidden="true"
      />

      <div className="relative col-span-1 md:col-span-2 h-[58vh] min-h-[440px] max-h-[700px] overflow-hidden">
        <img className="w-full h-full object-cover" src={image.default} alt={slide.title} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute top-4 right-4 rounded-full border border-white/35 bg-black/30 px-3 py-1 text-xs text-amber-50/95 backdrop-blur-sm">
          {activeIndex + 1} / {totalSlides}
        </div>

        <div className="absolute bottom-6 left-5 right-5 md:bottom-10 md:left-8 md:right-8 lg:left-12 lg:right-12 text-white">
          <p className="text-[11px] md:text-xs uppercase tracking-[0.22em] text-amber-200/95">{slide.eyebrow}</p>

          <h1 className="mt-3 shilpika-heading text-2xl sm:text-3xl lg:text-5xl leading-tight text-amber-50 max-w-3xl">
            {slide.title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm sm:text-base text-amber-50/90 leading-relaxed">{slide.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={slide.primaryTo}
              className="inline-flex items-center justify-center rounded-full bg-[#C5663E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#B35835]"
            >
              {slide.primaryLabel}
            </Link>
            <Link
              to={secondaryTo}
              className="inline-flex items-center justify-center rounded-full border border-amber-100/70 bg-white/10 px-6 py-3 text-sm font-semibold text-amber-50 backdrop-blur-sm transition hover:bg-white/20"
            >
              {slide.secondaryLabel}
            </Link>
          </div>

          <div className="mt-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-100/80">Curated recommendations</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {recommendations.map((entry) => (
                <Link
                  key={`${slide.intent}-${entry.to}-${entry.label}`}
                  to={entry.to}
                  className="rounded-full border border-white/40 bg-white/12 px-3 py-1.5 text-xs font-medium text-amber-50 transition hover:bg-white/20"
                >
                  {entry.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 max-w-xl">
            {HERO_TRUST_METRICS.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-white/25 bg-black/20 px-3 py-2 backdrop-blur-sm">
                <p className="text-base md:text-lg font-semibold text-amber-50">{metric.value}</p>
                <p className="text-[10px] md:text-xs text-amber-100/85 uppercase tracking-[0.08em]">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <img
        className="hidden md:block w-full h-full object-cover col-span-1 blur-md scale-105"
        src={image.default}
        alt=""
        aria-hidden="true"
      />
    </div>
  );
};

const Hero = ({ recommendations = [] }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);
  const [isHovering, setIsHovering] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copyVariant, setCopyVariant] = useState(() => {
    const saved = localStorage.getItem(HERO_VARIANT_STORAGE_KEY);
    return saved === "festive" ? "festive" : "premium";
  });

  const sectionRef = useRef(null);
  const heroImageContainerRef = useRef(null);
  const timerRef = useRef(null);

  const slideContent = useMemo(
    () => HERO_COPY_VARIANTS[copyVariant] || HERO_COPY_VARIANTS.premium,
    [copyVariant]
  );

  const categoryLinks = useMemo(() => {
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return [];
    }

    return recommendations
      .filter((cat) => cat?.slug && cat?.name)
      .slice(0, 3)
      .map((cat) => ({ label: cat.name, to: `/category/${cat.slug}` }));
  }, [recommendations]);

  const getRecommendationsForSlide = useCallback(
    (slide, slideIndex) => {
      if (categoryLinks.length > 0) {
        const rotated = categoryLinks.map((_, index) => {
          const targetIndex = (slideIndex + index) % categoryLinks.length;
          return categoryLinks[targetIndex];
        });

        return [...rotated.slice(0, 2), slide.fallbackRecommendations[0]];
      }

      return slide.fallbackRecommendations;
    },
    [categoryLinks]
  );

  useEffect(() => {
    localStorage.setItem(HERO_VARIANT_STORAGE_KEY, copyVariant);
  }, [copyVariant]);

  useEffect(() => {
    const loadImages = async () => {
      const loadedImages = await Promise.all(
        Object.values(imageFiles).map((importFn) => importFn())
      );
      setImages(loadedImages);
      setLoading(false);
    };

    loadImages();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!sectionRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting);
      },
      {
        threshold: 0.4,
      }
    );

    observer.observe(sectionRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSlide = useCallback(
    (index, behavior = "smooth") => {
      const container = heroImageContainerRef.current;
      if (!container || images.length === 0) {
        return;
      }

      const safeIndex = (index + images.length) % images.length;
      container.scrollTo({
        left: safeIndex * container.clientWidth,
        behavior,
      });
      setCurrentSlide(safeIndex);
    },
    [images.length]
  );

  const scrollNext = useCallback(() => {
    if (images.length === 0) {
      return;
    }
    scrollToSlide(currentSlide + 1);
  }, [currentSlide, images.length, scrollToSlide]);

  const scrollPrev = useCallback(() => {
    if (images.length === 0) {
      return;
    }
    scrollToSlide(currentSlide - 1);
  }, [currentSlide, images.length, scrollToSlide]);

  useEffect(() => {
    if (images.length === 0) {
      return;
    }

    const heroCarouselResize = () => {
      scrollToSlide(currentSlide, "auto");
    };

    window.addEventListener("resize", heroCarouselResize);
    return () => window.removeEventListener("resize", heroCarouselResize);
  }, [currentSlide, images.length, scrollToSlide]);

  useEffect(() => {
    if (!isHeroVisible || !isTabVisible || isHovering || images.length <= 1) {
      return;
    }

    timerRef.current = setTimeout(() => scrollNext(), 5500);
    return () => {
      clearTimeout(timerRef.current);
    };
  }, [currentSlide, images.length, isHeroVisible, isTabVisible, isHovering, scrollNext]);

  if (loading) {
    return <div>Loading images...</div>;
  }

  return (
    <section
      className="relative h-fit"
      ref={sectionRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/35 bg-black/35 p-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setCopyVariant("premium")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            copyVariant === "premium" ? "bg-amber-100 text-amber-950" : "text-amber-50/90 hover:text-white"
          }`}
        >
          Premium Tone
        </button>
        <button
          type="button"
          onClick={() => setCopyVariant("festive")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            copyVariant === "festive" ? "bg-amber-100 text-amber-950" : "text-amber-50/90 hover:text-white"
          }`}
        >
          Festive Tone
        </button>
      </div>

      <div className="absolute left-2 top-1/2 z-20 -translate-y-1/2 md:left-4">
        <button
          className="bg-black/45 p-2 md:p-3 rounded-full text-white cursor-pointer backdrop-blur-sm border border-white/20 hover:bg-black/60 transition"
          onClick={scrollPrev}
          aria-label="Previous hero slide"
        >
          <SlArrowLeft size={18} />
        </button>
      </div>

      <div className="overflow-hidden flex flex-nowrap h-full" ref={heroImageContainerRef}>
        {images.map((image, i) => {
          const slide = slideContent[i % slideContent.length];
          return (
            <HeroSlide
              key={i}
              image={image}
              slide={slide}
              recommendations={getRecommendationsForSlide(slide, i)}
              activeIndex={currentSlide}
              totalSlides={images.length}
            />
          );
        })}
      </div>

      <div className="absolute right-2 top-1/2 z-20 -translate-y-1/2 md:right-4">
        <button
          className="bg-black/45 p-2 md:p-3 rounded-full text-white cursor-pointer backdrop-blur-sm border border-white/20 hover:bg-black/60 transition"
          onClick={scrollNext}
          aria-label="Next hero slide"
        >
          <SlArrowRight size={18} />
        </button>
      </div>

      <div className="absolute bottom-3 md:bottom-5 w-screen">
        <div className="flex justify-center">
          {images.map((_, i) => (
            <button
              key={i}
              className={
                "h-2.5 w-2.5 md:h-3 md:w-3 m-1 cursor-pointer rounded-full transition " +
                (currentSlide === i ? "bg-[#C5663E]" : "bg-white/70 hover:bg-[#C5663E]/70")
              }
              onClick={() => scrollToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            >
              {" "}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
