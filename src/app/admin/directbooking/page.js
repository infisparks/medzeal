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
  const [previousAppointments, setPreviousAppointments] = useState([]);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  // Controls confetti blast effect
  const [showConfetti, setShowConfetti] = useState(false);

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

  // Define multiple VIP numbers (10-digit strings)
  const VIP_NUMBERS = ["9958399157", "8108821353","8907866786","9892804786","7021466707","7738408252","9082232217"];
  // Check if the entered phone is in the VIP numbers array
  const isVip = VIP_NUMBERS.includes(userDetails.phone);

  // Trigger confetti blast if VIP number is entered
  useEffect(() => {
    if (isVip) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVip]);

  useEffect(() => {
    fetchDoctors();
    fetchPreviousAppointments();
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

  const fetchPreviousAppointments = async () => {
    try {
      const appointmentsRef = ref(db, "appointments/test");
      const snapshot = await get(appointmentsRef);
      if (snapshot.exists()) {
        const appointmentsData = snapshot.val();
        const appointmentsArray = Object.values(appointmentsData);
        setPreviousAppointments(appointmentsArray);
      }
    } catch (error) {
      console.error("Error fetching previous appointments:", error);
    }
  };

  const handleNameChange = (e) => {
    const input = e.target.value;
    setUserDetails({ ...userDetails, name: input });
    if (input.trim() === "") {
      setNameSuggestions([]);
      return;
    }
    const filtered = previousAppointments.filter((appointment) =>
      appointment.name.toLowerCase().startsWith(input.toLowerCase())
    );
    setNameSuggestions(filtered);
  };

  const handleSelectSuggestion = (suggestion) => {
    setUserDetails({
      name: suggestion.name || "",
      email: suggestion.email || "",
      phone: suggestion.phone || "",
      treatment: suggestion.treatment || "",
      subCategory: suggestion.subCategory || "",
      doctor: suggestion.doctor || "",
      appointmentDate: getCurrentDate(),
      appointmentTime: getCurrentTime(),
      message: suggestion.message || "",
    });
    setNameSuggestions([]);
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setUserDetails({ ...userDetails, email });
    if (email.trim() === "") {
      setEmailError("");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneChange = (e) => {
    const phone = e.target.value;
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
      approved: false,
      attended: true,
      uid: "test",
    };

    try {
      // Step 1: Save appointment to Firebase
      const newAppointmentRef = push(ref(db, `appointments/test`));
      await set(newAppointmentRef, appointmentData);
      alert("Appointment booked successfully!");

      // Step 2: Prepare WhatsApp message content
      let message = `Dear ${appointmentData.name},\n\nYour appointment has been confirmed. Please find the details below:\n• Treatment: ${appointmentData.treatment}\n• Service: ${appointmentData.subCategory}\n• Doctor: ${appointmentData.doctor}\n• Date: ${appointmentData.appointmentDate}\n• Time: ${appointmentData.appointmentTime}\n\nThank you for choosing our services. We look forward to serving you.`;

      if (appointmentData.message && appointmentData.message.trim() !== "") {
        message += `\n• Note: ${appointmentData.message}`;
      }
      if (appointmentData.email && appointmentData.email.trim() !== "") {
        message += `\n• Email: ${appointmentData.email}`;
      }

      // Step 3: Send WhatsApp message using the new API
      const whatsappPayload = {
        number: `91${appointmentData.phone}`, // Uses the phone number from the form
        text: message, // Uses the message variable constructed above
      };

      try {
        // This is the new fetch call with the apikey
        const whatsappResponse = await fetch("https://evo.infispark.in/message/sendText/medzeal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Make sure NEXT_PUBLIC_WHATSAPP_API_KEY is set in your .env.local file
            "apikey": process.env.NEXT_PUBLIC_WHATSAPP_API_KEY || ""
          },
          body: JSON.stringify(whatsappPayload),
        });
        
        const whatsappResult = await whatsappResponse.json();
        if (whatsappResponse.ok) {
          console.log("WhatsApp message sent successfully:", whatsappResult);
        } else {
          console.error("Failed to send WhatsApp message:", whatsappResult);
          // Optional: You could alert the user that the WA message failed
        }
      } catch (whatsappError) {
        // This catches errors from the WhatsApp API call only
        console.error("Error sending WhatsApp message:", whatsappError);
      }

      // Step 4: Reset the form (runs even if WA message fails)
      setUserDetails(initialUserDetails);

    } catch (error) {
      // This catch block now primarily handles errors from Firebase
      console.error("Error during appointment booking (Firebase):", error);
      alert("Failed to book appointment. Please try again.");
    }
  };

  // Update input and select styles to include a subtle background tint when VIP is active
  const inputStyle = {
    width: "100%",
    padding: "12px 15px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "16px",
    transition: "border-color 0.3s, box-shadow 0.3s",
    backgroundColor: isVip ? "#fff8dc" : "#fff",
  };

  const selectStyle = {
    ...inputStyle,
    appearance: "none",
    backgroundImage: "url('/icons/select-arrow.svg')",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 15px center",
    backgroundSize: "12px",
  };

  // Style for the appointment details card
  const cardStyle = {
    backgroundColor: isVip ? "transparent" : "#ffffff",
    color: isVip ? "#fff" : "#333333",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: isVip ? "none" : "0 4px 12px rgba(0, 0, 0, 0.1)",
    marginBottom: "20px",
    transition: "transform 0.3s, box-shadow 0.3s",
    position: "relative",
    overflow: "hidden",
  };

  // Style for the entire form container
  const formContainerStyle = {
    background: isVip ? "linear-gradient(45deg, #ffd700, #ffa500)" : "#ffffff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: isVip ? "0 0 20px gold" : "0 4px 12px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s, box-shadow 0.3s",
    position: "relative",
    overflow: "hidden",
  };

  // Define a set of confetti pieces with direction multipliers
  const confettiPieces = [
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
    { x: 0.5, y: 1 },
    { x: -0.5, y: 1 },
    { x: 1, y: 0.5 },
    { x: -1, y: 0.5 },
    { x: 0.5, y: -1 },
    { x: -0.5, y: -1 },
  ];

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
              <div className="appointment-inner" style={formContainerStyle}>
                {/* Title */}
                <div className="title" style={{ marginBottom: "30px" }}>
                  <h3 style={{ color: "#1E3A8A", fontSize: "28px", marginBottom: "10px" }}>
                    Book your appointment
                  </h3>
                  <p style={{ color: "#555555", fontSize: "16px" }}>
                    We will confirm your appointment within 2 hours
                  </p>
                </div>

                {/* Appointment Details Card */}
                <div
                  className={`user-details-card ${isVip ? "vip-card" : ""}`}
                  style={cardStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = isVip
                      ? "none"
                      : "0 8px 16px rgba(0, 0, 0, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isVip
                      ? "none"
                      : "0 4px 12px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  {isVip && <div className="vip-badge">ADMIN</div>}
                  {showConfetti && (
                    <div className="confetti-container">
                      {confettiPieces.map((piece, index) => (
                        <div
                          key={index}
                          className="confetti-piece"
                          style={{
                            "--x": piece.x,
                            "--y": piece.y,
                            animationDelay: `${Math.random() * 0.5}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <h4 style={{ borderBottom: "2px solid #1E3A8A", paddingBottom: "10px" }}>
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
                    <strong>Subcategory:</strong> {userDetails.subCategory || "N/A"}
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
                    {/* Name with Autocomplete */}
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group" style={{ position: "relative" }}>
                        <label htmlFor="name" className="visually-hidden">
                          Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Name"
                          value={userDetails.name}
                          onChange={handleNameChange}
                          required
                          style={inputStyle}
                          className={isVip ? "vip-input" : ""}
                          aria-required="true"
                        />
                        {nameSuggestions.length > 0 && (
                          <ul
                            style={{
                              listStyleType: "none",
                              padding: 0,
                              margin: 0,
                              border: "1px solid #ccc",
                              maxHeight: "150px",
                              overflowY: "auto",
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              backgroundColor: "#fff",
                              zIndex: 1000,
                            }}
                          >
                            {nameSuggestions.map((suggestion, index) => (
                              <li
                                key={index}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                style={{
                                  padding: "8px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid #eee",
                                }}
                              >
                                {suggestion.name} {suggestion.phone ? ` - ${suggestion.phone}` : ""}
                              </li>
                            ))}
                          </ul>
                        )}
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
                          className={isVip ? "vip-input" : ""}
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
                          className={isVip ? "vip-input" : ""}
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
                            setUserDetails({ ...userDetails, appointmentDate: e.target.value })
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
                            setUserDetails({ ...userDetails, appointmentTime: e.target.value })
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
                            setUserDetails({ ...userDetails, message: e.target.value })
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
                            transition: "background-color 0.3s, box-shadow 0.3s, transform 0.2s",
                            fontSize: "16px",
                            fontWeight: "600",
                          }}
                          onMouseOver={(e) => {
                            e.target.style.backgroundColor = "#3B82F6";
                            e.target.style.boxShadow = "0 6px 8px rgba(59, 130, 246, 0.4)";
                            e.target.style.transform = "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor = "#1E3A8A";
                            e.target.style.boxShadow = "0 4px 6px rgba(30, 58, 138, 0.3)";
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
      <style jsx>{`
        .vip-card {
          background: linear-gradient(45deg, #ffd700, #ffa500);
          color: #fff;
          border: 2px solid gold;
          box-shadow: 0 0 20px gold;
        }
        .vip-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent,
            rgba(255, 255, 255, 0.5),
            transparent
          );
          transform: skewX(-30deg);
          animation: shine 2s infinite;
        }
        @keyframes shine {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        .vip-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: gold;
          color: #fff;
          padding: 5px 10px;
          font-weight: bold;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 1001;
        }
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }
        .confetti-piece {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background-color: gold;
          opacity: 0;
          transform: translate(-50%, -50%);
          animation: confetti 1s forwards;
        }
        @keyframes confetti {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(
                calc(-50% + var(--x) * 150px),
                calc(-50% + var(--y) * 150px)
              )
              rotate(720deg);
          }
        }
        /* Shining effect for VIP input fields with a light yellow background */
        .vip-input {
          animation: inputShine 3s infinite;
          border: 2px solid gold !important;
          background-color: #fff8dc;
        }
        @keyframes inputShine {
          0% {
            box-shadow: 0 0 0px rgba(255, 215, 0, 0.8);
          }
          50% {
            box-shadow: 0 0 8px rgba(255, 215, 0, 1);
          }
          100% {
            box-shadow: 0 0 0px rgba(255, 215, 0, 0.8);
          }
        }
      `}</style>
    </>
  );
}
