import React, { useMemo } from "react";
const images = import.meta.glob(
  "../../../assets/hero/*.{jpg,jpeg,png,webp,avif}",
  { eager: true }
);

const HeroImage = ({ image }) => {
  return (
    <div className="grid grid-cols-4 w-lvw shrink-0 items-center justify-center">
      <img
        className="w-full object-cover col-span-1 blur-lg"
        src={image.default}
        alt=""
      />

      <img
        className="w-full object-cover max-h-[500px] col-span-2"
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
  console.log(imageArray);

  return (
    <section className="h-[500px] overflow-y-hidden flex flex-nowrap gap-0.5 ">
      {imageArray && imageArray.map((image) => <HeroImage image={image} />)}
    </section>
  );
};

export default Hero;
