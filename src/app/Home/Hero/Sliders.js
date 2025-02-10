"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import HeroBg1 from "../../../../public/img/slider2.jpg";
import HeroBg2 from "../../../../public/img/slider.jpg";
import HeroBg3 from "../../../../public/img/slider3.jpg";
import { app } from "@/lib/firebaseConfig";

export default function Sliders(props) {
  const { sectionName } = props;
  const router = useRouter();
  const auth = getAuth();
  
  const [heroSliders, setHeroSliders] = useState([
    {
      id: "slider1",
      bgImg: HeroBg1,
      title: "Your Health, Our <span> <br/>Priority—Experience <br/> Comprehensive</span> Physiotherapy <br/> Care",
      subTitle: "True healing begins when we stop running from <br/>our pain and start facing it.",
      button: {
        text: "Get Appointment",
        link: "/appointment",
      },
      button2: {
        text: "Learn More",
        link: "/about",
      },
    },
    {
      id: "slider2",
      bgImg: HeroBg2,
      title: "Restoring Balance, Strength,<br/> and Peace—Your Journey to a <span>Healthier</span> Life Starts Here",
      subTitle: "Just like a doctor heals the body, a therapist <br/> helps heal the mind.",
      button: {
        text: "Get Appointment",
        link: "/appointment",
      },
      button2: {
        text: "About Us",
        link: "/about",
      },
    },
    {
      id: "slider3",
      bgImg: HeroBg3,
      title: "Transform Your Mind and Body<br/>with <span>Professional Care</span> and <br/> Natural Healing",
      subTitle: "Just like removing dust from a mirror, Hijama <br/>helps remove toxins from the body.",
      button: {
        text: "Get Appointment",
        link: "/appointment",
      },
      button2: {
        text: "Contact Now",
        link: "/contact",
      },
    },
  ]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user); // Update state based on user authentication
    });

    return () => unsubscribe(); // Clean up subscription
  }, [auth]);

  const handleAppointmentClick = () => {
    if (isLoggedIn) {
      router.push("/appointment"); // Redirect to appointment page
    } else {
      router.push("/login"); // Redirect to login page
    }
  };

  return (
    <>
      {/* <!-- Slider Area --> */}
      <section className={sectionName ? sectionName : "slider"}>
        <Swiper
          autoplay={{ delay: 4000 }}
          modules={[Navigation, Autoplay]}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          className="hero-slider"
        >
          {heroSliders.map((singleSlider) => (
            <SwiperSlide
              className="single-slider"
              style={{
                backgroundImage: `url(${singleSlider.bgImg.src})`,
              }}
              key={singleSlider.id}
            >
              <div className="container">
                <div className="row">
                  <div className="col-lg-7 col-12">
                    <div className="text">
                      <h1
                        dangerouslySetInnerHTML={{
                          __html: singleSlider.title,
                        }}
                      ></h1>
                      <p
                        dangerouslySetInnerHTML={{
                          __html: singleSlider.subTitle,
                        }}
                      ></p>
                      {/* <!-- Slider Button --> */}
                      <div className="button">
                        <button 
                          className="btn"
                          onClick={handleAppointmentClick}
                        >
                          {singleSlider.button.text}
                        </button>
                        <a
                          href={singleSlider.button2.link}
                          className="btn primary"
                        >
                          {singleSlider.button2.text}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="swiper-button-next"></div>
        <div className="swiper-button-prev"></div>
      </section>
    </>
  );
}
