"use client";
import { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "@/lib/firebaseConfig";

export default function UserAppointmentsList() {
  const [appointments, setAppointments] = useState({});

  useEffect(() => {
    const db = getDatabase(app);
    const appointmentsRef = ref(db, "userappoinment");
    const unsubscribe = onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setAppointments(data);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
        User Appointments
      </h1>
      {Object.keys(appointments).length === 0 ? (
        <p style={{ textAlign: "center" }}>No appointments found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {Object.entries(appointments).map(([id, appointment]) => (
            <div
              key={id}
              style={{
                background: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                padding: "20px",
                transition: "transform 0.2s",
                cursor: "default",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "scale(1.02)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <h2 style={{ marginBottom: "10px", color: "#0070f3" }}>
                {appointment.name}
              </h2>
              <p>
                <strong>Phone:</strong> {appointment.phone}
              </p>
              <p>
                <strong>Service:</strong> {appointment.service}
              </p>
              <p>
                <strong>Message:</strong> {appointment.message}
              </p>
              <p>
                <strong>Date:</strong> {appointment.submissionDate}
              </p>
              <p>
                <strong>Time:</strong> {appointment.submissionTime}
              </p>
              {appointment.coupon && (
                <p>
                  <strong>Coupon:</strong> {appointment.coupon}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
