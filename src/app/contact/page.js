"use client"
import Breadcrumbs from "@/components/Breadcrumbs";
import Header from "@/components/Header/Header";
import { useState } from "react";
import { db } from '../../lib/firebaseConfig'; 
import { ref, push } from 'firebase/database';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    subscribe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const contactRef = ref(db, 'contacts'); // Adjust the path as needed
      await push(contactRef, formData);
      alert('Your message has been sent successfully!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        subscribe: false,
      });
    } catch (error) {
      console.error("Error saving data: ", error);
      alert('There was an error sending your message.');
    }
  };

  return (
    <>
      <Header />

      <Breadcrumbs title="Contact Us" menuText="Contact Us" />

      <section className="contact-us section">
        <div className="container">
          <div className="inner">
            <div className="row">
              <div className="col-lg-6">
                <div className="contact-us-left">
                  <div id="myMap">
                    <iframe
                      id="gmap_canvas"
                      src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d60300.70967001149!2d73.027695!3d19.160477!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7bf0ae43ce5c7%3A0x8e8a308084276d65!2sMedFord!5e0!3m2!1sen!2sus!4v1728403436733!5m2!1sen!2sus"
                    ></iframe>
                  
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="contact-us-form">
                  <h2>Contact With Us</h2>
                  <p>
                    If you have any questions please feel free to contact us.
                  </p>

                  <form className="form" onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="form-group">
                          <input
                            type="text"
                            name="name"
                            placeholder="Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="form-group">
                          <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="form-group">
                          <input
                            type="text"
                            name="phone"
                            placeholder="Phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="form-group">
                          <input
                            type="text"
                            name="subject"
                            placeholder="Subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="form-group">
                          <textarea
                            name="message"
                            placeholder="Your Message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                          ></textarea>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-group login-btn">
                          <button className="btn" type="submit">
                            Send
                          </button>
                        </div>
                        <div className="checkbox">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="subscribe"
                              checked={formData.subscribe}
                              onChange={handleChange}
                              id="flexCheckDefault"
                            />
                            <label
                              className="form-check-label"
                              htmlFor="flexCheckDefault"
                            >
                              Do you want to subscribe to our Newsletter?
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="contact-info">
            <div className="row">
              <div className="col-lg-4 col-12 ">
                <div className="single-info">
                  <i className="icofont icofont-ui-call"></i>
                  <div className="content">
                    <h3>+91 70441 78786</h3>
                    <p>medzealpcw@gmail.com</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-12 ">
                <div className="single-info">
                  <i className="icofont-google-map"></i>
                  <div className="content">
                    <h3>Bluebells</h3>
                    <p>Mumbra Bypass</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-12 ">
                <div className="single-info">
                  <i className="icofont icofont-wall-clock"></i>
                  <div className="content">
                    <h3>Mon - Sat: 8am - 10pm</h3>
                    <p>Sunday Closed</p>
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
