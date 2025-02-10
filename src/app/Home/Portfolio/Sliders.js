"use client";

import Image from "next/image";
import Link from "next/link";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {Autoplay } from "swiper/modules";

import PortfolioImg1 from "../../../../public/img/pf1.jpg";
import PortfolioImg2 from "../../../../public/img/pf2.jpg";
import PortfolioImg3 from "../../../../public/img/pf3.jpg";
import PortfolioImg4 from "../../../../public/img/pf4.jpg";

export default function Sliders() {
  const [portfolioSlider, setportfolioSlider] = useState([
    {
      id: "slider1",
      img: PortfolioImg1,
    },
    {
      id: "slider2",
      img: PortfolioImg2,
    },
    {
      id: "slider3",
      img: PortfolioImg3,
    },
    {
      id: "slider4",
      img: PortfolioImg4,
    },
    {
      id: "slider5",
      img: PortfolioImg2,
    },
  ]);

  return (
    <>
      <Swiper
        slidesPerView={4}
        spaceBetween={15}
        loop={true}
        autoplay={{ delay: 4000 }}
        modules={[Autoplay]}
        className="portfolio-slider"
        breakpoints={{
          320: {
            slidesPerView: 1,
          },
          360: {
            slidesPerView: 1,
          },
          576: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 4,
          },
        }}
      >
        {portfolioSlider.map((singleSlider) => (
          <SwiperSlide className="single-pf" key={singleSlider.id}>
            <Image src={singleSlider.img} alt="#" width={320} height={252} />
            <Link href="/portfolio-details" className="btn">
              View Details
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
}
