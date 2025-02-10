import Image from "next/image";
import Link from "next/link";

import AuthorImg1 from "../../../public/img/author1.jpg";
import AuthorImg2 from "../../../public/img/author2.jpg";
import AuthorImg3 from "../../../public/img/author3.jpg";

export default function Comments() {
  return (
    <>
      <div className="blog-comments">
        <h2>All Comments</h2>
        <div className="comments-body">
          <div className="single-comments">
            <div className="main">
              <div className="head">
                <Image src={AuthorImg1} alt="#" width={455} height={455} />
              </div>
              <div className="body">
                <h4>Afsana Mimi</h4>
                <div className="comment-meta">
                  <span className="meta">
                    <i className="fa fa-calendar"></i>March 05, 2019
                  </span>
                  <span className="meta">
                    <i className="fa fa-clock-o"></i>03:38 AM
                  </span>
                </div>
                <p>
                  Lorem Ipsum available, but the majority have suffered
                  alteration in some form, by injected humour, or randomised
                  words Mirum est notare quam littera gothica, quam nunc putamus
                  parum claram, anteposuerit litterarum formas
                </p>
                <Link href="#">
                  <i className="fa fa-reply"></i>replay
                </Link>
              </div>
            </div>
          </div>

          <div className="single-comments left">
            <div className="main">
              <div className="head">
                <Image src={AuthorImg2} alt="#" width={455} height={455} />
              </div>
              <div className="body">
                <h4>Naimur Rahman</h4>
                <div className="comment-meta">
                  <span className="meta">
                    <i className="fa fa-calendar"></i>March 05, 2019
                  </span>
                  <span className="meta">
                    <i className="fa fa-clock-o"></i>03:38 AM
                  </span>
                </div>
                <p>
                  Lorem Ipsum available, but the majority have suffered
                  alteration in some form, by injected humour, or randomised
                  words Mirum est notare quam littera gothica, quam nunc putamus
                  parum claram, anteposuerit litterarum formas
                </p>
                <Link href="#">
                  <i className="fa fa-reply"></i>replay
                </Link>
              </div>
            </div>
          </div>

          <div className="single-comments">
            <div className="main">
              <div className="head">
                <Image src={AuthorImg3} alt="#" width={455} height={455} />
              </div>
              <div className="body">
                <h4>Suriya Molharta</h4>
                <div className="comment-meta">
                  <span className="meta">
                    <i className="fa fa-calendar"></i>March 05, 2019
                  </span>
                  <span className="meta">
                    <i className="fa fa-clock-o"></i>03:38 AM
                  </span>
                </div>
                <p>
                  Lorem Ipsum available, but the majority have suffered
                  alteration in some form, by injected humour, or randomised
                  words Mirum est notare quam littera gothica, quam nunc putamus
                  parum claram, anteposuerit litterarum formas
                </p>
                <Link href="#">
                  <i className="fa fa-reply"></i>replay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
