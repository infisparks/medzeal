"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, push, get } from "firebase/database";
import { app } from "../../../lib/firebaseConfig"; // Ensure you import the initialized app
import Breadcrumbs from "@/components/Breadcrumbs";
import Header from "@/components/Header/Header";
import WorkHour from "@/app/appointment/WorkHour";

const formatTimeTo12Hour = (time) => {
  const [hour, minute] = time.split(":");
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minute} ${ampm}`;
};

const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export default function Staff() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getDatabase(app);

  const initialUserDetails = {
    name: "",
    email: "",
    phone: "",
    treatment: "",
    subCategory: "",
    doctor: "",
    appointmentDate: getCurrentDate(),
    appointmentTime: getCurrentTime(),
    message: "",
  };

  const [userDetails, setUserDetails] = useState(initialUserDetails);
  const [doctors, setDoctors] = useState([]);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const subServices = {
    Physiotherapy: [
      "Neuro Physiotherapy",
      "Cardiorespiratory Physiotherapy",
      "Sports Therapy",
      "Speech Therapy",
      "Paediatric Physiotherapy",
      "Orthopaedic Physiotherapy",
      "Post-Op Physiotherapy",
      "Geriatric Physiotherapy",
      "Maternal Physiotherapy",
    ],
    "Wellness Center": [
      "Massage Therapy",
      "Yoga",
      "Acupuncture",
      "Clinical Nutrition Counselling",
      "VR Therapy",
      "Sensory Desensitization",
      "De-addiction Programs",
      "Hijama Therapy",
      "Chiropractic Services",
      "Dermatologist",
    ],
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const doctorsRef = ref(db, "doctors");
      const snapshot = await get(doctorsRef);
      if (snapshot.exists()) {
        const doctorsData = snapshot.val();
        setDoctors(Object.values(doctorsData));
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setUserDetails({ ...userDetails, email });

    if (email.trim() === "") {
      setEmailError("");
      return;
    }

    // Simple email regex for validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneChange = (e) => {
    const phone = e.target.value;
    // Allow only digits
    if (!/^\d*$/.test(phone)) return;
    setUserDetails({ ...userDetails, phone });
    if (phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits.");
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Check for errors before submission
    if (emailError || phoneError) {
      alert("Please fix the errors in the form before submitting.");
      return;
    }

    const formData = new FormData(event.target);
    const appointmentData = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      treatment: formData.get("treatment"),
      subCategory: formData.get("subCategory"),
      doctor: formData.get("doctor"),
      appointmentDate: formData.get("date"),
      appointmentTime: formatTimeTo12Hour(formData.get("time")),
      message: formData.get("message"),
      approved: false, // Now set to false by default
      attended: true,
      uid: "test",
    };

    try {
      const newAppointmentRef = push(ref(db, `appointments/test`));
      await set(newAppointmentRef, appointmentData);
      alert("Appointment booked successfully!");

      // Construct a professional message for the appointment
      let message = `Dear ${appointmentData.name},\n\nYour appointment has been confirmed. Please find the details below:\n• Treatment: ${appointmentData.treatment}\n• Service: ${appointmentData.subCategory}\n• Doctor: ${appointmentData.doctor}\n• Date: ${appointmentData.appointmentDate}\n• Time: ${appointmentData.appointmentTime}\n\nThank you for choosing our services. We look forward to serving you.`;

      // Append additional details if available
      if (appointmentData.message && appointmentData.message.trim() !== "") {
        message += `\n• Note: ${appointmentData.message}`;
      }
      if (appointmentData.email && appointmentData.email.trim() !== "") {
        message += `\n• Email: ${appointmentData.email}`;
      }

      // Use the API to send a WhatsApp message
      const apiResponse = await fetch("https://wa.medblisss.com/send-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: "99583991572",
          number: "91" + appointmentData.phone, // Prepend country code "91"
          message: message,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error("API call failed");
      }

      // Optionally, handle API response data here if needed
      setUserDetails(initialUserDetails);
    } catch (error) {
      console.error("Error during appointment booking:", error);
      alert("Failed to book appointment. Please try again.");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 15px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "16px",
    transition: "border-color 0.3s, box-shadow 0.3s",
  };

  const selectStyle = {
    ...inputStyle,
    appearance: "none",
    backgroundImage: "url('/icons/select-arrow.svg')", // Optional: Add a custom arrow icon
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 15px center",
    backgroundSize: "12px",
  };

  return (
    <>
      <Header />
      <Breadcrumbs title="Get Your Appointment" menuText=" Appointment" />

      <section
        className="appointment single-page"
        style={{ padding: "60px 0", backgroundColor: "#f9f9f9" }}
      >
        <div className="container">
          <div className="row">
            {/* Form Section */}
            <div className="col-lg-7 col-md-12 col-12">
              <div className="appointment-inner">
                {/* Title */}
                <div className="title" style={{ marginBottom: "30px" }}>
                  <h3
                    style={{
                      color: "#1E3A8A",
                      fontSize: "28px",
                      marginBottom: "10px",
                    }}
                  >
                    Book your appointment
                  </h3>
                  <p style={{ color: "#555555", fontSize: "16px" }}>
                    We will confirm your appointment within 2 hours
                  </p>
                </div>

                {/* User Details Card */}
                <div
                  className="user-details-card"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#333333",
                    padding: "20px",
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    marginBottom: "20px",
                    transition: "transform 0.3s, box-shadow 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 16px rgba(0, 0, 0, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  <h4
                    style={{
                      borderBottom: "2px solid #1E3A8A",
                      paddingBottom: "10px",
                    }}
                  >
                    Appointment Details
                  </h4>
                  <p>
                    <strong>Name:</strong> {userDetails.name || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {userDetails.email || "N/A"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {userDetails.phone || "N/A"}
                  </p>
                  <p>
                    <strong>Treatment:</strong> {userDetails.treatment || "N/A"}
                  </p>
                  <p>
                    <strong>Subcategory:</strong>{" "}
                    {userDetails.subCategory || "N/A"}
                  </p>
                  <p>
                    <strong>Doctor:</strong> {userDetails.doctor || "N/A"}
                  </p>
                  <p>
                    <strong>Date:</strong> {userDetails.appointmentDate || "N/A"}
                  </p>
                  <p>
                    <strong>Time:</strong> {userDetails.appointmentTime || "N/A"}
                  </p>
                  <p>
                    <strong>Message:</strong> {userDetails.message || "N/A"}
                  </p>
                </div>

                {/* Form */}
                <form className="form" onSubmit={handleSubmit}>
                  <div className="row g-4">
                    {/* Name */}
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <label htmlFor="name" className="visually-hidden">
                          Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Name"
                          value={userDetails.name}
                          onChange={(e) =>
                            setUserDetails({ ...userDetails, name: e.target.value })
                          }
                          required
                          style={inputStyle}
                          aria-required="true"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <label htmlFor="email" className="visually-hidden">
                          Email
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Email (Optional)"
                          value={userDetails.email}
                          onChange={handleEmailChange}
                          style={{
                            ...inputStyle,
                            borderColor: emailError ? "#e74c3c" : "#ccc",
                          }}
                          aria-invalid={emailError ? "true" : "false"}
                        />
                        {emailError && (
                          <span style={{ color: "#e74c3c", fontSize: "14px" }}>
                            {emailError}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <label htmlFor="phone" className="visually-hidden">
                          Phone
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="text"
                          placeholder="Phone (10-digit number)"
                          value={userDetails.phone}
                          onChange={handlePhoneChange}
                          required
                          style={{
                            ...inputStyle,
                            borderColor: phoneError ? "#e74c3c" : "#ccc",
                          }}
                          aria-required="true"
                          aria-invalid={phoneError ? "true" : "false"}
                        />
                        {phoneError && (
                          <span style={{ color: "#e74c3c", fontSize: "14px" }}>
                            {phoneError}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Treatment */}
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <label htmlFor="treatment" className="visually-hidden">
                          Treatment
                        </label>
                        <select
                          id="treatment"
                          name="treatment"
                          className="form-select"
                          value={userDetails.treatment}
                          onChange={(e) => {
                            setUserDetails({
                              ...userDetails,
                              treatment: e.target.value,
                              subCategory: "",
                            });
                          }}
                          required
                          style={selectStyle}
                          aria-required="true"
                        >
                          <option value="">Select Treatment</option>
                          <option value="Physiotherapy">Physiotherapy</option>
                          <option value="Wellness Center">Wellness Center</option>
                        </select>
                      </div>
                    </div>

                    {/* Subcategory */}
                    {userDetails.treatment && (
                      <div className="col-lg-6 col-md-6 col-12">
                        <div className="form-group">
                          <label htmlFor="subCategory" className="visually-hidden">
                            Subcategory
                          </label>
                          <select
                            id="subCategory"
                            name="subCategory"
                            className="form-select"
                            value={userDetails.subCategory}
                            onChange={(e) =>
                              setUserDetails({ ...userDetails, subCategory: e.target.value })
                            }
                            required
                            style={selectStyle}
                            aria-required="true"
                          >
                            <option value="">Select Subcategory</option>
                            {subServices[userDetails.treatment].map((sub, index) => (
                              <option key={index} value={sub}>
                                {sub}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Doctor */}
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <label htmlFor="doctor" className="visually-hidden">
                          Doctor
                        </label>
                        <select
                          id="doctor"
                          name="doctor"
                          className="form-select"
                          value={userDetails.doctor}
                          onChange={(e) =>
                            setUserDetails({ ...userDetails, doctor: e.target.value })
                          }
                          required
                          style={selectStyle}
                          aria-required="true"
                        >
                          <option value="">Select Doctor</option>
                          {doctors.map((doctor, index) => (
                            <option key={index} value={doctor.name}>
                              {doctor.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <label htmlFor="date" className="visually-hidden">
                          Date
                        </label>
                        <input
                          id="date"
                          name="date"
                          type="date"
                          value={userDetails.appointmentDate}
                          onChange={(e) =>
                            setUserDetails({
                              ...userDetails,
                              appointmentDate: e.target.value,
                            })
                          }
                          required
                          style={inputStyle}
                          aria-required="true"
                        />
                      </div>
                    </div>

                    {/* Time */}
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <label htmlFor="time" className="visually-hidden">
                          Time
                        </label>
                        <input
                          id="time"
                          name="time"
                          type="time"
                          placeholder="Time"
                          value={userDetails.appointmentTime}
                          onChange={(e) =>
                            setUserDetails({
                              ...userDetails,
                              appointmentTime: e.target.value,
                            })
                          }
                          required
                          style={inputStyle}
                          aria-required="true"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="form-group">
                        <label htmlFor="message" className="visually-hidden">
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          placeholder="Write Your Message Here....."
                          value={userDetails.message}
                          onChange={(e) =>
                            setUserDetails({
                              ...userDetails,
                              message: e.target.value,
                            })
                          }
                          style={{
                            ...inputStyle,
                            resize: "vertical",
                            minHeight: "100px",
                          }}
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="row">
                    <div className="col-12 text-center">
                      <div className="form-group">
                        <button
                          type="submit"
                          className="btn"
                          style={{
                            backgroundColor: "#1E3A8A",
                            color: "#FFFFFF",
                            padding: "12px 25px",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            boxShadow: "0 4px 6px rgba(30, 58, 138, 0.3)",
                            transition:
                              "background-color 0.3s, box-shadow 0.3s, transform 0.2s",
                            fontSize: "16px",
                            fontWeight: "600",
                          }}
                          onMouseOver={(e) => {
                            e.target.style.backgroundColor = "#3B82F6";
                            e.target.style.boxShadow =
                              "0 6px 8px rgba(59, 130, 246, 0.4)";
                            e.target.style.transform = "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor = "#1E3A8A";
                            e.target.style.boxShadow =
                              "0 4px 6px rgba(30, 58, 138, 0.3)";
                            e.target.style.transform = "translateY(0)";
                          }}
                        >
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Work Hours Section */}
            <div className="col-lg-5 col-md-12" style={{ marginTop: "30px" }}>
              <WorkHour />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
