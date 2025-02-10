"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebaseConfig"; 
import { ref, onValue } from "firebase/database";

export default function BlogSidebar() {
  const [recentPosts, setRecentPosts] = useState([]);
  const categories = [
    "Physiotherapy",
    "Rehabilitation",
    "Exercise Therapy",
    "Manual Therapy",
    "Electrotherapy",
  ]; // Updated categories

  useEffect(() => {
    const blogRef = ref(db, 'blogs');
    onValue(blogRef, (snapshot) => {
      const data = snapshot.val();
      const posts = [];
      for (let id in data) {
        posts.push({ id, ...data[id] });
      }
      // Sort posts by date and take the latest three
      const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentPosts(sortedPosts.slice(0, 3));
    });
  }, []);

  return (
    <>
      <div className="main-sidebar">
        <div className="single-widget search">
          <div className="form">
            <input type="text" placeholder="Search Here..." />
            <Link className="button" href="#">
              <i className="fa fa-search"></i>
            </Link>
          </div>
        </div>

        <div className="single-widget category">
          <h3 className="title">Blog Categories</h3>
          <ul className="categor-list">
            {categories.map((category, index) => (
              <li key={index}>
                <Link href="#">{category}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="single-widget recent-post">
          <h3 className="title">Recent Posts</h3>
          {recentPosts.map((post) => (
            <div className="single-post" key={post.id}>
              <div className="image" style={{ position: "relative", width: "100px", height: "100px", overflow: "hidden" }}>
                <Image 
                  src={post.thumbnail} 
                  alt={post.title} 
                  layout="fill" // Fill the parent container
                  objectFit="contain" // Maintain aspect ratio without cropping
                  className="img-fluid" // Ensure responsive behavior
                />
              </div>
              <div className="content">
                <h5>
                  <Link href={`/blog-single/${post.id}`}>{post.title}</Link>
                </h5>
                <ul className="comment">
                  <li>
                    <i className="fa fa-calendar" aria-hidden="true"></i>
                    {new Date(post.date).toLocaleDateString()}
                  </li>
                  <li>
                    <i className="fa fa-commenting-o" aria-hidden="true"></i>
                    {post.commentsCount || 0}
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="single-widget side-tags">
          <h3 className="title">Tags</h3>
          <ul className="tag">
            <li>
              <Link href="#">business</Link>
            </li>
            <li>
              <Link href="#">physiotherapy</Link>
            </li>
            <li>
              <Link href="#">rehabilitation</Link>
            </li>
            <li>
              <Link href="#">exercise therapy</Link>
            </li>
            <li>
              <Link href="#">manual therapy</Link>
            </li>
            <li>
              <Link href="#">electrotherapy</Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
