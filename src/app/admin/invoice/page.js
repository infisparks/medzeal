"use client"

import { useEffect, useState, useRef } from "react"
import { db } from "../../../lib/firebaseConfig"
import { ref as dbRef, onValue, off } from "firebase/database"
import { FaFileDownload, FaMoneyBillWave, FaCreditCard, FaClinicMedical } from "react-icons/fa"
import { Spinner, Button, Table, Form } from "react-bootstrap"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"

const TodayAttendedInvoice = () => {
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState({})
  const [loading, setLoading] = useState(true)
  const [totalCash, setTotalCash] = useState(0)
  const [totalOnline, setTotalOnline] = useState(0)
  const [totalConsultant, setTotalConsultant] = useState(0)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [sending, setSending] = useState(false)
  const [totalProductAmount, setTotalProductAmount] = useState(0)

  const invoiceRef = useRef()

  useEffect(() => {
    const appointmentsRef = dbRef(db, "appointments")
    const doctorsRef = dbRef(db, "doctors")

    const handleAppointments = (snapshot) => {
      const data = snapshot.val()
      const date = selectedDate
      const attendedAppointments = []
      let cashTotal = 0
      let onlineTotal = 0
      let consultantTotal = 0
      let productTotal = 0

      if (data) {
        Object.entries(data).forEach(([userId, userAppointments]) => {
          Object.entries(userAppointments).forEach(([id, details]) => {
            if (details.attended === true && details.appointmentDate === date && !details.deleted) {
              attendedAppointments.push({ ...details, id, userId })
              if (details.price) {
                const price = Number.parseFloat(details.price)
                if (details.paymentMethod === "Cash") {
                  cashTotal += price
                } else if (details.paymentMethod === "Online") {
                  onlineTotal += price
                }
              }
              if (details.consultantAmount) {
                const consultantPrice = Number.parseFloat(details.consultantAmount)
                consultantTotal += consultantPrice
              }
              if (details.productAmount) {
                const productPrice = Number.parseFloat(details.productAmount)
                productTotal += productPrice
              }
            }
          })
        })
      }

      attendedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate} ${a.appointmentTime}`)
        const dateB = new Date(`${b.appointmentDate} ${b.appointmentTime}`)
        return dateA - dateB
      })

      setAppointments(attendedAppointments)
      setTotalCash(cashTotal)
      setTotalOnline(onlineTotal)
      setTotalConsultant(consultantTotal)
      setTotalProductAmount(productTotal)
      setLoading(false)
    }

    const handleDoctors = (snapshot) => {
      const data = snapshot.val()
      setDoctors(data || {})
    }

    onValue(appointmentsRef, handleAppointments)
    onValue(doctorsRef, handleDoctors)

    return () => {
      off(appointmentsRef, "value", handleAppointments)
      off(doctorsRef, "value", handleDoctors)
    }
  }, [selectedDate])

  const handleDateChange = (e) => {
    setLoading(true)
    setSelectedDate(e.target.value)
  }

  const generatePDF = () => {
    const pdf = new jsPDF("p", "pt", "a4")
    const invoice = invoiceRef.current

    pdf.html(invoice, {
      callback: (doc) => {
        doc.save(`Invoice_${selectedDate}.pdf`)
      },
      margin: [20, 20, 20, 20],
      autoPaging: "text",
      html2canvas: { scale: 0.5 },
      x: 0,
      y: 0,
      width: 595 - 40,
      windowWidth: invoice.scrollWidth,
    })
  }

  // Helper: Generate PDF blob from invoice content
  const generatePDFBlob = () => {
    return new Promise((resolve, reject) => {
      const pdf = new jsPDF("p", "pt", "a4")
      const invoice = invoiceRef.current
      pdf.html(invoice, {
        callback: (doc) => {
          try {
            const blob = doc.output("blob")
            resolve(blob)
          } catch (error) {
            reject(error)
          }
        },
        margin: [20, 20, 20, 20],
        autoPaging: "text",
        html2canvas: { scale: 0.5 },
        x: 0,
        y: 0,
        width: 595 - 40,
        windowWidth: invoice.scrollWidth,
      })
    })
  }

  // Upload PDF to Firebase Storage and send invoice via API with professional message
  const handleSendInvoice = async () => {
    setSending(true)
    try {
      const pdfBlob = await generatePDFBlob()
      const storage = getStorage()
      const fileName = `Invoice_${selectedDate}_${Date.now()}.pdf`
      const fileRef = storageRef(storage, `invoices/${fileName}`)
      await uploadBytes(fileRef, pdfBlob)
      const downloadUrl = await getDownloadURL(fileRef)

      // Calculate grand total
      const grandTotal = totalCash + totalOnline + totalConsultant + totalProductAmount
      // Format selected date for the message
      const formattedDate = new Date(selectedDate).toLocaleDateString()

      // Build a professional message with the calculations
      const message = `
Please find attached the invoice for the attended appointments on ${formattedDate}.

The calculation details are as follows:
- Total Cash: RS ${totalCash.toFixed(2)}
- Total Online: RS ${totalOnline.toFixed(2)}
- Total Consultant Amount: RS ${totalConsultant.toFixed(2)}
- Total Product Amount: RS ${totalProductAmount.toFixed(2)}
- Grand Total: RS ${grandTotal.toFixed(2)}

Thank you for your business.
MedZeal`

      const payload = {
        token: "99583991572",
        number: "917738408252",
        imageUrl: downloadUrl,
        caption: message,
      }

      const response = await fetch("https://wa.medblisss.com/send-image-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to send invoice via API")
      }

      const responseData = await response.json()
      alert("Invoice sent successfully!")
      console.log("API response:", responseData)
    } catch (error) {
      console.error("Error sending invoice:", error)
      alert("There was an error sending the invoice. Please try again.")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading invoice data...</p>
      </div>
    )
  }

  return (
    <div className="container mt-5 mb-5">
      {/* Header and Buttons */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <h1 className="display-4">
          <FaClinicMedical className="me-2 text-primary" />
          Attended Appointments Report
        </h1>
        <div className="d-flex align-items-center mt-3 mt-md-0">
          <Form.Group controlId="dateFilter" className="me-3">
            <Form.Label className="mb-1">Select Date:</Form.Label>
            <Form.Control type="date" value={selectedDate} onChange={handleDateChange} />
          </Form.Group>
          <Button variant="success" onClick={generatePDF} className="d-flex align-items-center mt-3 mt-md-0">
            <FaFileDownload className="me-2" />
            Download PDF
          </Button>
          <Button
            variant="primary"
            onClick={handleSendInvoice}
            className="d-flex align-items-center mt-3 mt-md-0 ms-3"
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Invoice to Zainab Mam"}
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <div ref={invoiceRef} className="p-5 border rounded shadow-sm invoice-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <img src="/img/medzeal.png" alt="Company Logo" className="logo" />
          </div>
          <div className="text-end company-details">
            <h3 className="text-primary">MedZeal</h3>
            <p>
              Email: <a href="mailto:medzealpcw@gmail.com">medzealpcw@gmail.com</a>
            </p>
            <p>
              Phone: <a href="tel:+917044178786">+91 70441 78786</a>
            </p>
            <p>Address: Bluebells, Mumbra Bypass</p>
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="invoice-title">Report</h2>
          <p className="invoice-date">Date: {new Date(selectedDate).toLocaleDateString()}</p>
        </div>

        <div className="d-flex justify-content-between mb-4">
          <div>
            <p>
              <strong>Invoice Number:</strong> INV-{Date.now()}
            </p>
          </div>
          {doctors.name || doctors.specialization ? (
            <div>
              {doctors.name && (
                <p>
                  <strong>Doctor:</strong> {doctors.name}
                </p>
              )}
              {doctors.specialization && (
                <p>
                  <strong>Specialization:</strong> {doctors.specialization}
                </p>
              )}
            </div>
          ) : null}
        </div>

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
              <th>Product Amount (RS)</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment, index) => (
              <tr key={appointment.id}>
                <td>{index + 1}</td>
                <td>{appointment.name || "N/A"}</td>
                <td>{appointment.phone || "N/A"}</td>
                <td>{appointment.subCategory || "N/A"}</td>
                <td>{appointment.appointmentTime || "N/A"}</td>
                <td>
                  {appointment.price !== undefined && appointment.price !== null
                    ? `RS ${Number.parseFloat(appointment.price).toFixed(2)}`
                    : "N/A"}
                </td>
                <td>
                  {appointment.consultantAmount
                    ? `RS ${Number.parseFloat(appointment.consultantAmount).toFixed(2)}`
                    : "N/A"}
                </td>
                <td>
                  {appointment.productAmount ? `RS ${Number.parseFloat(appointment.productAmount).toFixed(2)}` : "N/A"}
                </td>
                <td>
                  {appointment.paymentMethod || "N/A"}{" "}
                  {appointment.paymentMethod === "Cash" ? (
                    <FaMoneyBillWave className="text-success ms-1" title="Cash Payment" />
                  ) : appointment.paymentMethod === "Online" ? (
                    <FaCreditCard className="text-primary ms-1" title="Online Payment" />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan="5" className="text-end">
                Total Cash
              </th>
              <th colSpan="4">RS {totalCash.toFixed(2)}</th>
            </tr>
            <tr>
              <th colSpan="5" className="text-end">
                Total Online
              </th>
              <th colSpan="4">RS {totalOnline.toFixed(2)}</th>
            </tr>
            <tr>
              <th colSpan="5" className="text-end">
                Total Consultant Amount
              </th>
              <th colSpan="4">RS {totalConsultant.toFixed(2)}</th>
            </tr>
            <tr>
              <th colSpan="5" className="text-end">
                Total Product Amount
              </th>
              <th colSpan="4">RS {totalProductAmount.toFixed(2)}</th>
            </tr>
            <tr>
              <th colSpan="5" className="text-end">
                Grand Total
              </th>
              <th colSpan="4">RS {(totalCash + totalOnline + totalConsultant + totalProductAmount).toFixed(2)}</th>
            </tr>
          </tfoot>
        </Table>

        <div className="text-center mt-4">
          <p>
            Thank you for choosing <strong>MedZeal</strong>! We appreciate your business.
          </p>
          <p className="mt-2">&copy; {new Date().getFullYear()} MedZeal. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        .invoice-container {
          font-family: 'Roboto', sans-serif;
          color: #333;
          background-color: #f9f9f9;
        }
        .logo {
          width: 250px;
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
  )
}

export default TodayAttendedInvoice
