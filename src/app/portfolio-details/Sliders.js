"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import PortoflioImg1 from "../../../public/img/call-bg.jpg";
import Image from "next/image";

export default function Sliders() {
  const [detailsSlider, setdetailsSlider] = useState([
    {
      id: "slider1",
      img: PortoflioImg1,
    },
    {
      id: "slider2",
      img: PortoflioImg1,
    },
    {
      id: "slider3",
      img: PortoflioImg1,
    },
  ]);

  return (
    <>
      {/* <!-- Slider Area --> */}
      <section className="slider">
        <Swiper
          loop={true}
          // autoplay={{ delay: 4000 }}
          modules={[Navigation, Autoplay]}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          className="pf-details-slider"
        >
          {detailsSlider.map((singleSlider) => (
            <SwiperSlide key={singleSlider.id}>
              <Image
                src={singleSlider.img}
                alt="#"
                width={2560}
                height={1200}
              />
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="swiper-button-next"></div>
        <div className="swiper-button-prev"></div>
      </section>
    </>
  );
}
