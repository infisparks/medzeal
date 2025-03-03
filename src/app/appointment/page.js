"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDatabase, ref, push } from "firebase/database";
import { app } from "@/lib/firebaseConfig";
import Breadcrumbs from "@/components/Breadcrumbs";
import Header from "@/components/Header/Header";
import Popup from "@/components/Popup";
import Select from "react-select";
import { FaUser, FaPhoneAlt, FaClipboardList, FaTags, FaPen } from 'react-icons/fa'; // Icons from react-icons

const physiotherapyServices = [
  { icon: "icofont-physiotherapist", title: "Neuro Physiotherapy", desc: "Specialized physiotherapy for neurological conditions, helping you recover and manage symptoms." },
  { icon: "icofont-physiotherapist", title: "Cardiorespiratory Physiotherapy", desc: "Treatment for respiratory and cardiovascular conditions to improve breathing and heart function." },
  { icon: "icofont-physiotherapist", title: "Sports Therapy", desc: "Therapy to enhance athletic performance and aid in faster recovery from sports injuries." },
  { icon: "icofont-physiotherapist", title: "Speech Therapy", desc: "Therapy designed to address speech and language disorders, improving communication skills." },
  { icon: "icofont-physiotherapist", title: "Paediatric Physiotherapy", desc: "Specialized care focusing on children's physical development and needs." },
  { icon: "icofont-physiotherapist", title: "Orthopaedic Physiotherapy", desc: "Rehabilitation for musculoskeletal injuries, helping you regain strength and mobility." },
  { icon: "icofont-physiotherapist", title: "Post-Op Physiotherapy", desc: "Rehabilitation services following surgery to ensure a smooth and speedy recovery." },
  { icon: "icofont-physiotherapist", title: "Geriatric Physiotherapy", desc: "Physiotherapy focused on improving mobility and quality of life for older adults." },
  { icon: "icofont-physiotherapist", title: "Maternal Physiotherapy", desc: "Comprehensive care for pregnant and postpartum women, promoting recovery and health." },
];

const wellnessServices = [
  { icon: "icofont-massage", title: "Massage Therapy", desc: "Experience relaxing and therapeutic massages to relieve stress and promote wellness." },
  { icon: "icofont-yoga", title: "Yoga", desc: "Join guided yoga sessions for physical and mental well-being, tailored for all skill levels." },
  { icon: "icofont-acupuncture", title: "Acupuncture", desc: "Traditional therapy using acupuncture for pain relief, improved circulation, and healing." },
  { icon: "icofont-nutrition", title: "Clinical Nutrition Counselling", desc: "Get personalized nutrition plans to enhance your health and well-being." },
  { icon: "icofont-vr", title: "VR Therapy", desc: "Innovative virtual reality therapy to help with anxiety, phobias, and mental health." },
  { icon: "icofont-sensory", title: "Sensory Desensitization", desc: "Specialized therapy designed to reduce sensitivity to various stimuli." },
  { icon: "icofont-rehab", title: "De-addiction Programs", desc: "Get support through structured programs to overcome addiction and lead a healthier life." },
  { icon: "icofont-hijama", title: "Hijama Therapy", desc: "Cupping therapy for detoxification, improved circulation, and pain relief." },
  { icon: "icofont-chiropractic", title: "Chiropractic Services", desc: "Manual therapy to promote spinal health and joint mobility." },
];

const serviceOptions = [
  {
    label: "Physiotherapy Services",
    options: physiotherapyServices.map(service => ({
      value: service.title,
      label: service.title,
    })),
  },
  {
    label: "Wellness Services",
    options: wellnessServices.map(service => ({
      value: service.title,
      label: service.title,
    })),
  },
  {
    label: "Other",
    options: [
      {
        value: "other",
        label: "Other (Please Specify)"
      }
    ]
  }
];

export default function Appointment() {
  const router = useRouter();
  const db = getDatabase(app);
  const [userDetails, setUserDetails] = useState({
    name: "",
    phone: "",
    message: "",
    service: null,
    customService: "", // For the "Other" service
    coupon: ""
  });
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate phone: ensure it's exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(userDetails.phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    // Restrict submission to 3 appointments per day
    const today = new Date().toISOString().split("T")[0];
    const countKey = `appointments_${today}`;
    const appointmentCount = localStorage.getItem(countKey);
    if (appointmentCount && parseInt(appointmentCount) >= 3) {
      alert("You have reached the maximum appointment booking limit for today.");
      return;
    }

    const submissionDate = new Date().toLocaleDateString("en-GB"); // e.g. "21/02/2025"
    const submissionTime = new Date().toLocaleTimeString("en-US");  // e.g. "2:48:40 PM"

    const appointmentData = {
      name: userDetails.name,
      phone: userDetails.phone,
      message: userDetails.message,
      service: userDetails.service ? userDetails.service.value : userDetails.customService, // Use custom service if "Other"
      coupon: userDetails.coupon,
      submissionDate,
      submissionTime
    };

    try {
      // Save appointment to Firebase
      await push(ref(db, "userappoinment"), appointmentData);
      const newCount = appointmentCount ? parseInt(appointmentCount) + 1 : 1;
      localStorage.setItem(countKey, newCount);

      // Prepare WhatsApp API payload
      const phoneWithCountryCode = "91" + userDetails.phone;
      const whatsappMessage = `Dear ${userDetails.name}, thank you for booking an appointment at Medzeal Mumbra. We provide expert Physiotherapy and Wellness services to help you recover from injuries and improve mobility. We look forward to serving you.`;
      const whatsappPayload = {
        token: "9958399157",
        number: phoneWithCountryCode,
        message: whatsappMessage
      };

      // Send WhatsApp message via API
      const response = await fetch("https://wa.medblisss.com/send-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(whatsappPayload)
      });

      if (!response.ok) {
        console.error("Failed to send WhatsApp message");
      }

      setPopupMessage(`Dear ${appointmentData.name}, your appointment booking has been successfully sent.`);
      setShowPopup(true);
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert("Failed to book appointment. Please try again.");
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    router.push("/"); // Redirect to the homepage
  };

  return (
    <>
      <Header />
      <Breadcrumbs title="Book Your Appointment" menuText="Appointment" />
      <section className="appointment single-page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10 col-12">
              <div className="appointment-inner bg-light p-4 rounded shadow-sm">
                <div className="title mb-4 text-center">
                  <h3 className="mb-3">Book your appointment</h3>
                  <p>We will confirm your appointment soon</p>
                </div>
                <form className="form" onSubmit={handleSubmit}>
                  <div className="row">
                    {/* Name Input */}
                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="form-group">
                        <label htmlFor="name"><FaUser className="mr-2" /> Name</label>
                        <input
                          name="name"
                          type="text"
                          placeholder="Enter your name"
                          value={userDetails.name}
                          onChange={(e) =>
                            setUserDetails({ ...userDetails, name: e.target.value })
                          }
                          required
                          className="form-control"
                        />
                      </div>
                    </div>
                    {/* Phone Input */}
                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="form-group">
                        <label htmlFor="phone"><FaPhoneAlt className="mr-2" /> Phone</label>
                        <input
                          name="phone"
                          type="text"
                          placeholder="10-digit Phone Number"
                          value={userDetails.phone}
                          onChange={(e) =>
                            setUserDetails({ ...userDetails, phone: e.target.value })
                          }
                          required
                          className="form-control"
                        />
                      </div>
                    </div>
                    {/* Professional Service Dropdown */}
                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="form-group">
                        <label htmlFor="service"><FaClipboardList className="mr-2" /> Service</label>
                        <Select
                          name="service"
                          options={serviceOptions}
                          value={userDetails.service}
                          onChange={(selectedOption) => {
                            if (selectedOption.value === "other") {
                              setUserDetails({ ...userDetails, service: selectedOption, customService: "" });
                            } else {
                              setUserDetails({ ...userDetails, service: selectedOption, customService: "" });
                            }
                          }}
                          placeholder="Select Service"
                          classNamePrefix="react-select"
                          required
                        />
                        {userDetails.service?.value === "other" && (
                          <input
                            type="text"
                            placeholder="Enter your custom service"
                            value={userDetails.customService}
                            onChange={(e) => setUserDetails({ ...userDetails, customService: e.target.value })}
                            className="form-control mt-2"
                          />
                        )}
                      </div>
                    </div>
                    {/* Coupon Code Input */}
                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="form-group">
                        <label htmlFor="coupon"><FaTags className="mr-2" /> Coupon Code</label>
                        <input
                          name="coupon"
                          type="text"
                          placeholder="Coupon Code (optional)"
                          value={userDetails.coupon}
                          onChange={(e) =>
                            setUserDetails({ ...userDetails, coupon: e.target.value })
                          }
                          className="form-control"
                        />
                      </div>
                    </div>
                    {/* Message Input (Optional) */}
                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="form-group">
                        <label htmlFor="message"><FaPen className="mr-2" /> Your Message (Optional)</label>
                        <textarea
                          name="message"
                          placeholder="Enter any additional message"
                          value={userDetails.message}
                          onChange={(e) =>
                            setUserDetails({ ...userDetails, message: e.target.value })
                          }
                          className="form-control"
                        />
                      </div>
                    </div>
                    {/* Submit Button */}
                    <div className="col-lg-12 col-md-12 col-12 text-center">
                      <div className="form-group">
                        <button type="submit" className="btn btn-primary btn-lg w-100">
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
                {showPopup && <Popup message={popupMessage} onClose={closePopup} />}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
