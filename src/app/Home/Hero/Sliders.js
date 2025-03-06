"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebaseConfig";

export default function Sliders(props) {
  const { sectionName } = props;
  const router = useRouter();
  const auth = getAuth();
  
  const [heroSliders, setHeroSliders] = useState([
    {
      id: "slider1",
      videoSrc: "/videos/slider1.mp4",
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
      videoSrc: "/videos/slider2.mp4",
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
      videoSrc: "/videos/slider3.mp4",
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleAppointmentClick = () => {
    router.push(isLoggedIn ? "/appointment" : "/login");
  };

  return (
    <>
      <section className={sectionName ? sectionName : "slider"}>
        <Swiper
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          modules={[Navigation, Autoplay]}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          className="hero-slider"
          loop={true}
        >
          {heroSliders.map((singleSlider) => (
            <SwiperSlide className="single-slider" key={singleSlider.id}>
              <div className="video-container">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="background-video"
                >
                  <source src={singleSlider.videoSrc} type="video/mp4" />
                </video>
              </div>
              <div className="container">
                <div className="row">
                  <div className="col-lg-7 col-12">
                    <div className="text">
                      <h1 dangerouslySetInnerHTML={{ __html: singleSlider.title }} />
                      <p dangerouslySetInnerHTML={{ __html: singleSlider.subTitle }} />
                      <div className="button">
                        <button className="btn" onClick={handleAppointmentClick}>
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

      <style jsx global>{`
        .slider {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .video-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          min-width: 100%;
          min-height: 100%;
          width: auto;
          height: auto;
          z-index: 0;
        }

        .background-video {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          min-width: 100%;
          min-height: 100%;
          width: auto;
          height: auto;
          object-fit: cover;
        }

        .single-slider {
          position: relative;
          height: 100vh;
          display: flex;
          align-items: center;
        }

        .text {
          position: relative;
          z-index: 1;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        @media (max-width: 768px) {
          .single-slider {
            height: 80vh;
          }
          
          .background-video {
            width: 100%;
            height: 100%;
          }
        }
      `}</style>
    </>
  );
}