"use client";
import { useState } from "react";
import { getDatabase, ref, push } from "firebase/database";
import Select from "react-select";
import { app } from "@/lib/firebaseConfig";
import Image from "next/image";
import ContactImg from "../../../../public/img/contact-img.png";
import SectionHead from "../../../components/SectionHead";

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
    label: "Other",
    options: [{ value: "Other", label: "Other" }],
  },
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
];

export default function Appoinment() {
  const [userDetails, setUserDetails] = useState({
    name: "",
    phone: "",
    service: null,
    coupon: "",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate phone number: ensure it's 10 digits
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

    // Get submission date and time in the desired format
    const submissionDate = new Date().toLocaleDateString("en-GB"); // e.g., "21/02/2025"
    const submissionTime = new Date().toLocaleTimeString("en-US"); // e.g., "2:48:40 PM"

    const appointmentData = {
      name: userDetails.name,
      phone: userDetails.phone,
      service: userDetails.service ? userDetails.service.value : "",
      coupon: userDetails.coupon,
      message: userDetails.message,
      submissionDate,
      submissionTime,
    };

    try {
      const db = getDatabase(app);
      await push(ref(db, "userappoinment"), appointmentData);
      // Increment the appointment count in localStorage
      const newCount = appointmentCount ? parseInt(appointmentCount) + 1 : 1;
      localStorage.setItem(countKey, newCount);

      // Prepare payload for WhatsApp API
      const phoneWithCountryCode = "91" + userDetails.phone; // Prefix "91" to the 10-digit number
      const apiPayload = {
        token: "9958399157",
        number: phoneWithCountryCode,
        message: `Dear ${userDetails.name}, your appointment has been successfully booked.`,
      };

      // Send WhatsApp message via API
      const response = await fetch("https://wa.medblisss.com/send-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        console.error("Failed to send WhatsApp message");
      }

      alert(`Dear ${appointmentData.name}, your appointment has been successfully booked.`);
      // Optionally reset the form after submission
      setUserDetails({
        name: "",
        phone: "",
        service: null,
        coupon: "",
        message: "",
      });
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert("Failed to book appointment. Please try again.");
    }
  };

  return (
    <>
      <section className="appointment">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <SectionHead
                title="We Are Always Ready to Help You. Book An Appointment"
                desc="Fill in your details below to book your appointment."
              />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-12 col-12">
              <form className="form" onSubmit={handleSubmit}>
                <div className="row">
                  {/* Name Input */}
                  <div className="col-lg-6 col-md-6 col-12">
                    <div className="form-group">
                      <input
                        name="name"
                        type="text"
                        placeholder="Name"
                        value={userDetails.name}
                        onChange={(e) =>
                          setUserDetails({ ...userDetails, name: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  {/* Phone Input */}
                  <div className="col-lg-6 col-md-6 col-12">
                    <div className="form-group">
                      <input
                        name="phone"
                        type="text"
                        placeholder="10-digit Phone Number"
                        value={userDetails.phone}
                        onChange={(e) =>
                          setUserDetails({ ...userDetails, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  {/* Service Dropdown */}
                  <div className="col-lg-12 col-md-12 col-12">
                    <div className="form-group">
                      <Select
                        name="service"
                        options={serviceOptions}
                        value={userDetails.service}
                        onChange={(selectedOption) =>
                          setUserDetails({ ...userDetails, service: selectedOption })
                        }
                        placeholder="Select Service"
                        classNamePrefix="react-select"
                        required
                      />
                    </div>
                  </div>
                  {/* Coupon Code Input (Optional) */}
                  <div className="col-lg-12 col-md-12 col-12">
                    <div className="form-group">
                      <input
                        name="coupon"
                        type="text"
                        placeholder="Coupon Code (optional)"
                        value={userDetails.coupon}
                        onChange={(e) =>
                          setUserDetails({ ...userDetails, coupon: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  {/* Message Input (Optional) */}
                  <div className="col-lg-12 col-md-12 col-12">
                    <div className="form-group">
                      <textarea
                        name="message"
                        placeholder="Your Message (optional)"
                        value={userDetails.message}
                        onChange={(e) =>
                          setUserDetails({ ...userDetails, message: e.target.value })
                        }
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-5 col-md-4 col-12">
                    <div className="form-group">
                      <div className="button">
                        <button type="submit" className="btn">
                          Book An Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-7 col-md-8 col-12">
                    <p>(We will confirm your booking via a text message)</p>
                  </div>
                </div>
              </form>
            </div>
            <div className="col-lg-6 col-md-12">
              <div className="appointment-image">
                <Image src={ContactImg} alt="Contact Image" width={522} height={523} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
