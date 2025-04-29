"use client"; 
import React, { useEffect, useState, useMemo } from 'react'; 
import { db } from '../../../lib/firebaseConfig'; 
import { ref, onValue, remove, update } from 'firebase/database'; 
import { 
  FaCheck, FaTrash, FaWhatsapp, FaPhone, FaCalendar, FaClock, FaUser, 
  FaEnvelope, FaSearch, FaCalendarAlt 
} from 'react-icons/fa'; 

const Approval = () => { 
  const [appointments, setAppointments] = useState(null); 
  const [selectedDate, setSelectedDate] = useState(''); 
  const [selectedMonth, setSelectedMonth] = useState(''); 
  const [selectedYear, setSelectedYear] = useState(''); 
  const [searchTerm, setSearchTerm] = useState(''); 
  // State to hold updates for each appointment (paymentMethod, price, consultantAmount)
  const [appointmentUpdates, setAppointmentUpdates] = useState({});

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

  // Helper to update local state for each appointment's new fields
  const handleUpdateChange = (id, field, value) => {
    setAppointmentUpdates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // New function to send a professional WhatsApp message with review link and offer image
  const sendApprovalWhatsAppMessage = async (phone, name, appointmentDate, appointmentTime, doctor) => {
    const message = `Hello ${name},

Your appointment on ${appointmentDate} at ${appointmentTime} with Dr. ${doctor} has been Done.

Thank you for choosing Medzeal. We always strive for excellence in patient care and your feedback is invaluable. Please take a moment to share your experience by leaving a review here:
https://search.google.com/local/writereview?placeid=ChIJMWEa_L56CEERqw34V0Y4kgo&source=g.page.m.ia._&laa=nmx-review-solicitation-ia2

For further appointments, you can book directly from our website:
https://www.medzeal.in/appointment

Best regards,
Team Medzeal
`;
    
    const payload = {
      token: "99583991572",
      number: `91${phone}`,
      imageUrl: "https://raw.githubusercontent.com/infisparks/images/refs/heads/main/feedback.png",
      caption: message
    };
    
    try {
      await fetch("https://wa.medblisss.com/send-image-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });
    } catch(error) {
      console.error("Error sending approval WhatsApp message:", error);
    }
  };

  const handleApprove = async (id, uid, email, appointmentDate, appointmentTime, doctor, name, phone) => { 
    const appointmentRef = ref(db, `appointments/${uid}/${id}`); 
    const { 
      paymentMethod = "", 
      price = "", 
      consultantAmount,
      addProduct,
      productAmount,
      productDescription
    } = appointmentUpdates[id] || {}; 

    // Validate required payment method
    if (!paymentMethod) {
      alert("Payment method is required.");
      return;
    }

    try {
      await update(appointmentRef, { 
        approved: true, 
        paymentMethod, 
        price: price ? parseFloat(price) : 0, 
        ...(consultantAmount ? { consultantAmount: parseFloat(consultantAmount) } : {}),
        ...(addProduct ? { 
          productAmount: productAmount ? parseFloat(productAmount) : 0,
          ...(productDescription ? { productDescription } : {})
        } : {})
      });
      
      // After approval update, send the professional WhatsApp message
      await sendApprovalWhatsAppMessage(phone, name, appointmentDate, appointmentTime, doctor);

      alert("Appointment approved successfully.");
    } catch (error) {
      console.error("Error updating approval:", error);
      alert('Error approving appointment.');
    }
  };

  const handleSendCustomWhatsApp = (phone, name, appointmentDate, appointmentTime, doctor) => {
    const customMessage = `Hello ${name}, your appointment on ${appointmentDate} at ${appointmentTime} with Dr. ${doctor} has been Done. Please let us know if you need further assistance.`; 
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
              <option key={i} value={String(i + 1).padStart(2, '0')}> 
                {new Date(0, i).toLocaleString('default', { month: 'long' })} 
              </option> 
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

      <div className="row"> 
        {filteredAppointments.length > 0 ? ( 
          filteredAppointments.map(({ id, uid, appointmentDate, appointmentTime, doctor, approved, message, name, phone, email }) => { 
            const vipNumbers = ["9958399157", "8108821353","8907866786","9892804786","7021466707","7738408252","9082232217"]; 
            const isVip = vipNumbers.includes(phone); 
            return ( 
              <div key={id} className="col-md-6 mb-4"> 
                <div className={`card shadow-sm border-light hover-shadow ${isVip ? "vip-card" : ""}`}> 
                  <div className="card-body">
                    <div className="appointment-header mb-3 pb-2 border-bottom">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">{name}</h5>
                        {isVip && <span className="badge bg-warning text-dark">Admin</span>}
                      </div>
                      <p className="text-muted mb-0">{email}</p>
                      <p className="mb-0"><a href={`tel:${phone}`} className="text-decoration-none">{phone}</a></p>
                    </div>
                    
                    <div className="appointment-details mb-3">
                      <div className="row">
                        <div className="col-md-6">
                          <p className="mb-1"><FaCalendar className="me-2 text-primary" /> <strong>Date:</strong> {appointmentDate}</p>
                          <p className="mb-1"><FaClock className="me-2 text-primary" /> <strong>Time:</strong> {appointmentTime}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-1"><FaUser className="me-2 text-primary" /> <strong>Doctor:</strong> {doctor}</p>
                          <p className="mb-1"><span className={`badge ${approved ? 'bg-success' : 'bg-warning'}`}>
                            {approved ? 'Approved' : 'Pending'}
                          </span></p>
                        </div>
                      </div>
                      
                      <div className="message-box mt-2 p-2 bg-light rounded">
                        <p className="mb-0"><FaEnvelope className="me-2 text-primary" /> <strong>Message:</strong> {message}</p>
                      </div>
                    </div>
                    
                    {/* Payment Details Section */}
                    <div className="payment-details-section p-3 mb-3 bg-light rounded border">
                      <h5 className="mb-3 text-primary"><i className="fas fa-money-bill-wave me-2"></i>Payment Details</h5>
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Payment Method:</label>
                          <select 
                            value={appointmentUpdates[id]?.paymentMethod || ""} 
                            onChange={(e) => handleUpdateChange(id, 'paymentMethod', e.target.value)} 
                            className="form-select form-select-sm"
                          >
                            <option value="">Select Payment Method</option>
                            <option value="Cash">Cash</option>
                            <option value="Online">Online</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Price:</label>
                          <input 
                            type="number" 
                            value={appointmentUpdates[id]?.price || ""} 
                            onChange={(e) => handleUpdateChange(id, 'price', e.target.value)} 
                            placeholder="Price" 
                            className="form-control form-control-sm" 
                          />
                        </div>
                      </div>
                      
                      <div className="form-check mb-2">
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          checked={appointmentUpdates[id]?.addConsultant || false} 
                          onChange={(e) => handleUpdateChange(id, 'addConsultant', e.target.checked)} 
                          id={`addConsultant-${id}`}
                        />
                        <label className="form-check-label" htmlFor={`addConsultant-${id}`}>
                          Add Consultant Amount
                        </label>
                      </div>
                      
                      {appointmentUpdates[id]?.addConsultant && (
                        <div className="mb-2">
                          <label className="form-label fw-bold">Consultant Amount:</label>
                          <input 
                            type="number" 
                            value={appointmentUpdates[id]?.consultantAmount || ""} 
                            onChange={(e) => handleUpdateChange(id, 'consultantAmount', e.target.value)} 
                            placeholder="Consultant Amount" 
                            className="form-control form-control-sm" 
                          />
                        </div>
                      )}
                      
                      {/* New Product Entry Feature */}
                      <div className="form-check mb-2 mt-3">
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          checked={appointmentUpdates[id]?.addProduct || false} 
                          onChange={(e) => handleUpdateChange(id, 'addProduct', e.target.checked)} 
                          id={`addProduct-${id}`}
                        />
                        <label className="form-check-label" htmlFor={`addProduct-${id}`}>
                          Add Product Details
                        </label>
                      </div>
                      
                      {appointmentUpdates[id]?.addProduct && (
                        <div className="product-details border-top pt-2">
                          <div className="mb-2">
                            <label className="form-label fw-bold">Product Amount:</label>
                            <input 
                              type="number" 
                              value={appointmentUpdates[id]?.productAmount || ""} 
                              onChange={(e) => handleUpdateChange(id, 'productAmount', e.target.value)} 
                              placeholder="Product Amount" 
                              className="form-control form-control-sm" 
                            />
                          </div>
                          <div className="mb-2">
                            <label className="form-label fw-bold">Product Description (Optional):</label>
                            <textarea 
                              value={appointmentUpdates[id]?.productDescription || ""} 
                              onChange={(e) => handleUpdateChange(id, 'productDescription', e.target.value)} 
                              placeholder="Enter product details..." 
                              className="form-control form-control-sm" 
                              rows="2"
                            ></textarea>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="btn-group d-flex justify-content-between mt-3">
                      <button 
                        onClick={() => handleApprove(id, uid, email, appointmentDate, appointmentTime, doctor, name, phone)} 
                        className="btn btn-success btn-sm d-flex align-items-center"
                      > 
                        <FaCheck className="me-2" /> Approve 
                      </button>
                      <button 
                        onClick={() => handleDelete(uid, id)} 
                        className="btn btn-danger btn-sm d-flex align-items-center"
                      > 
                        <FaTrash className="me-2" /> Delete 
                      </button> 
                      <button 
                        onClick={() => handleSendCustomWhatsApp(phone, name, appointmentDate, appointmentTime, doctor)} 
                        className="btn btn-warning btn-sm d-flex align-items-center"
                      >
                        <FaWhatsapp className="me-2" /> WhatsApp
                      </button>
                      <a href={`tel:${phone}`} className="btn btn-info btn-sm d-flex align-items-center"> 
                        <FaPhone className="me-2" /> Call 
                      </a> 
                    </div>
                  </div> 
                </div> 
              </div> 
            );
          })
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
    transition: all 0.3s ease; 
  } 
  .btn-success { background-color: #28a745; color: white; } 
  .btn-success:hover { background-color: #218838; transform: translateY(-2px); }
  .btn-danger { background-color: #dc3545; color: white; }
  .btn-danger:hover { background-color: #c82333; transform: translateY(-2px); }
  .btn-warning { background-color: #ffc107; color: white; }
  .btn-warning:hover { background-color: #e0a800; transform: translateY(-2px); }
  .btn-info { background-color: #17a2b8; color: white; }
  .btn-info:hover { background-color: #138496; transform: translateY(-2px); }
  .btn-group { gap: 0.5rem; }
  .btn-sm { padding: 0.5rem 0.75rem; font-size: 0.875rem; }

  .card {
    transition: all 0.3s ease;
    border-radius: 10px;
    overflow: hidden;
  }
  
  .card-body {
    padding: 1.5rem;
  }
  
  .payment-details-section {
    background-color: #f8f9fa;
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  
  .payment-details-section:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .form-control:focus, .form-select:focus {
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  
  .message-box {
    background-color: #f8f9fa;
    border-left: 3px solid #007bff;
  }

  /* VIP card styles */
  .vip-card {
    background: linear-gradient(135deg, #ffffff, #fff8e1);
    border: 2px solid #ffd700;
    box-shadow: 0 10px 20px rgba(255, 215, 0, 0.2);
    position: relative;
    overflow: hidden;
  }
  
  .vip-card::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 150px;
    height: 150px;
    background: linear-gradient(135deg, transparent 50%, rgba(255, 215, 0, 0.1) 50%);
    z-index: 0;
  }
  
  .vip-card .card-body {
    position: relative;
    z-index: 1;
  }
  
  .vip-card .badge.bg-warning {
    background-color: #ffd700 !important;
    color: #000 !important;
    font-weight: bold;
    padding: 0.5em 0.8em;
    border-radius: 20px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  
  /* Product details section */
  .product-details {
    animation: fadeIn 0.5s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes shine {
    0% { left: -100%; }
    100% { left: 100%; }
  }
`}</style> 
    </div> 
  ); 
}; 

export default Approval;
