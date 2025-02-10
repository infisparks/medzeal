"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../../lib/firebaseConfig';
import { ref, onValue, update } from 'firebase/database';
import { 
  FaPhoneAlt, 
  FaRegCheckCircle, 
  FaRegTimesCircle, 
  FaComments
} from 'react-icons/fa';

const Approval = () => {
  const [appointments, setAppointments] = useState(null);
  const [doctors, setDoctors] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // State to track edited prices and payment methods
  const [editedPrices, setEditedPrices] = useState({});
  const [editedPayments, setEditedPayments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const appointmentsRef = ref(db, 'appointments');
    onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val();
      setAppointments(data);
    });

    // Fetch doctors data
    const doctorsRef = ref(db, 'doctors');
    onValue(doctorsRef, (snapshot) => {
      const data = snapshot.val();
      setDoctors(data);
    });
  }, []);

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];

    const allAppointments = Object.entries(appointments).flatMap(([userId, userAppointments]) =>
      Object.entries(userAppointments).map(([id, details]) => ({ ...details, id, userId }))
    );

    return allAppointments.filter(({ appointmentDate, doctor, message, name, phone, attended }) => {
      const isNotAttended = attended !== true;
      const isDateMatch = selectedDate ? appointmentDate === selectedDate : true;
      const isMonthMatch = selectedMonth ? appointmentDate.split('-')[1] === selectedMonth : true;
      const isYearMatch = selectedYear ? appointmentDate.split('-')[0] === selectedYear : true;
      const isSearchMatch =
        (doctor && doctor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (message && message.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (name && name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (phone && phone.includes(searchTerm));

      return isNotAttended && isDateMatch && isMonthMatch && isYearMatch && isSearchMatch;
    });
  }, [appointments, selectedDate, selectedMonth, selectedYear, searchTerm]);

  const today = new Date().toISOString().split('T')[0];

  // Updated handleAttendance function
  const handleAttendance = async (id, uid, status) => {
    const appointmentRef = ref(db, `appointments/${uid}/${id}`);

    const newPrice = editedPrices[id] !== undefined ? editedPrices[id] : appointments[uid][id].price || '';
    const newPaymentMethod = editedPayments[id] !== undefined ? editedPayments[id] : appointments[uid][id].paymentMethod || 'Cash';

    // Validate price and payment method when marking as attended
    if (status === true) {
      if (newPrice === undefined || newPrice === '') {
        setError("Price cannot be empty.");
        return;
      }

      const priceNumber = parseFloat(newPrice);
      if (isNaN(priceNumber) || priceNumber < 0) {
        setError("Please enter a valid positive number for the price.");
        return;
      }

      if (!["Cash", "Online"].includes(newPaymentMethod)) {
        setError("Invalid payment method selected.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates = { attended: status };
      if (status === true) {
        updates.price = parseFloat(newPrice);
        updates.paymentMethod = newPaymentMethod;
      }
      await update(appointmentRef, updates);
      setSuccess("Appointment updated successfully.");
      setEditedPrices(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      setEditedPayments(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      setError("Failed to update appointment.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const renderAttendanceStatus = (attended) => {
    if (attended === undefined) return <span className="badge bg-warning" title="Pending">Pending</span>;
    return attended ? (
      <span className="badge bg-success" title="Attended"><FaRegCheckCircle /> Attended</span>
    ) : (
      <span className="badge bg-danger" title="Not Attended"><FaRegTimesCircle /> Not Attended</span>
    );
  };

  // Function to render approval status
  const renderApprovalStatus = (approved) => {
    if (approved) {
      return <span className="badge bg-info" title="Approved"><FaRegCheckCircle /> Approved</span>;
    }
    return null;
  };

  // Function to handle price change
  const handlePriceChange = (id, value) => {
    setEditedPrices(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Function to handle payment method change
  const handlePaymentChange = (id, value) => {
    setEditedPayments(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Update the sendFeedback function
  const sendFeedback = (doctorUid) => {
    const doctor = doctors[doctorUid];

    if (doctor) {
      const feedbackLink = `http://medzeal.in/feedback?uid=${doctorUid}`;
      const message = `Hi! Please provide your feedback here: ${feedbackLink}`;
      const phoneNumber = `+${doctor.phone}`;
      const whatsappLink = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      
      window.open(whatsappLink, '_blank');
    } else {
      console.error("Doctor not found for UID:", doctorUid);
      setError("Doctor not found.");
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="display-4 text-center mb-4">Appointments</h1>

      {/* Display success or error messages */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by doctor, message, name, or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control form-control-lg shadow-sm"
        />
      </div>

      <div className="mb-4 row">
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-control shadow-sm"
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Select Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="form-select shadow-sm"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={String(i + 1).padStart(2, '0')}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label fw-bold">Select Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="form-select shadow-sm"
          >
            <option value="">All Years</option>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={2024 - i}>{2024 - i}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => setSelectedDate(today)}
        className="btn btn-primary mb-4 shadow"
      >
        Today Appointments
      </button>

      <div className="row">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(({ id, userId, appointmentDate, appointmentTime, doctor, attended, message, name, phone, treatment, subCategory, price, approved, paymentMethod }) => (
            <div key={id} className="col-md-6 mb-4">
              <div className="card shadow border-0" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4">
                  <h5 className="card-title mb-3">{name}</h5>
                  <ul className="list-group list-group-flush mb-3">
                    <li className="list-group-item px-0 d-flex justify-content-between">
                      <span className="fw-bold">Date:</span> {appointmentDate}
                    </li>
                    <li className="list-group-item px-0 d-flex justify-content-between">
                      <span className="fw-bold">Time:</span> {appointmentTime}
                    </li>
                    <li className="list-group-item px-0 d-flex justify-content-between">
                      <span className="fw-bold">Doctor UID:</span> {doctor}
                    </li>
                    <li className="list-group-item px-0 d-flex justify-content-between">
                      <span className="fw-bold">Treatment:</span> {treatment}
                    </li>
                    <li className="list-group-item px-0 d-flex justify-content-between">
                      <span className="fw-bold">Subcategory:</span> {subCategory || 'N/A'}
                    </li>
                  </ul>
                  
                  {/* Price Section */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Price:</label>
                    <input
                      type="number"
                      value={editedPrices[id] !== undefined ? editedPrices[id] : price || ''}
                      onChange={(e) => handlePriceChange(id, e.target.value)}
                      className="form-control shadow-sm"
                      min="0"
                    />
                  </div>

                  {/* Payment Method Section */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Payment Method:</label>
                    <select
                      value={editedPayments[id] !== undefined ? editedPayments[id] : paymentMethod || 'Cash'}
                      onChange={(e) => handlePaymentChange(id, e.target.value)}
                      className="form-select shadow-sm"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>

                  <p><strong>Attendance Status:</strong> {renderAttendanceStatus(attended)}</p>
                  {approved && (
                    <p><strong>Approval Status:</strong> {renderApprovalStatus(approved)}</p>
                  )}
                  
                  <p><strong>Message:</strong> {message}</p>
                  <p><strong>Phone:</strong> {phone}</p>
                  <div className="d-flex justify-content-between mt-4">
                    <a href={`tel:${phone}`} className="btn  flex-fill me-2 shadow-sm">
                      <FaPhoneAlt className="me-2" /> Call
                    </a>
                    <button onClick={() => handleAttendance(id, userId, true)} className="btn btn-success flex-fill me-2 shadow-sm">
                      <FaRegCheckCircle className="me-2" /> Attend
                    </button>
                    <button onClick={() => handleAttendance(id, userId, false)} className="btn btn-danger flex-fill me-2 shadow-sm">
                      <FaRegTimesCircle className="me-2" /> Not Attend
                    </button>
                    <button onClick={() => sendFeedback(doctor)} className="btn btn-warning flex-fill shadow-sm">
                      <FaComments className="me-2" /> Feedback
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <p className="text-center text-muted">No appointments found for the selected criteria.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .card {
          background-color: #ffffff;
        }
        .card-title {
          color: #333333;
          font-weight: 600;
        }
        .list-group-item {
          border: none;
          padding-left: 0;
          padding-right: 0;
        }
        .form-control, .form-select {
          border-radius: 8px;
        }
        .btn {
          border-radius: 8px;
        }
        .btn-primary {
          background-color: #007bff;
          border-color: #007bff;
        }
        .btn-success {
          background-color: #28a745;
          border-color: #28a745;
        }
        .btn-danger {
          background-color: #dc3545;
          border-color: #dc3545;
        }
        .btn-warning {
          background-color: #ffc107;
          border-color: #ffc107;
        }
        .btn-outline-primary {
          color: #007bff;
          border-color: #007bff;
        }
        .btn-outline-primary:hover {
          background-color: #007bff;
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default Approval;
