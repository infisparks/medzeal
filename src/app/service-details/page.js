import Image from "next/image";

import Breadcrumbs from "@/components/Breadcrumbs";
import ServiceImg from "../../../public/img/service-details-bg.jpg";
import Header from "@/components/Header/Header";

export default function ServiceDetails() {
  return (
    <>
      <Header />

      <Breadcrumbs title="Service Details" menuText="Service Details" />

      <div className="service-details-area section">
        <div className="container">
          <div className="services-details-img">
            <Image src={ServiceImg} alt="#" width={1920} height={1000} />
            <h2>Our hospital always provide good services</h2>
            <p>
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry&apos;s standard dummy
              text ever since the 1500s, when an unknown printer took a galley
              of type and scrambled it to make a type specimen book. It has
              survived not only five centuries, but also the leap into
              electronic typesetting, remaining essentially unchanged. It was
              popularised in the 1960s with the release of Letraset sheets
              containing Lorem Ipsum passages, and more recently with desktop
              publishing software like Aldus PageMaker including versions of
              Lorem Ipsum.
            </p>
            <blockquote>
              <i className="icofont-quote-left"></i>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint
              optio rem magni, dolorum aut vel nostrum quae, fugit
              necessitatibus eius perferendis. Quia optio tenetur pariatur
              aliquam obcaecati enim quam eum?Lorem ipsum dolor sit amet
              consectetur adipisicing elit. Sint optio rem magni, dolorum aut
              vel nostrum quae, fugit necessitatibus eius perferendis. Quia
              optio tenetur pariatur aliquam obcaecati enim quam eum?
            </blockquote>
            <p>
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry&apos;s standard dummy
              text ever since the 1500s, when an unknown printer took a galley
              of type and scrambled it to make a type specimen book. It has
              survived not only five centuries, but also the leap into
              electronic typesetting, remaining essentially unchanged. It was
              popularised in the 1960s with the release of Letraset sheets
              containing Lorem Ipsum passages, and more recently with desktop
              publishing software like Aldus PageMaker including versions of
              Lorem Ipsum.
            </p>
          </div>
          <div className="row">
            <div className="col-lg-5">
              <div className="service-details-inner-left">
                {/* <Image src="img/signup-bg.jpg" alt="#" /> */}
              </div>
            </div>
            <div className="col-lg-7">
              <div className="service-details-inner">
                <h2>
                  We always take care <br /> our patient
                </h2>
                <p>
                  Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                  Architecto blanditiis obcaecati veritatis magnam pariatur
                  molestiae in maxime. Animi quae vitae in inventore. Totam
                  mollitia aspernatur provident veniam aperiam placeat impedit!
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                  Saepe rem natus nobis, dolorum nam excepturi iure autem nemo
                  ducimus temporibus facere, est eum voluptatem, culpa optio
                  fugit assumenda quod? Praesentium.
                </p>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Id,
                  laudantium ullam, iure distinctio officia libero voluptatem
                  obcaecati vero deleniti minima nemo itaque alias nisi eveniet
                  soluta architecto quae laboriosam unde.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
