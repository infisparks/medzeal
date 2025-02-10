import SectionHead from "@/components/SectionHead";
import PricingData from "./PricingData";

export default function Pricing() {
  return (
    <>
      <section className="pricing-table section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <SectionHead
                title="Affordable Physiotherapy and Wellness Services"
                desc="We provide specialized care tailored to your needs without compromising quality."
              />
            </div>
          </div>
          <div className="row">
            <PricingData />
          </div>
        </div>
      </section>
    </>
  );
}
