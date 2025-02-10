"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebaseConfig"; 
import { ref, push, onValue, remove } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import dynamic from "next/dynamic";
import Header from "@/components/Header/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import "react-quill/dist/quill.snow.css"; // Import Quill styles
import imageCompression from "browser-image-compression"; // Image compression
import Modal from "react-bootstrap/Modal"; // Import Bootstrap Modal
import Button from "react-bootstrap/Button"; // Import Bootstrap Button

// Dynamically import Quill to prevent SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function Blog() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({});
  
  const storage = getStorage();

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

  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const options = {
          maxSizeMB: 1, // Maximum size in MB
          maxWidthOrHeight: 1280, // Maximum width or height
          useWebWorker: true,
        };
        
        const compressedFile = await imageCompression(file, options);
        setThumbnail(compressedFile);
        const previewUrl = URL.createObjectURL(compressedFile);
        setThumbnailPreview(previewUrl);
      } catch (error) {
        console.error("Error compressing image: ", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!thumbnail) {
      alert("Thumbnail is required!");
      return;
    }

    try {
      const blogRef = ref(db, 'blogs');
      const postDate = new Date().toLocaleDateString();

      // Upload to Firebase Storage
      const thumbnailStorageRef = storageRef(storage, `thumbnails/${Date.now()}_${thumbnail.name}`);
      await uploadBytes(thumbnailStorageRef, thumbnail);
      const thumbnailUrl = await getDownloadURL(thumbnailStorageRef);

      const newBlog = {
        title,
        content,
        date: postDate,
        thumbnail: thumbnailUrl,
      };

      await push(blogRef, newBlog);
      alert('Blog post created successfully!');
      resetForm();
    } catch (error) {
      console.error("Error saving blog: ", error);
      alert('There was an error creating your blog post.');
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setThumbnail(null);
    setThumbnailPreview(null);
  };

  const handleDelete = async (id) => {
    const blogRef = ref(db, `blogs/${id}`);
    await remove(blogRef);
    alert("Blog post deleted successfully!");
  };

  const handlePreview = () => {
    setPreviewData({ title, content, thumbnail: thumbnailPreview });
    setShowPreview(true);
  };

  return (
    <>
      <Header />
      <Breadcrumbs title="Blog" menuText="Create or View Blog Posts" />
      <div className="container mt-4">
        <h2 className="mb-4">Create a Blog Post</h2>
        <form onSubmit={handleSubmit} className="mb-5">
          <div className="mb-3">
            <label htmlFor="thumbnail" className="form-label">Thumbnail (Image)</label>
            <input
              type="file"
              id="thumbnail"
              className="form-control"
              accept="image/*"
              onChange={handleThumbnailChange}
              required
            />
            {thumbnailPreview && (
              <img src={thumbnailPreview} alt="Thumbnail Preview" className="img-fluid mt-3" />
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">Title</label>
            <input
              type="text"
              id="title"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="content" className="form-label">Content</label>
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={{
                toolbar: [
                  [{ header: [1, 2, false] }],
                  ['bold', 'italic', 'underline'],
                  ['image', 'blockquote', 'code-block'],
                  ['clean'], // Remove formatting button
                ],
              }}
              theme="snow"
            />
          </div>
          <button type="button" className="btn btn-secondary" onClick={handlePreview}>Preview</button>
          <button type="submit" className="btn btn-primary ms-2">Publish</button>
        </form>

        <h2 className="mt-5">Blog Posts</h2>
        {blogs.map((blog) => (
          <div key={blog.id} className="mb-5 border rounded shadow-sm overflow-hidden">
            {blog.thumbnail && (
              <img src={blog.thumbnail} alt="Thumbnail" className="img-fluid" />
            )}
            <div className="p-4">
              <h3 className="mb-3">{blog.title}</h3>
              <p className="text-muted"><small>Posted on: {blog.date}</small></p>
              <div className="content" dangerouslySetInnerHTML={{ __html: blog.content }} />
              <button className="btn btn-danger mt-2" onClick={() => handleDelete(blog.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Preview Blog Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewData.thumbnail && (
            <img src={previewData.thumbnail} alt="Thumbnail Preview" className="img-fluid mb-3" />
          )}
          <h3>{previewData.title}</h3>
          <div className="content" dangerouslySetInnerHTML={{ __html: previewData.content }} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
