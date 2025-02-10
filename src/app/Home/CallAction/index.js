import Link from "next/link";

export default function CallAction() {
  return (
    <>
      <section className="call-action overlay">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12 col-12">
              <div className="content">
                <h2>Do you need Emergency Medical Care? Call @ 1234 56789</h2>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Quisque porttitor dictum turpis nec gravida.
                </p>
                <div className="button">
                  <Link href="/contact" className="btn">
                    Contact Now
                  </Link>
                  <Link href="/about" className="btn second">
                    Learn More<i className="fa fa-long-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
