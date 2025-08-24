"use client";
import { useState, useEffect } from "react";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { app } from "@/lib/firebaseConfig";

export default function UserAppointmentsList() {
  // State for the original, unfiltered list of appointments
  const [appointments, setAppointments] = useState([]);
  // State for the list of appointments that are actually displayed after filtering
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  
  // State for the filter controls
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State for modal visibility and selected appointment data
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalDate, setModalDate] = useState("");
  const [modalTime, setModalTime] = useState("");
  const [modalNote, setModalNote] = useState(""); // New state for the note
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  // Effect to fetch data from Firebase
  useEffect(() => {
    const db = getDatabase(app);
    const appointmentsRef = ref(db, "userappoinment");
    
    const unsubscribe = onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const loadedAppointments = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));

      // Sort appointments by create_at or submissionDate in descending order (latest first)
      loadedAppointments.sort((a, b) => {
        const dateStringA = a.create_at || a.submissionDate;
        const dateStringB = b.create_at || b.submissionDate;

        let dateA, dateB;

        // Determine date format and parse accordingly
        if (dateStringA && dateStringA.includes(',')) {
          const [datePartA, timePartA] = dateStringA.split(', ');
          const [dayA, monthA, yearA] = datePartA.split('/');
          dateA = new Date(`${yearA}-${monthA}-${dayA}T${timePartA}`);
        } else if (dateStringA) {
          const [dayA, monthA, yearA] = dateStringA.split('/');
          dateA = new Date(`${yearA}-${monthA}-${dayA}`);
        } else {
          dateA = new Date(0); // A very old date for missing values
        }
        
        if (dateStringB && dateStringB.includes(',')) {
          const [datePartB, timePartB] = dateStringB.split(', ');
          const [dayB, monthB, yearB] = datePartB.split('/');
          dateB = new Date(`${yearB}-${monthB}-${dayB}T${timePartB}`);
        } else if (dateStringB) {
          const [dayB, monthB, yearB] = dateStringB.split('/');
          dateB = new Date(`${yearB}-${monthB}-${dayB}`);
        } else {
          dateB = new Date(0);
        }
        
        return dateB - dateA;
      });

      setAppointments(loadedAppointments);
    });

    return () => unsubscribe();
  }, []);

  // Effect to apply filters with fallback logic
  useEffect(() => {
    let result = appointments;

    // 1. Apply search filter
    if (searchTerm) {
      result = result.filter(apt =>
        (apt.name && apt.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (apt.phone && apt.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (apt.service && apt.service.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 2. Apply date range filter with create_at fallback
    if (startDate && endDate) {
      result = result.filter(apt => {
        const dateToFilter = apt.create_at || apt.submissionDate;
        
        if (!dateToFilter) return false;

        const datePart = dateToFilter.split(',')[0];
        const parts = datePart.split('/');
        
        if (parts.length !== 3) return false;

        const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

        return formattedDate >= startDate && formattedDate <= endDate;
      });
    }

    setFilteredAppointments(result);
  }, [searchTerm, startDate, endDate, appointments]);

  // --- Helper functions for date buttons ---
  const getFormattedDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleTodayClick = () => {
    const today = getFormattedDate(new Date());
    setStartDate(today);
    setEndDate(today);
  };

  const handleYesterdayClick = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getFormattedDate(yesterday);
    setStartDate(yesterdayStr);
    setEndDate(yesterdayStr);
  };
  
  const handleClearFilters = () => {
      setSearchTerm("");
      setStartDate("");
      setEndDate("");
  };

  // --- Acknowledgment Modal Functions ---

  const handleAcknowledgeClick = (appointment) => {
    setSelectedAppointment(appointment);
    // Use appointmentDate as the primary, with submissionDate as fallback
    const treatmentDate = appointment.appointmentDate || appointment.submissionDate;
    const treatmentTime = appointment.appointmentTime || appointment.submissionTime;
    
    // Convert DD/MM/YYYY to YYYY-MM-DD for the date input
    if (treatmentDate) {
        const [day, month, year] = treatmentDate.split('/');
        setModalDate(`${year}-${month}-${day}`);
    } else {
        setModalDate("");
    }
    // Set the time for the time input
    if (treatmentTime) {
        // Convert "hh:mm:ss am/pm" to "HH:mm" for the time input
        const [timePart, ampm] = treatmentTime.split(' ');
        const [hours, minutes] = timePart.split(':');
        let hours24 = parseInt(hours);
        if (ampm === 'pm' && hours24 < 12) {
            hours24 += 12;
        }
        if (ampm === 'am' && hours24 === 12) {
            hours24 = 0;
        }
        setModalTime(`${String(hours24).padStart(2, '0')}:${minutes}`);
    } else {
        setModalTime("");
    }
    
    // Reset note field
    setModalNote("");

    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedAppointment(null);
    setMessage("");
    setModalNote("");
  };

  const sendAcknowledgement = async () => {
    if (!selectedAppointment) return;

    setIsSending(true);
    setMessage("Sending acknowledgement...");

    try {
        const [year, month, day] = modalDate.split('-');
        const formattedDate = `${day}/${month}/${year}`;

        // Convert 24-hour time to 12-hour format for the message
        const [hours, minutes] = modalTime.split(':');
        const d = new Date();
        d.setHours(hours, minutes, 0);
        const formattedTime = d.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        // Create the professional message with the optional note
        let whatsappMessage = `Hello *${selectedAppointment.name}*,\n\nThis is to confirm your appointment at Medzeal. Below are the details:\n\n*Service:* ${selectedAppointment.service}\n*Confirmed Date:* ${formattedDate}\n*Confirmed Time:* ${formattedTime}\n\n`;

        if (modalNote) {
            whatsappMessage += `*Note:* ${modalNote}\n\n`;
        }

        whatsappMessage += `We look forward to seeing you.\nThank you,\n*Medzeal Team*`;

        // Send the message via WhatsApp API
        const apiResponse = await fetch("https://a.infispark.in/send-text", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: "99583991572",
                number: "91" + selectedAppointment.phone,
                message: whatsappMessage,
            }),
        });

        if (!apiResponse.ok) {
            throw new Error('Failed to send WhatsApp message.');
        }

        // Update Firebase with the new details and acknowledgment status
        const db = getDatabase(app);
        const updates = {};
        updates[`userappoinment/${selectedAppointment.id}/akno`] = true;
        updates[`userappoinment/${selectedAppointment.id}/appointmentDate`] = formattedDate;
        updates[`userappoinment/${selectedAppointment.id}/appointmentTime`] = formattedTime;
        if (modalNote) {
            updates[`userappoinment/${selectedAppointment.id}/acknowledgementNote`] = modalNote;
        }

        await update(ref(db), updates);

        setMessage("Acknowledgement sent and Firebase updated successfully!");
        setTimeout(handleModalClose, 2000);
    } catch (error) {
        console.error("Error sending acknowledgment:", error);
        setMessage("Error: Serjil bhai plz login Medzeal Whatsapp");
    } finally {
        setIsSending(false);
    }
  };


  return (
    <>
      <div className="container">
        <h1 className="title">User Appointments</h1>
        
        {/* Filter Controls */}
        <div className="controls">
            <div className="searchInputWrapper">
                <svg className="searchIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18a8 8 0 1 1 5.657-2.343l3.643 3.643-1.414 1.414-3.643-3.643A7.96 7.96 0 0 1 10 18zM10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"></path></svg>
                <input
                    type="text"
                    placeholder="Search by name, phone, or service..."
                    className="searchInput"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="dateControls">
                <input type="date" className="dateInput" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span className="dateSeparator">to</span>
                <input type="date" className="dateInput" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                <button className="dateButton" onClick={handleTodayClick}>Today</button>
                <button className="dateButton" onClick={handleYesterdayClick}>Yesterday</button>
            </div>
             {(searchTerm || startDate || endDate) && (
                <button className="clearButton" onClick={handleClearFilters}>Clear Filters</button>
            )}
        </div>
        
        <p className="resultsInfo">
            Showing <strong>{filteredAppointments.length}</strong> of <strong>{appointments.length}</strong> appointments.
        </p>

        {filteredAppointments.length === 0 ? (
          <p className="noResults">No appointments match the current filters.</p>
        ) : (
          <div className="grid">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="card">
                <h2 className="cardName">{appointment.name}</h2>
                <p><strong>📞 Phone:</strong> {appointment.phone}</p>
                <p><strong>🛠️ Service:</strong> {appointment.service}</p>
                {appointment.message && (
                    <p><strong>💬 Message:</strong> {appointment.message}</p>
                )}
                {appointment.coupon && (
                  <p className="coupon"><strong>🎟️ Coupon:</strong> {appointment.coupon}</p>
                )}
                
                {/* Display Treatment Date and Time, with a fallback to submissionDate */}
                <div className="treatment-details">
                    <p>
                        <strong>🗓️ Treatment Date:</strong> 
                        {appointment.appointmentDate || appointment.submissionDate || 'N/A'}
                    </p>
                    <p>
                        <strong>⏰ Treatment Time:</strong>
                        {appointment.appointmentTime || appointment.submissionTime || 'N/A'}
                    </p>
                </div>
                
                {/* Display Booked At with fallback logic */}
                <div className="booked-at">
                    <p>
                        <strong>✅ Booked At:</strong>
                        {appointment.create_at
                            ? ` ${appointment.create_at}`
                            : (appointment.submissionDate && appointment.submissionTime
                                ? ` ${appointment.submissionDate} at ${appointment.submissionTime}`
                                : 'N/A')
                        }
                    </p>
                </div>
                <div className="card-actions">
                    <button 
                        className={`acknowledge-button ${appointment.akno ? 'acknowledged' : ''}`}
                        onClick={() => handleAcknowledgeClick(appointment)}
                        disabled={appointment.akno}
                    >
                        {appointment.akno ? 'Acknowledged' : 'Acknowledge'}
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Acknowledge Appointment</h3>
                    <button className="modal-close" onClick={handleModalClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>Confirm the details for **{selectedAppointment.name}** before sending the acknowledgment.</p>
                    <div className="form-group">
                        <label>Treatment Date</label>
                        <input
                            type="date"
                            value={modalDate}
                            onChange={(e) => setModalDate(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Treatment Time</label>
                        <input
                            type="time"
                            value={modalTime}
                            onChange={(e) => setModalTime(e.target.value)}
                        />
                    </div>
                    {/* NEW: Note input field */}
                    <div className="form-group">
                        <label>Add a Note (optional)</label>
                        <textarea
                            rows="3"
                            value={modalNote}
                            onChange={(e) => setModalNote(e.target.value)}
                            placeholder="e.g., Please bring your medical records."
                        ></textarea>
                    </div>
                    {isSending && <p className="status-message">Sending...</p>}
                    {message && <p className="status-message">{message}</p>}
                </div>
                <div className="modal-footer">
                    <button 
                        className="modal-button primary" 
                        onClick={sendAcknowledgement}
                        disabled={isSending}
                    >
                        Send & Confirm
                    </button>
                    <button className="modal-button secondary" onClick={handleModalClose}>Cancel</button>
                </div>
            </div>
        </div>
      )}

      <style jsx>{`
        /* Styles remain the same */
        .container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #f8f9fa;
        }
        .title {
          text-align: center;
          margin-bottom: 2rem;
          color: #212529;
          font-size: 2.5rem;
        }
        .controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          background: #fff;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          margin-bottom: 1.5rem;
        }
        .searchInputWrapper {
            position: relative;
            flex-grow: 1;
            min-width: 250px;
        }
        .searchIcon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 20px;
            height: 20px;
            color: #adb5bd;
        }
        .searchInput {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid #ced4da;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .searchInput:focus {
          outline: none;
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        .dateControls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        .dateInput {
            padding: 10px;
            border: 1px solid #ced4da;
            border-radius: 8px;
            font-size: 0.95rem;
        }
        .dateSeparator {
            color: #6c757d;
        }
        .dateButton {
            padding: 10px 15px;
            border: 1px solid #007bff;
            background-color: #e7f3ff;
            color: #007bff;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s, color 0.2s;
        }
        .dateButton:hover {
            background-color: #007bff;
            color: #fff;
        }
        .clearButton {
            padding: 10px 15px;
            border: 1px solid #dc3545;
            background-color: #f8d7da;
            color: #dc3545;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s, color 0.2s;
            margin-left: auto;
        }
        .clearButton:hover {
            background-color: #dc3545;
            color: #fff;
        }
        .resultsInfo {
            text-align: center;
            color: #6c757d;
            margin-bottom: 2rem;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        .card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          padding: 1.5rem;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          border-left: 5px solid #007bff;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }
        .cardName {
          margin: 0 0 1rem;
          color: #007bff;
          font-size: 1.4rem;
        }
        .card p {
          margin: 0.5rem 0;
          color: #495057;
          line-height: 1.6;
        }
        .card p strong {
            color: #212529;
        }
        .coupon {
            background-color: #e2f5ea;
            color: #155724;
            padding: 0.5rem;
            border-radius: 6px;
            margin-top: 1rem;
        }
        .treatment-details, .booked-at {
            border-top: 1px solid #e9ecef;
            margin-top: 1rem;
            padding-top: 1rem;
            color: #6c757d;
            font-size: 0.9rem;
        }
        .booked-at p {
            margin: 0;
            padding: 0;
        }
        .card-actions {
            margin-top: 1.5rem;
            text-align: right;
        }
        .acknowledge-button {
            padding: 10px 20px;
            background-color: #28a745;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: background-color 0.2s;
        }
        .acknowledge-button:hover:not(:disabled) {
            background-color: #218838;
        }
        .acknowledge-button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
        
        /* Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background: #fff;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            width: 90%;
            max-width: 500px;
            font-family: inherit;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 1rem;
            margin-bottom: 1.5rem;
        }
        .modal-header h3 {
            margin: 0;
            color: #212529;
            font-size: 1.5rem;
        }
        .modal-close {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: #6c757d;
        }
        .modal-body .form-group {
            margin-bottom: 1rem;
        }
        .modal-body label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }
        .modal-body input, .modal-body textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ced4da;
            border-radius: 8px;
            font-size: 1rem;
        }
        .modal-body textarea {
            resize: vertical;
        }
        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e9ecef;
            margin-top: 1.5rem;
        }
        .modal-button {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: background-color 0.2s;
        }
        .modal-button.primary {
            background-color: #007bff;
            color: #fff;
        }
        .modal-button.primary:hover:not(:disabled) {
            background-color: #0056b3;
        }
        .modal-button.secondary {
            background-color: #f8f9fa;
            color: #6c757d;
            border: 1px solid #ced4da;
        }
        .modal-button.secondary:hover {
            background-color: #e2e6ea;
        }
        .modal-button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        .status-message {
            text-align: center;
            font-weight: bold;
            color: #28a745;
            margin-top: 1rem;
        }
      `}</style>
    </>
  );
}
