import { useMemo, useEffect, useRef, useState } from "react";
import { SlArrowRight, SlArrowLeft } from "react-icons/sl";

const imageFiles = import.meta.glob(
  "../../../assets/hero/*.{jpg,jpeg,png,webp,avif}"
);

const HeroImage = ({ image, ref, timerRef }) => {
  return (
    <div
      className="grid grid-cols-4 w-screen shrink-0 items-center justify-center"
      ref={ref}
    >
      <img
        className="w-full object-cover col-span-1 blur-lg"
        src={image.default}
        alt=""
      />

      <img
        className="w-full object-cover max-h-[600px] col-span-2"
        src={image.default}
        alt=""
      />

      <img
        className="w-full object-cover col-span-1 blur-lg"
        src={image.default}
        alt=""
      />
    </div>
  );
};

const Hero = () => {

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const [currentSlide, setCurrentSlide] = useState(0);
  const heroCarouselRefs = useRef([]);
  const heroImageContainerRef = useRef(null);
  const timerRef = useRef(null);

  const scrollToSlide = (index) => {
  const container = heroImageContainerRef.current;
  if (container && container.children[index]) {
    const slide = container.children[index];
    container.scrollTo({
      left: slide.offsetLeft,
      behavior: "smooth"
    });
    setCurrentSlide(index);
  }
};

  const scrollNext = () => {
    const next = (currentSlide + 1) % heroImageContainerRef.current.children.length;
    scrollToSlide(next);
  };

  const scrollPrev = () => {
    const prev = (currentSlide - 1 + heroImageContainerRef.current.children.length) % heroImageContainerRef.current.children.length;
    scrollToSlide(prev);
  };

   useEffect(() => {
    const heroCarouselResize = () => {
      heroCarouselRefs.current[currentSlide].scrollIntoView({
        behavior: "instant",
      });
    };

    window.addEventListener("resize", heroCarouselResize);

    return () => window.removeEventListener("resize", heroCarouselResize);
  }, [currentSlide, heroCarouselRefs]);

  useEffect(() => {
    timerRef.current = setTimeout(() => scrollNext(), 2000);

    return () => {
      clearTimeout(timerRef.current)
    };
  }, [currentSlide]);

  if(loading){
    return <div>Loading images...</div>;
  }

  return (
    <section className="relative h-fit">
      <div className="absolute left-0 top-1/2 z-10">
        <button
          className="bg-black/55 p-2 rounded-4xl text-white cursor-pointer"
          onClick={() => scrollPrev()}
        >
          <SlArrowLeft size={30} />
        </button>
      </div>
      <div className="overflow-hidden  flex flex-nowrap gap-0.5 h-full" ref={heroImageContainerRef}>
        {images &&
          images.map((image, i) => (
            <HeroImage
              image={image}
              key={i}
              ref={(e) => (heroCarouselRefs.current[i] = e)}
              timerRef={timerRef.current}
            />
          ))}
      </div>
      <div className="absolute right-0 top-1/2 z-10">
        <button
          className="bg-black/55 p-2 rounded-4xl text-white cursor-pointer"
          onClick={() => scrollNext()}
        >
          <SlArrowRight size={30} />
        </button>
      </div>
      <div className="absolute bottom-2 w-screen">
        <div className="flex justify-center">
          {images &&
            images.map((image, i) => (
              <button
                className={
                  "p-1.5 m-1 cursor-pointer rounded-4xl " +
                  (currentSlide == i
                    ? "bg-amber-600"
                    : "bg-white hover:bg-amber-600/50")
                }
                key={i}
                onClick={() => {
                  scrollToSlide(i)
                }}
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
