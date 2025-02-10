import Breadcrumbs from "@/components/Breadcrumbs";
import Features from "../Home/Features";
import Funfact from "../Home/Funfact";
import Services from "../Home/Services";
import Testimonial from "../Home/Testimonials";
import Header from "@/components/Header/Header";

export default function Testimonials() {
  return (
    <>
      <Header />

      <Breadcrumbs title="Testimonials" menuText="Testimonials" />

      <Features sectionName="Feautes testimonial-page section" />

      <Funfact />

      <Services />

      <Testimonial />
    </>
  );
}
