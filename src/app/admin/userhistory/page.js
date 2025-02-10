"use client";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { app } from '../../../lib/firebaseConfig';
import Header from "../../../components/Header/Header";
import Breadcrumbs from "../../../components/Breadcrumbs";

export default function UserHistory() {
  const auth = getAuth(app);
  const db = getDatabase(app);
  const [searchPhone, setSearchPhone] = useState("");
  const [userHistory, setUserHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phoneSuggestions, setPhoneSuggestions] = useState([]);
  
  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      const appointmentsRef = ref(db, 'appointments');
      const snapshot = await get(appointmentsRef);

      if (snapshot.exists()) {
        const appointmentsData = snapshot.val();
        const allPhoneNumbers = new Set();

        for (const userId in appointmentsData) {
          const userAppointments = appointmentsData[userId];

          for (const appointmentId in userAppointments) {
            const appointment = userAppointments[appointmentId];
            if (appointment.phone) {
              allPhoneNumbers.add(appointment.phone);
            }
          }
        }

        setPhoneSuggestions(Array.from(allPhoneNumbers));
      }
    };

    fetchPhoneNumbers();
  }, [db]);

  const fetchUserHistoryByPhone = async () => {
    setLoading(true);
    try {
      const appointmentsRef = ref(db, 'appointments');
      const snapshot = await get(appointmentsRef);

      if (snapshot.exists()) {
        const appointmentsData = snapshot.val();
        let foundAppointments = [];

        for (const userId in appointmentsData) {
          const userAppointments = appointmentsData[userId];

          for (const appointmentId in userAppointments) {
            const appointment = userAppointments[appointmentId];
            if (appointment.phone === searchPhone) {
              foundAppointments.push(appointment);
            }
          }
        }

        if (foundAppointments.length > 0) {
          setUserHistory(foundAppointments);
        } else {
          alert("No appointments found for this phone number.");
          setUserHistory([]);
        }
      }
    } catch (error) {
      console.error("Error fetching user history:", error);
      alert("Failed to fetch user history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    setSearchPhone(e.target.value);
  };

  const handleSuggestionClick = (phone) => {
    setSearchPhone(phone);
    setPhoneSuggestions([]); // Clear suggestions after selection
  };

  const filteredSuggestions = phoneSuggestions.filter(phone =>
    phone.startsWith(searchPhone)
  );

  return (
    <>
      <Header />
      <Breadcrumbs title="User History" menuText="History" />

      <section className="user-history single-page">
        <div className="container">
          <div className="title">
            <h3>User Visit History</h3>
            <p>Enter your phone number to view appointment history.</p>
          </div>
          <div className="search mb-4">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Enter your phone number"
                value={searchPhone}
                onChange={handlePhoneChange}
              />
              <button className="btn btn-primary" type="button" onClick={fetchUserHistoryByPhone}>
                Search
              </button>
            </div>
            {filteredSuggestions.length > 0 && (
              <ul className="suggestions-list">
                {filteredSuggestions.map((phone, index) => (
                  <li key={index} onClick={() => handleSuggestionClick(phone)}>
                    {phone}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {loading && <p>Loading...</p>}

          {userHistory.length > 0 && (
            <div className="history-list">
              <h4>Appointment History</h4>
              <ul>
                {userHistory.map((appointment, index) => (
                  <li key={index}>
                    <p><strong>Name:</strong> {appointment.name}</p>
                    <p><strong>Email:</strong> {appointment.email}</p>
                    <p><strong>Phone:</strong> {appointment.phone}</p>
                    <p><strong>Treatment:</strong> {appointment.treatment}</p>
                    <p><strong>Subcategory:</strong> {appointment.subCategory}</p>
                    <p><strong>Doctor:</strong> {appointment.doctor}</p>
                    <p><strong>Date:</strong> {appointment.appointmentDate}</p>
                    <p><strong>Time:</strong> {appointment.appointmentTime}</p>
                    <p><strong>Message:</strong> {appointment.message}</p>
                    <hr />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .suggestions-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
          border: 1px solid #ccc;
          background-color: white;
          position: absolute;
          z-index: 10;
          width: 100%;
        }
        .suggestions-list li {
          padding: 10px;
          cursor: pointer;
        }
        .suggestions-list li:hover {
          background-color: #f0f0f0;
        }
      `}</style>
    </>
  );
}
