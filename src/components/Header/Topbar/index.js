import Link from "next/link";

export default function Topbar() {
  return (
    <>
      <div className="topbar">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-md-5 col-12">
              <ul className="top-link">
                <li>
                  <Link href="/about">About</Link>
                </li>
                <li>
                  <Link href="/doctors">Doctors</Link>
                </li>
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
                <li>
                  {/* <Link href="/faq">FAQ</Link> */}
                </li>
              </ul>
            </div>
            <div className="col-lg-6 col-md-7 col-12">
              <ul className="top-contact">
                <li>
                  <i className="fa fa-phone"></i>+91 70441 78786
                </li>
                <li>
                  <i className="fa fa-envelope"></i>
                  <Link href="mailto:medzealpcw@gmail.com">
                    medzealpcw@gmail.com
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
