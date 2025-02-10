"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, push, get } from "firebase/database";
import { app } from '../../../lib/firebaseConfig'; // Ensure you import the initialized app
import Breadcrumbs from "@/components/Breadcrumbs";
import Header from "@/components/Header/Header";
import WorkHour from "@/app/appointment/WorkHour";

// Utility function to format time to 12-hour format
const formatTimeTo12Hour = (time) => {
  const [hour, minute] = time.split(':');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12; // Convert to 12-hour format
  return `${formattedHour}:${minute} ${ampm}`;
};

// Function to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Function to get current time in HH:MM format
const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function Staff() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getDatabase(app);
  
  // Initialize userDetails with current date and time
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    phone: "",
    treatment: "",
    subCategory: "",
    doctor: "",
    appointmentDate: getCurrentDate(), // Auto-fetch current date
    appointmentTime: getCurrentTime(), // Auto-fetch current time
    message: "",
  });
  
  const [doctors, setDoctors] = useState([]); // State to hold doctors

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
       "Dermatologist"
    ],
  };

  useEffect(() => {
    fetchDoctors(); // Fetch doctors on component mount
  }, []);

  const fetchDoctors = async () => {
    try {
      const doctorsRef = ref(db, 'doctors'); // Ensure this path matches your Firebase structure
      const snapshot = await get(doctorsRef);
      if (snapshot.exists()) {
        const doctorsData = snapshot.val();
        setDoctors(Object.values(doctorsData)); // Set the state with the doctors' data
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    const formData = new FormData(event.target);
    const treatmentPrices = {
      "Physiotherapy": 200,
      "Wellness Center": 400,
    };
  
    const appointmentData = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      treatment: formData.get("treatment"),
      subCategory: formData.get("subCategory"),
      doctor: formData.get("doctor"),
      appointmentDate: formData.get("date"),
      appointmentTime: formatTimeTo12Hour(formData.get("time")), // Format time here
      message: formData.get("message"),
      price: treatmentPrices[formData.get("treatment")],
      approved: true,
      uid: "test", // Add the uid field here
    };
  
    try {
      const newAppointmentRef = push(ref(db, `appointments/test`)); // Create a unique reference for the appointment
      await set(newAppointmentRef, appointmentData);
      alert("Appointment booked successfully!");
  
      // Construct WhatsApp message
      let message = `Hello ${appointmentData.name},\n\nYour appointment has been booked successfully! Here are your details:\n- Treatment: ${appointmentData.treatment}\n- Service: ${appointmentData.subCategory}\n- Doctor: ${appointmentData.doctor}\n- Date: ${appointmentData.appointmentDate}\n- Time: ${appointmentData.appointmentTime}`;
      
      // Conditionally add message if provided
      if (appointmentData.message && appointmentData.message.trim() !== "") {
        message += `\n- Message: ${appointmentData.message}`;
      }
  
      // URL encode the message
      const encodedMessage = encodeURIComponent(message);
  
      // Create WhatsApp link
      const whatsappNumber = appointmentData.phone; // Use the phone number provided by the user
      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
  
      // Open WhatsApp link in a new tab
      window.open(whatsappLink, "_blank");
      
    } catch (error) {
      console.error("Error during appointment booking:", error);
      alert("Failed to book appointment. Please try again.");
    }
  };
  
  return (
    <>
      <Header />
      <Breadcrumbs title="Get Your Appointment" menuText=" Appointment" />

      <section className="appointment single-page">
        <div className="container">
          <div className="row">
            <div className="col-lg-7 col-md-12 col-12">
              <div className="appointment-inner">
                <div className="title">
                  <h3>Book your appointment</h3>
                  <p>We will confirm your appointment within 2 hours</p>
                </div>
                <form className="form" onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <input
                          name="name"
                          type="text"
                          placeholder="Name"
                          value={userDetails.name}
                          onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <input
                          name="email"
                          type="email"
                          placeholder="Email"
                          value={userDetails.email}
                          onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                          // Removed 'required' attribute
                        />
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <input
                          name="phone"
                          type="text"
                          placeholder="Phone"
                          value={userDetails.phone}
                          onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <select
                          name="treatment"
                          className="form-select"
                          value={userDetails.treatment}
                          onChange={(e) => {
                            setUserDetails({ ...userDetails, treatment: e.target.value, subCategory: "" }); // Reset subcategory
                          }}
                          required
                        >
                          <option value="">Select Treatment</option>
                          <option value="Physiotherapy">Physiotherapy</option>
                          <option value="Wellness Center">Wellness Center</option>
                        </select>
                      </div>
                    </div>
                    {userDetails.treatment && (
                      <div className="col-lg-6 col-md-6 col-12">
                        <div className="form-group">
                          <select
                            name="subCategory"
                            className="form-select"
                            value={userDetails.subCategory}
                            onChange={(e) => setUserDetails({ ...userDetails, subCategory: e.target.value })}
                            required
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
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <select
                          name="doctor"
                          className="form-select"
                          value={userDetails.doctor}
                          onChange={(e) => setUserDetails({ ...userDetails, doctor: e.target.value })}
                          required
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
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <input
                          name="date"
                          type="date"
                          value={userDetails.appointmentDate}
                          onChange={(e) => setUserDetails({ ...userDetails, appointmentDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <input
                          name="time"
                          type="time"
                          placeholder="Time"
                          value={userDetails.appointmentTime}
                          onChange={(e) => setUserDetails({ ...userDetails, appointmentTime: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="form-group">
                        <textarea
                          name="message"
                          placeholder="Write Your Message Here....."
                          value={userDetails.message}
                          onChange={(e) => setUserDetails({ ...userDetails, message: e.target.value })}
                          // Removed 'required' attribute
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-12">
                      <div className="form-group">
                        <div className="button">
                          <button type="submit" className="btn">
                            Book Appointment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-lg-5 col-md-12">
              <WorkHour />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
