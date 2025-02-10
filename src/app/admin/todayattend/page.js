"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebaseConfig";
import { ref, onValue, off } from "firebase/database";
import {
  FaPhoneAlt,
  FaMoneyBillWave,
  FaCreditCard,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaStethoscope,
  FaSyringe,
  FaComments,
  FaFileExport,
} from "react-icons/fa";
import { Spinner, Button } from "react-bootstrap";
import * as XLSX from "xlsx";

const TodayAttendedAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState({});
  const [loading, setLoading] = useState(true);

  // Track total price and consultant amounts separately
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalConsultant, setTotalConsultant] = useState(0);

  useEffect(() => {
    const appointmentsRef = ref(db, "appointments");
    const doctorsRef = ref(db, "doctors");

    // Handler for appointments
    const handleAppointments = (snapshot) => {
      const data = snapshot.val();
      const today = new Date().toISOString().split("T")[0];

      let attendedAppointments = [];
      let totalPrice = 0;
      let totalConsult = 0;

      if (data) {
        // Loop through all appointments and filter today's attended
        Object.entries(data).forEach(([userId, userAppointments]) => {
          Object.entries(userAppointments).forEach(([id, details]) => {
            if (details.attended === true && details.appointmentDate === today) {
              attendedAppointments.push({ ...details, id, userId });

              // Accumulate price
              if (details.price) {
                totalPrice += parseFloat(details.price) || 0;
              }
              // Accumulate consultantAmount if present
              if (details.consultantAmount) {
                totalConsult += parseFloat(details.consultantAmount) || 0;
              }
            }
          });
        });
      }

      // Sort appointments by date/time descending (latest first)
      attendedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate} ${a.appointmentTime}`);
        const dateB = new Date(`${b.appointmentDate} ${b.appointmentTime}`);
        return dateB - dateA; // Descending order
      });

      setAppointments(attendedAppointments);
      setTotalAmount(totalPrice);
      setTotalConsultant(totalConsult);
      setLoading(false);
    };

    // Handler for doctors
    const handleDoctors = (snapshot) => {
      const data = snapshot.val();
      setDoctors(data || {});
    };

    // Attach listeners
    onValue(appointmentsRef, handleAppointments);
    onValue(doctorsRef, handleDoctors);

    // Cleanup
    return () => {
      off(appointmentsRef, "value", handleAppointments);
      off(doctorsRef, "value", handleDoctors);
    };
  }, []);

  const exportToExcel = () => {
    if (appointments.length === 0) {
      alert("No appointments to export.");
      return;
    }

    // Prepare data
    const dataToExport = appointments.map((appointment) => ({
      Name: appointment.name || "N/A",
      Email: appointment.email || "N/A",
      Phone: appointment.phone || "N/A",
      Treatment: appointment.treatment || "N/A",
      Subcategory: appointment.subCategory || "N/A",
      // Try to look up the doctor's name if the 'doctor' is a key in 'doctors'
      Doctor: doctors[appointment.doctor]?.name || appointment.doctor || "N/A",
      Date: appointment.appointmentDate || "N/A",
      Time: appointment.appointmentTime || "N/A",
      Payment_Method: appointment.paymentMethod || "N/A",
      Amount_Paid:
        appointment.price !== undefined && appointment.price !== null
          ? `RS ${appointment.price}`
          : "N/A",
      Consultant_Amount:
        appointment.consultantAmount !== undefined &&
        appointment.consultantAmount !== null
          ? `RS ${appointment.consultantAmount}`
          : "N/A",
      Message: appointment.message || "N/A",
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attended Appointments");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Create Blob from buffer
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    // Create download link
    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Attended_Appointments_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      {/* Header and Export Button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="display-4">Today Attended Appointments</h1>
        <Button
          variant="success"
          onClick={exportToExcel}
          className="d-flex align-items-center"
        >
          <FaFileExport className="me-2" />
          Export to Excel
        </Button>
      </div>

      {/* Totals */}
      <div className="mb-3">
        <h5>
          Total Amount:{" "}
          <span className="text-primary">
            RS {totalAmount.toFixed(2)}
          </span>
        </h5>
        <h5>
          Total Consultant Amount:{" "}
          <span className="text-primary">
            RS {totalConsultant.toFixed(2)}
          </span>
        </h5>
      </div>

      {/* Appointments List */}
      {appointments.length > 0 ? (
        <div className="row">
          {appointments.map(
            ({
              id,
              userId,
              appointmentDate,
              appointmentTime,
              doctor,
              message,
              name,
              phone,
              treatment,
              subCategory,
              price,
              paymentMethod,
              consultantAmount,
            }) => (
              <div key={id} className="col-lg-4 col-md-6 mb-4">
                <div className="card shadow-sm border-light h-100">
                  <div className="card-body d-flex flex-column">
                    {/* Appointment Title */}
                    <h5 className="card-title">
                      <FaUser className="me-2 text-primary" />
                      {name || "N/A"}
                    </h5>
                    {/* Subcategory */}
                    <p className="card-text mb-1">
                      <FaSyringe className="me-2 text-success" />
                      <strong>Subcategory:</strong> {subCategory || "N/A"}
                    </p>
                    {/* Phone */}
                    <p className="card-text mb-1">
                      <FaPhoneAlt className="me-2 text-warning" />
                      <strong>Phone:</strong> {phone || "N/A"}
                    </p>
                    {/* Date */}
                    <p className="card-text mb-1">
                      <FaCalendarAlt className="me-2 text-secondary" />
                      <strong>Date:</strong> {appointmentDate || "N/A"}
                    </p>
                    {/* Time */}
                    <p className="card-text mb-1">
                      <FaClock className="me-2 text-info" />
                      <strong>Time:</strong> {appointmentTime || "N/A"}
                    </p>
                    {/* Doctor */}
                    <p className="card-text mb-1">
                      <FaStethoscope className="me-2 text-danger" />
                      <strong>Doctor:</strong>{" "}
                      {doctors[doctor]?.name || doctor || "N/A"}
                    </p>
                    {/* Message */}
                    <p className="card-text mb-1">
                      <FaComments className="me-2 text-muted" />
                      <strong>Message:</strong> {message || "N/A"}
                    </p>
                    {/* Treatment */}
                    <p className="card-text mb-3 mt-auto">
                      <strong>Treatment:</strong> {treatment || "N/A"}
                    </p>
                    {/* Show Consultant Amount if available */}
                    {consultantAmount && (
                      <p className="card-text mb-1">
                        <FaMoneyBillWave className="me-2 text-dark" />
                        <strong>Consultant Amount:</strong>{" "}
                        {`RS ${consultantAmount}`}
                      </p>
                    )}
                    {/* Amount and Payment Method */}
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <span className="badge bg-primary">
                        {price !== undefined && price !== null
                          ? `RS ${price}`
                          : "N/A"}
                      </span>
                      <span>
                        <strong>Payment:</strong> {paymentMethod || "N/A"}{" "}
                        {paymentMethod === "Cash" ? (
                          <FaMoneyBillWave
                            className="text-success"
                            title="Cash Payment"
                          />
                        ) : paymentMethod === "Online" ? (
                          <FaCreditCard
                            className="text-primary"
                            title="Online Payment"
                          />
                        ) : null}
                      </span>
                    </div>
                    {/* Call Button */}
                    <a
                      href={`tel:${phone}`}
                      className="btn btn-outline-info mt-3 w-100"
                    >
                      <FaPhoneAlt className="me-2" />
                      Call
                    </a>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="text-center text-muted">
          <p>No attended appointments found for today.</p>
        </div>
      )}

      {/* Scoped Styles */}
      <style jsx>{`
        .card {
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        .card-title {
          display: flex;
          align-items: center;
          font-size: 1.25rem;
        }
        .card-text {
          display: flex;
          align-items: center;
          font-size: 0.95rem;
        }
        .badge {
          font-size: 1rem;
        }
        .btn-outline-info {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 768px) {
          .display-4 {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TodayAttendedAppointments;
