import Breadcrumbs from "@/components/Breadcrumbs";
import FaqMain from "./FaqMain";
import Header from "@/components/Header/Header";

export default function Faq() {
  return (
    <>
      <Header />

      <Breadcrumbs title="Frequently Asked Questions" menuText="Faq" />
      <FaqMain />
    </>
  );
}
