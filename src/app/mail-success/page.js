import Header from "@/components/Header/Header";
import Link from "next/link";

export default function MailSuccess() {
  return (
    <>
      <Header />

      <section className="mail-seccess section">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 offset-lg-3 col-12">
              <div className="success-inner">
                <h1>
                  <i className="icofont-send-mail"></i>
                  <span>Your Mail Sent Successfully!</span>
                </h1>
                <p>
                  Aenean eget sollicitudin lorem, et pretium felis. Nullam
                  euismod diam libero, sed dapibus leo laoreet ut. Suspendisse
                  potenti. Phasellus urna lacus
                </p>
                <Link href="/" className="btn">
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
