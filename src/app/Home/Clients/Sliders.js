"use client";

import { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import ClientImg1 from "../../../../public/img/client1.png";
import ClientImg2 from "../../../../public/img/client2.png";
import ClientImg3 from "../../../../public/img/client3.png";
import ClientImg4 from "../../../../public/img/client4.png";
import ClientImg5 from "../../../../public/img/client5.png";

export default function Sliders() {
  const [clientSliders, setclientSliders] = useState([
    {
      id: "slider1",
      img: ClientImg1,
    },
    {
      id: "slider2",
      img: ClientImg2,
    },
    {
      id: "slider3",
      img: ClientImg3,
    },
    {
      id: "slider4",
      img: ClientImg4,
    },
    {
      id: "slider5",
      img: ClientImg5,
    },
    {
      id: "slider6",
      img: ClientImg3,
    },
  ]);

  return (
    <>
      <Swiper
        loop={true}
        slidesPerView={5}
        autoplay={{ delay: 4000 }}
        modules={[Autoplay]}
        className="clients-slider"
        breakpoints={{
          360: {
            slidesPerView: 2,
            loop: false,
          },
          576: {
            slidesPerView: 3,
          },
          1024: {
            slidesPerView: 5,
          },
        }}
      >
        {clientSliders.map((singleSlider) => (
          <SwiperSlide className="single-clients" key={singleSlider.id}>
            <Image src={singleSlider.img} alt="#" width={216} height={56} />
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
}
