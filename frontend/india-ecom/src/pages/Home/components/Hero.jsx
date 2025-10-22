import { useMemo, useEffect, useRef, useState } from "react";
import { SlArrowRight, SlArrowLeft } from "react-icons/sl";

const images = import.meta.glob(
    "../../../assets/hero/*.{jpg,jpeg,png,webp,avif}",
    { eager: true }
);

const HeroImage = ({ image, ref }) => {
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
    const imageArray = useMemo(() => Object.values(images), []);

    const [currentSlide, setCurrentSlide] = useState(0);
    const heroSectionRef = useRef(null)
    const heroCarouselRefs = useRef([]);

    useEffect(() => {
        const heroCarouselResize = () => {
            heroCarouselRefs.current[currentSlide].scrollIntoView({
                behavior: 'instant'
            })
        }

        window.addEventListener('resize', heroCarouselResize)

        return () => window.removeEventListener('resize', heroCarouselResize)

    }, [currentSlide, heroCarouselRefs])

    const scrollNext = () => {
        const next = currentSlide + 1;
        if (next < heroCarouselRefs.current.length) {
            heroCarouselRefs.current[next].scrollIntoView({ behavior: "smooth" });
            setCurrentSlide(next);
        }
    };

    const scrollPrev = () => {
        const prev = currentSlide - 1;
        if (prev >= 0) {
            heroCarouselRefs.current[prev].scrollIntoView({ behavior: "smooth" });
            setCurrentSlide(prev);
        }
    };

    return (
        <section className="relative h-[600px]">
            <div className="absolute left-0 top-1/2 z-10">
                <button
                    className="bg-black/55 p-2 rounded-4xl text-white cursor-pointer"
                    onClick={() => scrollPrev()}
                >
                    <SlArrowLeft size={30} />
                </button>
            </div>
            <div className="overflow-hidden flex flex-nowrap gap-0.5 h-full" ref={heroSectionRef}>
                {imageArray &&
                    imageArray.map((image, i) => (
                        <HeroImage
                            image={image}
                            key={i}
                            ref={(e) => (heroCarouselRefs.current[i] = e)}
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
        </section>
    );
};

export default Hero;
