import Breadcrumbs from "@/components/Breadcrumbs";
import AboutSection from "./AboutSection";
import Vission from "./Vission";
import Mission from "./Mission";
import Header from "@/components/Header/Header";

export default function About() {
  return (
    <>
      <Header />
      <Breadcrumbs title="About Us" menuText="About Us" />
      <AboutSection />
      <Vission />
      <Mission />
    </>
  );
}
