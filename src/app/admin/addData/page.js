"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set, push, get } from "firebase/database";
import { app } from '../../../lib/firebaseConfig';
import WorkHour from '../../appointment/WorkHour';
import Header from "../../../components/Header/Header";
import Breadcrumbs from "../../../components/Breadcrumbs";

const DateInput = ({ selectedDate, onDateChange }) => {
  return (
    <input
      type="date"
      name="date"
      value={selectedDate}
      onChange={onDateChange}
      required
    />
  );
};

export default function Staff() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getDatabase(app);
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    phone: "",
    treatment: "",
    subCategory: "",
    doctor: "",
    appointmentDate: "",
    appointmentTime: "",
    message: "",
  });
  const [searchPhone, setSearchPhone] = useState("");
  const [appointmentUid, setAppointmentUid] = useState("");
  const [doctors, setDoctors] = useState([]); // State to hold doctors

  // Define subcategories
  const subCategories = {
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
      const doctorsRef = ref(db, 'doctors');
      const snapshot = await get(doctorsRef);
      if (snapshot.exists()) {
        const doctorsData = snapshot.val();
        setDoctors(Object.values(doctorsData)); // Set the state with the doctors' data
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchAppointmentByPhone = async () => {
    try {
      const appointmentsRef = ref(db, 'appointments');
      const snapshot = await get(appointmentsRef);

      if (snapshot.exists()) {
        const appointmentsData = snapshot.val();
        let found = false;

        for (const userId in appointmentsData) {
          const userAppointments = appointmentsData[userId];

          for (const appointmentId in userAppointments) {
            const appointment = userAppointments[appointmentId];
            if (appointment.phone === searchPhone) {
              setUserDetails(appointment);
              const appointmentId = appointment.uid;
              setAppointmentUid(appointmentId);
              found = true;
              break;
            }
          }

          if (found) break;
        }

        if (!found) {
          alert("No appointment found for this phone number.");
        }
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const formatTimeTo12Hour = (time) => {
    const [hour, minute] = time.split(':');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12; // Convert to 12-hour format
    return `${formattedHour}:${minute} ${ampm}`;
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
  
    const formData = new FormData(event.target);
    const appointmentData = {
      ...userDetails,
      appointmentDate: formData.get("date"),
      appointmentTime: formatTimeTo12Hour(formData.get("time")), // Convert time to 12-hour format
      message: formData.get("message"),
    };
  
    try {
      if (appointmentUid) {
        const appointmentsRef = ref(db, `appointments/${appointmentUid}`);
        const newAppointmentRef = push(appointmentsRef);
  
        await set(newAppointmentRef, appointmentData);
        alert("Appointment booked successfully!");
  
        // Construct WhatsApp message
        const message = `Hello ${userDetails.name},\n\nYour appointment has been booked successfully! Here are your details:\n- Treatment: ${userDetails.treatment}\n- Service: ${userDetails.subCategory}\n- Doctor: ${userDetails.doctor}\n- Date: ${appointmentData.appointmentDate}\n- Time: ${appointmentData.appointmentTime}\n- Message: ${appointmentData.message}`;
        
        // URL encode the message
        const encodedMessage = encodeURIComponent(message);
        
        // Create WhatsApp link
        const whatsappNumber = userDetails.phone; // Use the phone number provided by the user
        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
  
        // Open WhatsApp link in a new tab
        window.open(whatsappLink, "_blank");
        
      } else {
        alert("No appointment found to update. Please search first.");
      }
    } catch (error) {
      console.error("Error during appointment booking:", error);
      alert("Failed to update appointment. Please try again.");
    }
  };
  

  return (
    <>
      <Header />
      <Breadcrumbs title="Get Your Appointment" menuText="Appointment" />

      <section className="appointment single-page">
        <div className="container">
          <div className="row">
            <div className="col-lg-7 col-md-12 col-12">
              <div className="appointment-inner">
                <div className="title">
                  <h3>Book your appointment</h3>
                  <p>We will confirm your appointment within 2 hours</p>
                </div>
                <div className="search mb-4">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter your phone number"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                    />
                    <button className="btn btn-primary" type="button" onClick={fetchAppointmentByPhone}>
                      Search
                    </button>
                  </div>
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
                            setUserDetails({ ...userDetails, treatment : e.target.value, subCategory: "" }); // Reset subcategory
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
                            {subCategories[userDetails.treatment].map((sub, index) => (
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
                        <DateInput 
                          selectedDate={userDetails.appointmentDate} 
                          onDateChange={(e) => setUserDetails({ ...userDetails, appointmentDate: e.target.value })}
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
                          required
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
