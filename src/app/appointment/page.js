"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set, push, get } from "firebase/database";
import { app } from '@/lib/firebaseConfig';
import Breadcrumbs from "@/components/Breadcrumbs";
import WorkHour from "./WorkHour";  // Import the WorkHour component
import Header from "@/components/Header/Header";
import Popup from "@/components/Popup";

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

export default function Appointment() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getDatabase(app);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    phone: "",
    treatment: "",
    subService: "",
    doctor: "",
    appointmentDate: "",
    appointmentTime: "",
    message: "",
  });

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  // Define sub-services
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setIsLoggedIn(true);
        fetchUserDetails(user.uid);
      }
    });

    fetchDoctors();

    const params = new URLSearchParams(window.location.search);
    const uid = params.get('uid'); // Extract UID from URL
    if (uid) {
      fetchDoctorById(uid);
    }

    const currentDate = new Date();
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    const formattedNextDate = nextDate.toISOString().split("T")[0];
    const currentHours = String(currentDate.getHours()).padStart(2, '0');
    const currentMinutes = String(currentDate.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;

    setUserDetails((prevDetails) => ({
      ...prevDetails,
      appointmentDate: formattedNextDate,
      appointmentTime: currentTime,
    }));

    return () => unsubscribe();
  }, [auth, router]);

  const fetchUserDetails = async (uid) => {
    try {
      const userRef = ref(db, `users/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setUserDetails(snapshot.val());
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const doctorsRef = ref(db, 'doctors');
      const snapshot = await get(doctorsRef);
      if (snapshot.exists()) {
        const allDoctors = snapshot.val();
        // Convert to an array of objects including the uid
        setDoctors(Object.entries(allDoctors).map(([uid, data]) => ({ uid, ...data })));
        setFilteredDoctors(Object.entries(allDoctors).map(([uid, data]) => ({ uid, ...data })));
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };
  

  const fetchDoctorById = async (uid) => {
    try {
      const doctorRef = ref(db, `doctors/${uid}`);
      const snapshot = await get(doctorRef);
      if (snapshot.exists()) {
        const doctor = snapshot.val();
        setUserDetails(prevDetails => ({
          ...prevDetails,
          treatment: doctor.role,
          doctor: doctor.name,
        }));
        handleTreatmentChange({ target: { value: doctor.role } });
      }
    } catch (error) {
      console.error("Error fetching doctor details:", error);
    }
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const treatmentPrices = {
      "Physiotherapy": 200,
      "Wellness Center": 400,
    };
    
    const currentDate = new Date();
    const formattedSubmissionDate = currentDate.toLocaleDateString("en-GB", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    
    const time = formData.get("time");
    const [hour, minute] = time.split(":");
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedSubmissionTime = `${(hour % 12 || 12)}:${minute} ${ampm}`;
    
    const appointmentData = {
      uid: auth.currentUser.uid,
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      treatment: formData.get("treatment"),
      subService: formData.get("subService"),
      doctor: formData.get("doctor"), // This should now be the doctor's UID
      appointmentDate: formData.get("date"),
      appointmentTime: formattedSubmissionTime,
      message: formData.get("message"),
      price: treatmentPrices[formData.get("treatment")],
      approved: false,
      submissionDate: formattedSubmissionDate,
      submissionTime: formattedSubmissionTime,
    };
  
    const user = auth.currentUser;
  
    if (user) {
      try {
        await set(ref(db, `users/${user.uid}`), {
          name: appointmentData.name,
          phone: appointmentData.phone,
          email: appointmentData.email,
          uid: user.uid,
        });
  
        await push(ref(db, `appointments/${user.uid}`), appointmentData);
        setPopupMessage(`Dear ${userDetails.name}, your appointment booking has been successfully sent to ${appointmentData.doctor}. Please wait for approval.`);
        setShowPopup(true);
      } catch (error) {
        console.error("Error saving appointment:", error);
        alert("Failed to book appointment. Please try again.");
      }
    }
  };
  
  const handleTreatmentChange = (e) => {
    const selectedTreatment = e.target.value;
    const selectedDoctors = Object.values(doctors).filter(doctor => doctor.role === selectedTreatment);
  
    setFilteredDoctors(selectedDoctors);
    
    // Set the default doctor to the first doctor in the filtered list, if any
    const defaultDoctor = selectedDoctors.length > 0 ? selectedDoctors[0].name : "";
    
    setUserDetails({
      ...userDetails,
      treatment: selectedTreatment,
      subService: "",
      doctor: defaultDoctor,
    });
  };
  
  const handleSubServiceChange = (e) => {
    setUserDetails({
      ...userDetails,
      subService: e.target.value,
    });
  };

  const handleDoctorChange = (e) => {
    setUserDetails({
      ...userDetails,
      doctor: e.target.value,
    });
  };

  const closePopup = () => {
    setShowPopup(false);
    router.push("/"); // Redirect to the homepage
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
                          required
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
                    <div className="col-lg-6 col-md-6 col-12 mb-3">
                      <select
                        name="treatment"
                        value={userDetails.treatment}
                        onChange={handleTreatmentChange}
                        className="form-select"
                        required
                      >
                        <option value="" disabled>
                          Select Treatment
                        </option>
                        <option value="Physiotherapy">Physiotherapy</option>
                        <option value="Wellness Center">Wellness Center</option>
                      </select>
                    </div>

                    {userDetails.treatment && subServices[userDetails.treatment] && (
                      <div className="col-lg-6 col-md-6 col-12 mb-3">
                        <select
                          name="subService"
                          value={userDetails.subService}
                          onChange={handleSubServiceChange}
                          className="form-select"
                          required
                        >
                          <option value="" disabled>
                            Select Sub-Service
                          </option>
                          {subServices[userDetails.treatment].map((subService, index) => (
                            <option key={index} value={subService}>
                              {subService}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

<div className="col-lg-6 col-md-6 col-12 mb-3">
  <select
    name="doctor"
    value={userDetails.doctor}
    onChange={handleDoctorChange}
    className="form-select"
    required
  >
    <option value="" disabled>
      Select Doctor
    </option>
    {filteredDoctors.map((doctor, index) => (
     <option key={index} value={doctor.uid}> {/* Use doctor.uid as the value */}
     {doctor.name}
   </option>
    ))}
  </select>
</div>

                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <DateInput
                          selectedDate={userDetails.appointmentDate}
                          onDateChange={(e) =>
                            setUserDetails({ ...userDetails, appointmentDate: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="col-lg-6 col-md-6 col-12">
                      <div className="form-group">
                        <input
                          name="time"
                          type="time"
                          value={userDetails.appointmentTime}
                          onChange={(e) =>
                            setUserDetails({ ...userDetails, appointmentTime: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="form-group">
                        <textarea
                          name="message"
                          placeholder="Your Message"
                          value={userDetails.message}
                          onChange={(e) =>
                            setUserDetails({ ...userDetails, message: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="col-lg-12 col-md-12 col-12">
                      <div className="form-group">
                        <button type="submit" className="btn btn-primary">
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {showPopup && (
                  <Popup message={popupMessage} onClose={closePopup} />
                )}
              </div>
            </div>

            {/* WorkHour component on the right side */}
            <div className="col-lg-5 col-md-12 col-12">
              <WorkHour />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
