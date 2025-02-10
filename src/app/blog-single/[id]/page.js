"use client";

import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlogSidebar from "@/components/BlogSidebar";
import { db } from "../../../lib/firebaseConfig"; 
import { ref, onValue } from "firebase/database";
import Header from "@/components/Header/Header";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

export default function BlogSingle({ params }) {
  const { id } = params; // Accessing the route parameter directly
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    if (id) {
      const blogRef = ref(db, `blogs/${id}`);
      onValue(blogRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setBlog(data);
        } else {
          setBlog(null); // Handle case where no data is found
        }
      });
    }
  }, [id]);

  if (!blog) return <p className="text-center">Loading...</p>;

  return (
    <>
      <Header />
      <Breadcrumbs title={blog.title} menuText="Blog Single" />
      <section className="news-single section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-12">
              <div className="single-main mb-4">
                <div className="news-head text-center">
                  {blog.thumbnail && (
                    <div style={{ 
                      width: "100%", 
                      height: "auto", 
                      maxWidth: "557px", 
                      margin: "0 auto",
                      overflow: "hidden"
                    }}>
                      <Image 
                        src={blog.thumbnail} 
                        alt={blog.title} 
                        layout="responsive" // Ensures responsiveness
                        width={557} 
                        height={373} 
                        className="img-fluid rounded"
                        style={{
                          objectFit: "cover", // Ensures image covers the area without distortion
                          width: "100%",
                          height: "auto"
                        }}
                      />
                    </div>
                  )}
                </div>
                <h1 className="news-title text-center my-3">{blog.title}</h1>
                <div className="meta d-flex justify-content-between">
                  <div className="meta-left">
                    {blog.author && (
                      <span className="author">
                        <Link href="#">{blog.author}</Link>
                      </span>
                    )}
                    {blog.date && (
                      <span className="date ms-2">{new Date(blog.date).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="meta-right">
                    {blog.commentsCount !== undefined && (
                      <span className="comments me-2">
                        <Link href="#">
                          <i className="fa fa-comments"></i> {blog.commentsCount} Comments
                        </Link>
                      </span>
                    )}
                    {blog.views !== undefined && (
                      <span className="views">
                        <i className="fa fa-eye"></i> {blog.views} Views
                      </span>
                    )}
                  </div>
                </div>
                <div className="news-text my-4">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content) }} />
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-12">
              <BlogSidebar />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
