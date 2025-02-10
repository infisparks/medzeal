import Link from "next/link";

import Breadcrumbs from "@/components/Breadcrumbs";
import Sliders from "./Sliders";
import Header from "@/components/Header/Header";

export default function PortfolioDetails() {
  return (
    <>
      <Header />

      <Breadcrumbs title="Portfolio Details" menuText="Portfolio Details" />

      <section className="pf-details section">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="inner-content">
                <div className="image-slider">
                  <Sliders />
                </div>
                <div className="date">
                  <ul>
                    <li>
                      <span>Category :</span> Heart Surgery
                    </li>
                    <li>
                      <span>Date :</span> April 20, 2019
                    </li>
                    <li>
                      <span>Client :</span> Suke Agency
                    </li>
                    <li>
                      <span>Ags :</span> Typo
                    </li>
                  </ul>
                </div>
                <div className="body-text">
                  <h3>Here is the name of this project here</h3>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                    sed do eiusmod tempor a ti incididunt ut labore et dolore to
                    in magna aliqua. Ut enim ad minim veniam, quis to the in
                    nostrud.abore et dolore magna aliqua uis nostrud.Lorem ipsum
                    dolor sit amet, in a in to in a consectetur.ncididunt ut
                    labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                    to the in nostrud.abore et dolore magna in a aliqua uis
                    nostrud.Lorem ipsum dolor sit amet, in aed do eiusmod
                  </p>
                  <p>
                    ncididunt ut labore et dolore magna aliqua. Ut enim ad minim
                    veniam, quis to the in nostrud.abore et dolore magna to in
                    aliqua uis nostrud.Lorem ipsum dolor sit amet, in aed do
                    eiusmod.ncididunt ut labore et dolore magna aliqua.{" "}
                  </p>
                  <p>
                    ncididunt ut labore et dolore magna aliqua. Ut enim ad minim
                    veniam, quis to the in nostrud.abore et dolore magna a
                    aliqua uis nostrud.Lorem ipsum dolor sit amet, in aed do
                    eiusmod.ncididunt ut labore et dolore magna aliqua. Ut enim
                    ad minim veniam, quis to the in nostrud.abore et dolore
                    magna aliqua uis nostrud.Lorem ipsum dolor sit amet, in aed
                    do eiusmod. dolor sit amet, in aed do eiusmod.ncididunt ut
                    labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                    to the in nostrud.abore et dolore magna aliqua uis nostrud.
                  </p>
                  <div className="share">
                    <h4>Share Now -</h4>
                    <ul>
                      <li>
                        <Link href="#">
                          <i
                            className="fa fa-facebook-official"
                            aria-hidden="true"
                          ></i>
                        </Link>
                      </li>
                      <li>
                        <Link href="#">
                          <i className="fa fa-twitter" aria-hidden="true"></i>
                        </Link>
                      </li>
                      <li>
                        <Link href="#">
                          <i className="fa fa-linkedin" aria-hidden="true"></i>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
