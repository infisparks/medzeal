"use client";

import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../../lib/firebaseConfig';
import { ref, onValue, off } from 'firebase/database';
import { 
  FaFileDownload, 
  FaMoneyBillWave, 
  FaCreditCard,
  FaClinicMedical
} from 'react-icons/fa';
import { Spinner, Button, Table, Form } from 'react-bootstrap';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TodayAttendedInvoice = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalCash, setTotalCash] = useState(0);
  const [totalOnline, setTotalOnline] = useState(0);
  const [totalConsultant, setTotalConsultant] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const invoiceRef = useRef();

  useEffect(() => {
    // References
    const appointmentsRef = ref(db, 'appointments');
    const doctorsRef = ref(db, 'doctors');

    // Fetch Appointments
    const handleAppointments = (snapshot) => {
      const data = snapshot.val();
      const date = selectedDate;

      const attendedAppointments = [];
      let cashTotal = 0;
      let onlineTotal = 0;
      let consultantTotal = 0;

      if (data) {
        Object.entries(data).forEach(([userId, userAppointments]) => {
          Object.entries(userAppointments).forEach(([id, details]) => {
            if (details.attended === true && details.appointmentDate === date) {
              attendedAppointments.push({ ...details, id, userId });
              if (details.price) {
                const price = parseFloat(details.price);
                if (details.paymentMethod === 'Cash') {
                  cashTotal += price;
                } else if (details.paymentMethod === 'Online') {
                  onlineTotal += price;
                }
              }
              if (details.consultantAmount) {
                const consultantPrice = parseFloat(details.consultantAmount);
                consultantTotal += consultantPrice;
              }
            }
          });
        });
      }

      // Sort appointments by date and time ascending
      attendedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate} ${a.appointmentTime}`);
        const dateB = new Date(`${b.appointmentDate} ${b.appointmentTime}`);
        return dateA - dateB; // Ascending order
      });

      setAppointments(attendedAppointments);
      setTotalCash(cashTotal);
      setTotalOnline(onlineTotal);
      setTotalConsultant(consultantTotal);
      setLoading(false);
    };

    // Fetch Doctors
    const handleDoctors = (snapshot) => {
      const data = snapshot.val();
      setDoctors(data || {});
    };

    // Attach Listeners
    onValue(appointmentsRef, handleAppointments);
    onValue(doctorsRef, handleDoctors);

    // Cleanup Listeners on Unmount
    return () => {
      off(appointmentsRef, 'value', handleAppointments);
      off(doctorsRef, 'value', handleDoctors);
    };
  }, [selectedDate]); // Re-run when selectedDate changes

  const handleDateChange = (e) => {
    setLoading(true);
    setSelectedDate(e.target.value);
  };

  const generatePDF = () => {
    const pdf = new jsPDF('p', 'pt', 'a4');
    const invoice = invoiceRef.current;

    pdf.html(invoice, {
      callback: function (doc) {
        doc.save(`Invoice_${selectedDate}.pdf`);
      },
      margin: [20, 20, 20, 20],
      autoPaging: 'text',
      html2canvas: { scale: 0.5 },
      x: 0,
      y: 0,
      width: 595 - 40, // A4 width minus margins
      windowWidth: invoice.scrollWidth,
    });
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading invoice data...</p>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      {/* Header and Download Button */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <h1 className="display-4">
          <FaClinicMedical className="me-2 text-primary" />
          Attended Appointments Report
        </h1>
        <div className="d-flex align-items-center mt-3 mt-md-0">
          <Form.Group controlId="dateFilter" className="me-3">
            <Form.Label className="mb-1">Select Date:</Form.Label>
            <Form.Control 
              type="date" 
              value={selectedDate} 
              onChange={handleDateChange} 
            />
          </Form.Group>
          <Button 
            variant="success" 
            onClick={generatePDF} 
            className="d-flex align-items-center mt-3 mt-md-0"
          >
            <FaFileDownload className="me-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <div ref={invoiceRef} className="p-5 border rounded shadow-sm invoice-container">
        {/* Company Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          {/* Logo */}
          <div>
            <img src="/img/medzeal.png" alt="Company Logo" className="logo" />
          </div>
          {/* Company Details */}
          <div className="text-end company-details">
            <h3 className="text-primary">MedZeal</h3>
            <p>Email: <a href="mailto:medzealpcw@gmail.com">medzealpcw@gmail.com</a></p>
            <p>Phone: <a href="tel:+917044178786">+91 70441 78786</a></p>
            <p>Address: Bluebells, Mumbra Bypass</p>
          </div>
        </div>

        {/* Invoice Title */}
        <div className="text-center mb-4">
          <h2 className="invoice-title">Report</h2>
          <p className="invoice-date">Date: {new Date(selectedDate).toLocaleDateString()}</p>
        </div>

        {/* Invoice Number and Doctor Details */}
        <div className="d-flex justify-content-between mb-4">
          <div>
            <p><strong>Invoice Number:</strong> INV-{Date.now()}</p>
          </div>
          {doctors.name || doctors.specialization ? (
            <div>
              {doctors.name && <p><strong>Doctor:</strong> {doctors.name}</p>}
              {doctors.specialization && <p><strong>Specialization:</strong> {doctors.specialization}</p>}
            </div>
          ) : null}
        </div>

        {/* Appointments Table */}
        <Table bordered hover responsive className="invoice-table">
          <thead className="table-primary">
            <tr>
              <th>Sr No</th>
              <th>Patient Name</th>
              <th>Phone Number</th>
              <th>Service</th>
              <th>Time</th>
              <th>Price (RS)</th>
              <th>Consultant Amount (RS)</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment, index) => (
              <tr key={appointment.id}>
                <td>{index + 1}</td>
                <td>{appointment.name || 'N/A'}</td>
                <td>{appointment.phone || 'N/A'}</td>
                <td>{appointment.subCategory || 'N/A'}</td>
                <td>{appointment.appointmentTime || 'N/A'}</td>
                <td>
                  {appointment.price !== undefined && appointment.price !== null 
                    ? `RS ${parseFloat(appointment.price).toFixed(2)}` 
                    : 'N/A'}
                </td>
                <td>
                  {appointment.consultantAmount 
                    ? `RS ${parseFloat(appointment.consultantAmount).toFixed(2)}`
                    : 'N/A'}
                </td>
                <td>
                  {appointment.paymentMethod || 'N/A'}{' '}
                  {appointment.paymentMethod === 'Cash' ? (
                    <FaMoneyBillWave className="text-success ms-1" title="Cash Payment" />
                  ) : appointment.paymentMethod === 'Online' ? (
                    <FaCreditCard className="text-primary ms-1" title="Online Payment" />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan="5" className="text-end">Total Cash</th>
              <th colSpan="3">RS {totalCash.toFixed(2)}</th>
            </tr>
            <tr>
              <th colSpan="5" className="text-end">Total Online</th>
              <th colSpan="3">RS {totalOnline.toFixed(2)}</th>
            </tr>
            <tr>
              <th colSpan="5" className="text-end">Total Consultant Amount</th>
              <th colSpan="3">RS {totalConsultant.toFixed(2)}</th>
            </tr>
            <tr>
              <th colSpan="5" className="text-end">Grand Total</th>
              <th colSpan="3">
                RS {(totalCash + totalOnline + totalConsultant).toFixed(2)}
              </th>
            </tr>
          </tfoot>
        </Table>

        {/* Footer */}
        <div className="text-center mt-4">
          <p>Thank you for choosing <strong>MedZeal</strong>! We appreciate your business.</p>
          <p className="mt-2">&copy; {new Date().getFullYear()} MedZeal. All rights reserved.</p>
        </div>
      </div>

      {/* Scoped Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

        .invoice-container {
          font-family: 'Roboto', sans-serif;
          color: #333;
          background-color: #f9f9f9;
        }
        .logo {
          width: 250px; /* Increased width to 250px */
          height: auto;
        }
        .company-details p {
          margin: 0;
          font-size: 14px;
        }
        .invoice-title {
          font-weight: 700;
          color: #007bff;
        }
        .invoice-date {
          color: #555;
        }
        .invoice-table th {
          background-color: #007bff;
          color: #fff;
          font-weight: 600;
        }
        .invoice-table tbody tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        .invoice-table td, .invoice-table th {
          vertical-align: middle !important;
          text-align: center;
          font-size: 14px;
          padding: 12px;
        }
        .table-primary th {
          background-color: #007bff !important;
          color: #fff !important;
        }
        .text-primary {
          color: #007bff !important;
        }
        .text-success {
          color: #28a745 !important;
        }
        .text-end {
          text-align: right !important;
        }
        .company-details {
          text-align: right;
        }
        .display-4 {
          font-weight: 700;
          font-size: 2.5rem;
          color: #333;
        }
        .invoice-container {
          padding: 40px;
          background-color: #fff;
        }
        a {
          color: #007bff;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        @media (max-width: 768px) {
          .display-4 {
            font-size: 1.75rem;
          }
          .logo {
            width: 200px;
          }
          .invoice-table td, .invoice-table th {
            font-size: 12px;
            padding: 8px;
          }
          .company-details {
            text-align: left;
            margin-top: 20px;
          }
          .d-flex {
            flex-direction: column;
            align-items: flex-start;
          }
          .justify-content-between {
            justify-content: flex-start !important;
          }
          .align-items-center {
            align-items: flex-start !important;
          }
          .me-2 {
            margin-right: 0.5rem !important;
          }
          .ms-1 {
            margin-left: 0.25rem !important;
          }
          .mt-3 {
            margin-top: 1rem !important;
          }
        }
        /* Custom Styles */
        .border {
          border: 1px solid #dee2e6 !important;
        }
        .rounded {
          border-radius: 0.5rem !important;
        }
        .shadow-sm {
          box-shadow: 0 .125rem .25rem rgba(0,0,0,.075) !important;
        }
        h1, h2, h3, h4, h5, h6 {
          font-weight: 500;
        }
        p {
          margin: 0.5rem 0;
          font-size: 14px;
        }
        .mt-4 {
          margin-top: 1.5rem !important;
        }
        .mb-4 {
          margin-bottom: 1.5rem !important;
        }
        .d-flex {
          display: flex !important;
        }
        .justify-content-between {
          justify-content: space-between !important;
        }
        .align-items-center {
          align-items: center !important;
        }
        .me-2 {
          margin-right: 0.5rem !important;
        }
        .ms-1 {
          margin-left: 0.25rem !important;
        }
        .invoice-container {
          padding: 40px;
          background-color: #fff;
        }
        /* Ensure the invoice content fits within the page margins */
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
          }
          .invoice-container {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default TodayAttendedInvoice;
