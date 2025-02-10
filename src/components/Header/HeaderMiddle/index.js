import Link from "next/link";
import Logo from "../Logo";
import MobileOffcanvas from "@/components/MobileOffcanvas";

export default function HeaderMiddle() {
  return (
    <>
      <div className="middle-header">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-3 col-12 mobile-menu-sticky">
              <Logo />
              <MobileOffcanvas />
            </div>
            <div className="col-lg-9 col-md-9 col-12">
              <div className="widget-main">
                <div className="single-widget">
                  <i className="icofont-ui-call"></i>
                  <p>Call us anytime</p>
                  <h4>+880123-467-789</h4>
                </div>

                <div className="single-widget">
                  <i className="icofont-clock-time"></i>
                  <p>Opeening Time</p>
                  <h4>Mon-Sat: 9.00-18.00</h4>
                </div>

                <div className="single-widget button">
                  <div className="get-quote">
                    <Link href="/appointment" className="btn">
                      Appointment
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
