import SectionHead from "@/components/SectionHead";
import BlogCard from "@/components/BlogCard";

import BlogImg1 from "../../../../public/img/blog1.jpg";
import BlogImg2 from "../../../../public/img/blog2.jpg";
import BlogImg3 from "../../../../public/img/blog3.jpg";

export default function Blog() {
  return (
    <>
      <section className="blog section" id="blog">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <SectionHead
                title="Keep up with Our Most Recent Medical News."
                desc="Lorem ipsum dolor sit amet consectetur adipiscing elit praesent aliquet. pretiumts"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-4 col-md-6 col-12">
              <BlogCard
                image={BlogImg1}
                date="22 Aug, 2020"
                title="We have annnocuced our new product."
                desc="Lorem ipsum dolor a sit ameti, consectetur adipisicing elit, sed do eiusmod tempor incididunt sed do incididunt sed."
              />
            </div>
            <div className="col-lg-4 col-md-6 col-12">
              <BlogCard
                image={BlogImg2}
                date="15 Jul, 2020"
                title="Top five way for solving teeth problems."
                desc="Lorem ipsum dolor a sit ameti, consectetur adipisicing elit, sed do eiusmod tempor incididunt sed do incididunt sed."
              />
            </div>
            <div className="col-lg-4 col-md-6 col-12">
              <BlogCard
                image={BlogImg3}
                date="05 Jan, 2020"
                title="We provide highly business soliutions."
                desc="Lorem ipsum dolor a sit ameti, consectetur adipisicing elit, sed do eiusmod tempor incididunt sed do incididunt sed."
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
