"use client";
import { useState, useEffect } from "react";
import Header from "@/components/Header/Header";
import Appoinment from "./Home/Appoinment";
import Blog from "./Home/Blog";
import CallAction from "./Home/CallAction";
import Clients from "./Home/Clients";
import Departments from "./Home/Departments";
import Features from "./Home/Features";
import Funfact from "./Home/Funfact";
import Hero from "./Home/Hero";
import Portfolio from "./Home/Portfolio";
import Pricing from "./Home/Pricing";
import Schedule from "./Home/Schedule";
import Services from "./Home/Services";
import Team from "./Home/Team";
import Testimonial from "./Home/Testimonials";
import WhyChoose from "./Home/WhyChoose";
import BookingPopup from "@/components/BookingPopup"; // adjust the path as needed
import Booknow from"@/components/Booknow"
export default function Home() {
  const [showBookingPopup, setShowBookingPopup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBookingPopup(true);
    }, 3000); // 3-second delay
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Header />
      <Hero />
      <Schedule />
      {/* <Booknow/> */}
      <Appoinment />
      {/* <Features /> */}
      {/* <Funfact /> */}
      <WhyChoose />
      {/* <CallAction /> */}
      {/* <Portfolio /> */}
      <Services />
      <Testimonial />
      {/* <Departments /> */}
      <Pricing />
      {/* <Team /> */}
      {/* <Blog /> */}
      {/* <Clients /> */}
      
      {showBookingPopup && (
        <BookingPopup onClose={() => setShowBookingPopup(false)} />
      )}
    </>
  );
}
