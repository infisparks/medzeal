"use client";
import { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
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

      // Sort appointments by date and time in descending order (latest first)
      loadedAppointments.sort((a, b) => {
        // Convert DD/MM/YYYY to a sortable format for accurate sorting
        const partsA = a.submissionDate.split('/');
        const dateA = new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}T${a.submissionTime}`);
        
        const partsB = b.submissionDate.split('/');
        const dateB = new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}T${b.submissionTime}`);
        
        return dateB - dateA;
      });

      setAppointments(loadedAppointments);
    });

    return () => unsubscribe();
  }, []);

  // ✅ FIXED: Effect to apply filters, now handles the DD/MM/YYYY format
  useEffect(() => {
    let result = appointments;

    // 1. Apply search filter
    if (searchTerm) {
      result = result.filter(apt =>
        apt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.service.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Apply date range filter
    if (startDate && endDate) {
      result = result.filter(apt => {
        // apt.submissionDate is in "DD/MM/YYYY" format.
        // We need to convert it to "YYYY-MM-DD" to compare with the filter's dates.
        const parts = apt.submissionDate.split('/'); // e.g., ["23", "08", "2025"]
        if (parts.length !== 3) return false; // Skip if the format is wrong

        // Re-format to "YYYY-MM-DD"
        const formattedSubmissionDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

        // Now the comparison will work correctly!
        return formattedSubmissionDate >= startDate && formattedSubmissionDate <= endDate;
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
                <p><strong>💬 Message:</strong> {appointment.message}</p>
                {appointment.coupon && (
                  <p className="coupon"><strong>🎟️ Coupon:</strong> {appointment.coupon}</p>
                )}
                <div className="dateTime">
                    <span>🗓️ {appointment.submissionDate}</span>
                    <span>⏰ {appointment.submissionTime}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
        .dateTime {
            border-top: 1px solid #e9ecef;
            margin-top: 1rem;
            padding-top: 1rem;
            display: flex;
            justify-content: space-between;
            color: #6c757d;
            font-size: 0.9rem;
        }
        .noResults {
          text-align: center;
          font-size: 1.2rem;
          color: #6c757d;
          padding: 4rem;
          background: #fff;
          border-radius: 12px;
        }
      `}</style>
    </>
  );
}