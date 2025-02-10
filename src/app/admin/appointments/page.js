"use client";
import React, { useEffect, useState, useMemo } from "react";
import { db } from "../../../lib/firebaseConfig";
import { ref, onValue, update, remove } from "firebase/database";
import * as XLSX from "xlsx";

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAppointment, setEditingAppointment] = useState(null);

  // Get the current year dynamically
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const appointmentsRef = ref(db, "appointments");

    const unsubscribe = onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const attendedAppointments = Object.entries(data)
          .flatMap(([key, appointmentGroup]) =>
            Object.entries(appointmentGroup).map(([id, details]) => ({
              ...details,
              id,
              key,
            }))
          )
          .filter(({ approved, attended }) => approved && attended);

        setAppointments(attendedAppointments);
      } else {
        setAppointments([]);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];

    return appointments.filter(
      ({ appointmentDate, doctor, message, name, phone }) => {
        const isDateMatch = selectedDate ? appointmentDate === selectedDate : true;
        const isMonthMatch = selectedMonth
          ? appointmentDate.split("-")[1] === selectedMonth
          : true;
        const isYearMatch = selectedYear
          ? appointmentDate.split("-")[0] === selectedYear
          : true;
        const isSearchMatch =
          doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phone.includes(searchTerm);

        return isDateMatch && isMonthMatch && isYearMatch && isSearchMatch;
      }
    );
  }, [appointments, selectedDate, selectedMonth, selectedYear, searchTerm]);

  // Total Price Calculation
  const totalPrice = useMemo(() => {
    return filteredAppointments.reduce((acc, { price }) => {
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return acc; // Skip if price is not a valid number or zero/negative
      }
      return acc + numericPrice;
    }, 0);
  }, [filteredAppointments]);

  // Total Consultant Amount Calculation
  const totalConsultant = useMemo(() => {
    return filteredAppointments.reduce((acc, { consultantAmount }) => {
      const numericConsultant = parseFloat(consultantAmount);
      if (isNaN(numericConsultant) || numericConsultant <= 0) {
        return acc; // Skip if consultantAmount is not a valid number or zero/negative
      }
      return acc + numericConsultant;
    }, 0);
  }, [filteredAppointments]);

  // Today's Date
  const today = new Date().toISOString().split("T")[0];

  // Export to Excel
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredAppointments.map((appointment) => ({
        Date: appointment.appointmentDate,
        Time: appointment.appointmentTime,
        Doctor: appointment.doctor,
        Message: appointment.message,
        Price: appointment.price,
        ConsultantAmount: appointment.consultantAmount,
        Name: appointment.name,
        Phone: appointment.phone,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments");

    // Generate and download the Excel file
    XLSX.writeFile(workbook, "appointments.xlsx");
  };

  // Delete Appointment
  const handleDelete = (key, id) => {
    const appointmentRef = ref(db, `appointments/${key}/${id}`);
    remove(appointmentRef)
      .then(() => {
        console.log("Appointment deleted successfully");
      })
      .catch((error) => {
        console.error("Error deleting appointment:", error);
      });
  };

  // Edit Appointment
  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditingAppointment((prevAppointment) => ({
      ...prevAppointment,
      [name]: value,
    }));
  };

  const handleUpdateAppointment = (e) => {
    e.preventDefault();
    const { key, id, ...updatedData } = editingAppointment;
    const appointmentRef = ref(db, `appointments/${key}/${id}`);
    update(appointmentRef, updatedData)
      .then(() => {
        console.log("Appointment updated successfully");
        setEditingAppointment(null);
      })
      .catch((error) => {
        console.error("Error updating appointment:", error);
      });
  };

  return (
    <div className="container mt-5">
      <h1 className="display-4 text-center mb-4">Appointments</h1>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by doctor, message, name, or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      {/* Filter Inputs */}
      <div className="mb-4 row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Select Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="form-select"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={String(i + 1).padStart(2, "0")}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Select Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="form-select"
          >
            <option value="">All Years</option>
            {Array.from({ length: 10 }, (_, i) => {
              const year = currentYear - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Today's Appointments Button */}
      <button onClick={() => setSelectedDate(today)} className="btn btn-primary mb-4">
        Today Appointments
      </button>

      {/* Export to Excel Button */}
      <button onClick={handleExport} className="btn btn-success mb-4 float-end">
        Export to Excel
      </button>

      {/* Totals Display */}
      <h2 className="h5 mb-2">Total Price: ₹{totalPrice.toFixed(2)}</h2>
      <h2 className="h5 mb-4">Total Consultant Amount: ₹{totalConsultant.toFixed(2)}</h2>

      <div className="row">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="col-md-6 mb-4">
              <div className="card shadow-sm border-light hover-shadow">
                <div className="card-body">
                  <p>
                    <strong>Date:</strong> {appointment.appointmentDate}
                  </p>
                  <p>
                    <strong>Time:</strong> {appointment.appointmentTime}
                  </p>
                  <p>
                    <strong>Doctor:</strong> {appointment.doctor}
                  </p>
                  <p>
                    <strong>Message:</strong> {appointment.message}
                  </p>
                  <p>
                    <strong>Price:</strong> ₹{appointment.price}
                  </p>
                  {/* Show Consultant Amount if available */}
                  {appointment.consultantAmount && (
                    <p>
                      <strong>Consultant Amount:</strong> ₹{appointment.consultantAmount}
                    </p>
                  )}
                  <p>
                    <strong>Name:</strong> {appointment.name}
                  </p>
                  <p>
                    <strong>Phone:</strong> {appointment.phone}
                  </p>
                  {/* Edit and Delete Buttons */}
                  <button
                    onClick={() => handleEdit(appointment)}
                    className="btn btn-primary me-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(appointment.key, appointment.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <p className="text-center text-muted">
              No appointments found for the selected criteria.
            </p>
          </div>
        )}
      </div>

      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <h2>Edit Appointment</h2>
              <form onSubmit={handleUpdateAppointment}>
                <div className="mb-3">
                  <label className="form-label">Date:</label>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={editingAppointment.appointmentDate}
                    onChange={handleEditFormChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Time:</label>
                  <input
                    type="time"
                    name="appointmentTime"
                    value={editingAppointment.appointmentTime}
                    onChange={handleEditFormChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Doctor:</label>
                  <input
                    type="text"
                    name="doctor"
                    value={editingAppointment.doctor}
                    onChange={handleEditFormChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Message:</label>
                  <textarea
                    name="message"
                    value={editingAppointment.message}
                    onChange={handleEditFormChange}
                    className="form-control"
                    required
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Price:</label>
                  <input
                    type="number"
                    name="price"
                    value={editingAppointment.price}
                    onChange={handleEditFormChange}
                    className="form-control"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                {/* (Optional) Consultant Amount Field */}
                <div className="mb-3">
                  <label className="form-label">Consultant Amount:</label>
                  <input
                    type="number"
                    name="consultantAmount"
                    value={editingAppointment.consultantAmount || ""}
                    onChange={handleEditFormChange}
                    className="form-control"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={editingAppointment.name}
                    onChange={handleEditFormChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone:</label>
                  <input
                    type="text"
                    name="phone"
                    value={editingAppointment.phone}
                    onChange={handleEditFormChange}
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary me-2">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for hover effect and modal */}
      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          transition: box-shadow 0.3s ease;
        }
        /* Modal styles */
        .modal {
          display: block;
          position: fixed;
          z-index: 1050;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          overflow: auto;
          background-color: rgba(0, 0, 0, 0.5);
        }
        .modal-dialog {
          position: relative;
          margin: 10% auto;
          max-width: 500px;
        }
        .modal-content {
          background-color: #fff;
          padding: 20px;
          border-radius: 5px;
        }
        /* Optional: Scrollbar styling for better UX */
        .modal-content::-webkit-scrollbar {
          width: 8px;
        }
        .modal-content::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default AppointmentsPage;
