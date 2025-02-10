"use client"; 
import React, { useEffect, useState, useMemo } from 'react'; 
import { db } from '../../../lib/firebaseConfig'; 
import { ref, onValue, remove, update } from 'firebase/database'; 
import { FaCheck, FaTrash, FaWhatsapp, FaPhone, FaCalendar, FaClock, FaUser, FaEnvelope, FaSearch, FaCalendarAlt } from 'react-icons/fa'; 

const Approval = () => { 
  const [appointments, setAppointments] = useState(null); 
  const [selectedDate, setSelectedDate] = useState(''); 
  const [selectedMonth, setSelectedMonth] = useState(''); 
  const [selectedYear, setSelectedYear] = useState(''); 
  const [searchTerm, setSearchTerm] = useState(''); 

  useEffect(() => { 
    const appointmentsRef = ref(db, 'appointments'); 
    onValue(appointmentsRef, (snapshot) => { 
      setAppointments(snapshot.val()); 
    }); 
  }, []); 

  const filteredAppointments = useMemo(() => { 
    if (!appointments) return []; 

    const allAppointments = Object.entries(appointments).flatMap(([userId, userAppointments]) => 
      Object.entries(userAppointments).map(([id, details]) => ({ ...details, id, userId })) 
    ); 

    return allAppointments.filter(({ appointmentDate, doctor, message, name, phone, approved }) => { 
      const isDateMatch = selectedDate ? appointmentDate === selectedDate : true; 
      const isMonthMatch = selectedMonth ? appointmentDate.split('-')[1] === selectedMonth : true; 
      const isYearMatch = selectedYear ? appointmentDate.split('-')[0] === selectedYear : true; 
      const isSearchMatch = 
        doctor.toLowerCase().includes(searchTerm.toLowerCase()) || 
        message.toLowerCase().includes(searchTerm.toLowerCase()) || 
        name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        phone.includes(searchTerm); 
      
      return isDateMatch && isMonthMatch && isYearMatch && isSearchMatch && !approved; 
    }); 
  }, [appointments, selectedDate, selectedMonth, selectedYear, searchTerm]); 

  // Removed totalPrice calculation
  // const totalPrice = useMemo(() => { 
  //   return filteredAppointments.reduce((acc, { price }) => acc + price, 0); 
  // }, [filteredAppointments]); 

  const today = new Date().toISOString().split('T')[0]; 

  const handleDelete = (userId, appointmentId) => {
    const confirmed = window.confirm("Do you really want to delete this appointment?");
    if (confirmed) {
      const appointmentRef = ref(db, `appointments/${userId}/${appointmentId}`);
      remove(appointmentRef)
        .then(() => {
          setAppointments((prev) => {
            if (!prev || !prev[userId]) {
              return prev; 
            }
            const updatedAppointments = { ...prev };
            delete updatedAppointments[userId][appointmentId]; 

            if (Object.keys(updatedAppointments[userId]).length === 0) {
              delete updatedAppointments[userId];
            }

            return updatedAppointments;
          });
          alert("Appointment deleted successfully.");
        })
        .catch((error) => {
          console.error("Error deleting appointment:", error);
          alert("Failed to delete the appointment.");
        });
    }
  };

  const handleApprove = async (id, uid, email, appointmentDate, appointmentTime, doctor, name) => { 
    const appointmentRef = ref(db, `appointments/${uid}/${id}`); 

    try {
        await update(appointmentRef, { approved: true });
        
        await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipientEmail: email, 
                appointmentDate, 
                appointmentTime, 
                doctor,
                name // Include name if needed
            }),
        });
        
        alert('Appointment approved and email sent successfully!');
    } catch (error) {
        console.error("Error updating approval:", error);
        alert('Error approving appointment.');
    }
  };

  const handleSendCustomWhatsApp = (phone, name, appointmentDate, appointmentTime, doctor) => {
    const customMessage = `Hello ${name}, your appointment on ${appointmentDate} at ${appointmentTime} with Dr. ${doctor} has been confirmed. Please let us know if you need further assistance.`;
    const whatsappLink = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(customMessage)}`;
    window.open(whatsappLink, '_blank');
  };

  return ( 
    <div className="container mt-5"> 
      <h1 className="display-4 text-center mb-4">Appointments</h1> 

      <div className="mb-4"> 
        <div className="input-group"> 
          <span className="input-group-text"><FaSearch /></span> 
          <input 
            type="text" 
            placeholder="Search by doctor, message, name, or phone" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="form-control" 
          /> 
        </div> 
      </div> 

      <div className="mb-4 row"> 
        <div className="col-md-4 mb-3"> 
          <label className="form-label"><FaCalendar /> Select Date:</label> 
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="form-control" 
          /> 
        </div> 
        <div className="col-md-4 mb-3"> 
          <label className="form-label"><FaCalendarAlt /> Select Month:</label> 
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            className="form-select" 
          > 
            <option value="">All Months</option> 
            {Array.from({ length: 12 }, (_, i) => ( 
              <option key={i} value={String(i + 1).padStart(2, '0')}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option> 
            ))} 
          </select> 
        </div> 
        <div className="col-md-4 mb-3"> 
          <label className="form-label"><FaCalendarAlt /> Select Year:</label> 
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)} 
            className="form-select" 
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
        className="btn btn-primary mb-4" 
      > 
        Today Appointments 
      </button> 

      {/* Removed totalPrice display */}
      {/* <h2 className="h5 mb-4"><FaDollarSign /> Total Price: ${totalPrice}</h2> */} 

      <div className="row"> 
        {filteredAppointments.length > 0 ? ( 
          filteredAppointments.map(({ id, uid, appointmentDate, appointmentTime, doctor, approved, message, name, phone, email }) => ( 
            <div key={id} className="col-md-6 mb-4"> 
              <div className="card shadow-sm border-light hover-shadow"> 
                <div className="card-body"> 
                  <p><strong><FaCalendar /> Date:</strong> {appointmentDate}</p> 
                  <p><strong><FaClock /> Time:</strong> {appointmentTime}</p> 
                  <p><strong><FaUser /> Doctor:</strong> {doctor}</p> 
                  <p><strong>Approved:</strong> {approved ? 'Yes' : 'No'}</p> 
                  <p><strong><FaEnvelope /> Message:</strong> {message}</p>
                  <p><strong><FaEnvelope /> Email:</strong> {email}</p> 
                  <p><strong><FaUser /> Name:</strong> {name}</p> 
                  <p><strong><FaPhone /> Phone:</strong> {phone}</p> 
                  
                  {/* Modern Button Layout */}
                  <div className="btn-group d-flex justify-content-between mt-3">
                    <button onClick={() => handleApprove(id, uid, email, appointmentDate, appointmentTime, doctor, name)} className="btn btn-success btn-sm d-flex align-items-center"> 
                      <FaCheck className="me-2" /> Approve 
                    </button>
                    <button onClick={() => handleDelete(uid, id)} className="btn btn-danger btn-sm d-flex align-items-center"> 
                      <FaTrash className="me-2" /> Delete 
                    </button> 
                    <button onClick={() => handleSendCustomWhatsApp(phone, name, appointmentDate, appointmentTime, doctor)} className="btn btn-warning btn-sm d-flex align-items-center">
                      <FaWhatsapp className="me-2" /> WhatsApp
                    </button>
                    <a href={`tel:${phone}`} className="btn btn-info btn-sm d-flex align-items-center"> 
                      <FaPhone className="me-2" /> Call 
                    </a> 
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
        .hover-shadow:hover { 
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); 
          transition: box-shadow 0.3s ease; 
        } 
        .btn { 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border-radius: 50px; 
          transition: background-color 0.3s ease; 
        } 
        .btn-success { background-color: #28a745; color: white; } 
        .btn-success:hover { background-color: #218838; }
        .btn-danger { background-color: #dc3545; color: white; }
        .btn-danger:hover { background-color: #c82333; }
        .btn-warning { background-color: #ffc107; color: white; }
        .btn-warning:hover { background-color: #e0a800; }
        .btn-info { background-color: #17a2b8; color: white; }
        .btn-info:hover { background-color: #138496; }
        .btn-group { gap: 0.5rem; }
        .btn-sm { padding: 0.5rem 0.75rem; font-size: 0.875rem; }
      `}</style> 
    </div> 
  ); 
}; 

export default Approval;
