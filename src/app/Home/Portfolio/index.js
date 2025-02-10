import SectionHead from "@/components/SectionHead";
import Sliders from "./Sliders";

export default function Portfolio() {
  return (
    <>
      <section className="portfolio section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <SectionHead
                title="We Maintain Cleanliness Rules Inside Our Hospital"
                desc="Lorem ipsum dolor sit amet consectetur adipiscing elit praesent aliquet. pretiumts"
              />
            </div>
          </div>
        </div>
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-12 col-12">
              <Sliders />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
