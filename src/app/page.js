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

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <Schedule />
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
      {/* <Appoinment /> */}
    </>
  );
}
