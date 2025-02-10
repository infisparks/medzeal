import SectionHead from "@/components/SectionHead";
import Video from "./Video";

export default function WhyChoose() {
  return (
    <>
      <section className="why-choose section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <SectionHead
                title="Why Choose Medzeal for Your Health Needs"
                desc="Committed to providing top-notch physiotherapy and wellness services for a healthier lifestyle."
              />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-12">
              <div className="choose-left">
                <h3>Who We Are</h3>
                <p>
                  At Medzeal, we are dedicated to improving your health through specialized physiotherapy and wellness services. Our team of experienced professionals is committed to your well-being.
                </p>
                <p>
                  We focus on personalized care tailored to meet your individual health needs, ensuring a holistic approach to wellness.
                </p>
                <div className="row">
                  <div className="col-lg-6">
                    <ul className="list">
                      <li>
                        <i className="fa fa-caret-right"></i>Expert physiotherapists with specialized training.
                      </li>
                      <li>
                        <i className="fa fa-caret-right"></i>Comprehensive wellness services for overall health.
                      </li>
                      <li>
                        <i className="fa fa-caret-right"></i>Patient-centered approach to treatment.
                      </li>
                    </ul>
                  </div>
                  <div className="col-lg-6">
                    <ul className="list">
                      <li>
                        <i className="fa fa-caret-right"></i>Innovative therapies and techniques for optimal recovery.
                      </li>
                      <li>
                        <i className="fa fa-caret-right"></i>Community outreach initiatives promoting healthy living.
                      </li>
                      <li>
                        <i className="fa fa-caret-right"></i>Commitment to continuous improvement and education.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-12">
              <div className="choose-right">
                <div className="video-image">
                  <div className="promo-video">
                    <div className="waves-block">
                      <div className="waves wave-1"></div>
                      <div className="waves wave-2"></div>
                      <div className="waves wave-3"></div>
                    </div>
                  </div>
                  <Video />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
