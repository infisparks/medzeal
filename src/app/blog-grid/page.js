"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import BlogSidebar from "@/components/BlogSidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Header from "@/components/Header/Header";
import { db } from "../../lib/firebaseConfig"; 
import { ref, onValue } from "firebase/database";
import DOMPurify from "dompurify";

export default function BlogGrid() {
  const [blogs, setBlogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(6);

  useEffect(() => {
    const blogRef = ref(db, 'blogs');
    onValue(blogRef, (snapshot) => {
      const data = snapshot.val();
      const blogList = [];
      for (let id in data) {
        blogList.push({ id, ...data[id] });
      }
      setBlogs(blogList);
    });
  }, []);

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = blogs.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(blogs.length / postsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Function to remove HTML tags
  const stripHtmlTags = (html) => {
    return html.replace(/<\/?[^>]+(>|$)/g, "");
  };

  return (
    <>
      <Header />
      <Breadcrumbs title="Blog Grid" menuText="Blog Grid" />
      <section className="blog grid section">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 col-12">
              <div className="row">
                {currentPosts.map((blog) => (
                  <div key={blog.id} className="col-lg-6 col-md-6 col-12">
                    <Link href={`/blog-single/${blog.id}`}>
                      <div
                        style={{
                          position: "relative",
                          margin: "15px 0",
                          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                          borderRadius: "8px",
                          overflow: "hidden",
                          backgroundColor: "#fff",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: 0,
                            paddingTop: "100%", // 1:1 Aspect Ratio
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={blog.thumbnail}
                            alt={blog.title}
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              width: "auto",
                              height: "100%",
                              maxWidth: "100%",
                              maxHeight: "100%",
                              transform: "translate(-50%, -50%)",
                              objectFit: "contain", // Prevents cropping, maintains aspect ratio
                            }}
                          />
                        </div>
                        <div style={{ padding: "10px", textAlign: "center" }}>
                          <span style={{ fontSize: "14px", color: "#666", display: "block" }}>
                            {blog.date}
                          </span>
                          <h3 style={{ margin: "5px 0", fontSize: "18px" }}>{blog.title}</h3>
                          <p style={{ fontSize: "16px", color: "#333", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {stripHtmlTags(DOMPurify.sanitize(blog.content))}
                          </p>
                          <Link href={`/blog-single/${blog.id}`} style={{ color: "#0070f3" }}>
                            Read More
                          </Link>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
                <div className="col-12">
                  <div className="pagination">
                    <ul className="pagination-list">
                      {Array.from({ length: totalPages }, (_, index) => (
                        <li key={index + 1} className={currentPage === index + 1 ? 'active' : ''}>
                          <Link href="#" onClick={() => paginate(index + 1)}>
                            {index + 1}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link href="#" onClick={() => paginate(currentPage + 1)} disabled={currentPage >= totalPages}>
                          <i className="icofont-rounded-right"></i>
                        </Link>
                      </li>
                    </ul>
                  </div>
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
