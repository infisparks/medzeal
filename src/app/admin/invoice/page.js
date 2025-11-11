"use client"

import { useEffect, useState, useRef } from "react"
import { db } from "../../../lib/firebaseConfig"
import { ref as dbRef, onValue, off } from "firebase/database"
import { FaFileDownload, FaMoneyBillWave, FaCreditCard, FaClinicMedical } from "react-icons/fa"
import { Spinner, Button, Table, Form } from "react-bootstrap"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import html2canvas from "html2canvas"

const TodayAttendedInvoice = () => {
  // --- STATE ---
  const [allAppointmentsData, setAllAppointmentsData] = useState(null) // Holds all data from Firebase
  const [appointments, setAppointments] = useState([]) // Holds filtered data for UI table
  const [doctors, setDoctors] = useState({})
  const [loading, setLoading] = useState(true)
  const [totalCash, setTotalCash] = useState(0)
  const [totalOnline, setTotalOnline] = useState(0)
  const [totalConsultant, setTotalConsultant] = useState(0)
  const [totalProductAmount, setTotalProductAmount] = useState(0)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [sending, setSending] = useState(false)
  const invoiceRef = useRef()

  // --- DATA FETCHING & FILTERING ---

  // Effect 1: Fetch ALL data once on component mount
  useEffect(() => {
    setLoading(true)
    const appointmentsRef = dbRef(db, "appointments")
    const doctorsRef = dbRef(db, "doctors")

    const handleAppointments = (snapshot) => {
      setAllAppointmentsData(snapshot.val() || {}) // Store all data
    }

    const handleDoctors = (snapshot) => {
      setDoctors(snapshot.val() || {})
    }

    onValue(appointmentsRef, handleAppointments)
    onValue(doctorsRef, handleDoctors)

    return () => {
      off(appointmentsRef, "value", handleAppointments)
      off(doctorsRef, "value", handleDoctors)
    }
  }, []) // Empty dependency array, runs once

  // Effect 2: Filter data for UI when selectedDate or allAppointmentsData changes
  useEffect(() => {
    if (allAppointmentsData === null) {
      setLoading(true) // Still waiting for initial data
      return
    }

    setLoading(true) // Start filtering
    const data = allAppointmentsData
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
    setLoading(false) // Done filtering
  }, [selectedDate, allAppointmentsData])

  // --- HELPERS ---

  const getISODateString = (date) => date.toISOString().split("T")[0]

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
  }

  // --- PDF GENERATORS ---

  // 1. Generate PDF from HTML (for Today's Report Download)
  const generatePDF = async () => {
    const element = invoiceRef.current
    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL("image/jpeg", 1.0)
    const pdf = new jsPDF("p", "mm", "a4")
    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    pdf.save(`Invoice_${selectedDate}.pdf`)
  }

  // 2. Generate PDF BLOB from HTML (for Today's Report Send)
  const generatePDFBlob = async () => {
    const element = invoiceRef.current
    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL("image/jpeg", 1.0)
    const pdf = new jsPDF("p", "mm", "a4")
    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    return pdf.output("blob")
  }

  // 3. Filter data for multi-day reports
  const filterAppointmentsByDateRange = (startDateStr, endDateStr) => {
    const filtered = []
    let cashTotal = 0
    let onlineTotal = 0
    let consultantTotal = 0
    let productTotal = 0

    if (allAppointmentsData) {
      Object.entries(allAppointmentsData).forEach(([userId, userAppointments]) => {
        Object.entries(userAppointments).forEach(([id, details]) => {
          if (
            details.attended === true &&
            !details.deleted &&
            details.appointmentDate >= startDateStr &&
            details.appointmentDate <= endDateStr
          ) {
            filtered.push({ ...details, id, userId })
            if (details.price) {
              const price = Number.parseFloat(details.price)
              if (details.paymentMethod === "Cash") cashTotal += price
              else if (details.paymentMethod === "Online") onlineTotal += price
            }
            if (details.consultantAmount) {
              consultantTotal += Number.parseFloat(details.consultantAmount)
            }
            if (details.productAmount) {
              productTotal += Number.parseFloat(details.productAmount)
            }
          }
        })
      })
    }

    filtered.sort((a, b) => {
      const dateA = new Date(`${a.appointmentDate} ${a.appointmentTime || "00:00"}`)
      const dateB = new Date(`${b.appointmentDate} ${b.appointmentTime || "00:00"}`)
      return dateA - dateB
    })

    const grandTotal = cashTotal + onlineTotal + consultantTotal + productTotal
    return { filtered, cashTotal, onlineTotal, consultantTotal, productTotal, grandTotal }
  }

  // 4. Generate PDF BLOB from DATA (for 7/30 Day Reports)
  const generateMultiDayPDFBlob = (reportData, title) => {
    const doc = new jsPDF("p", "mm", "a4")
    const { filtered, cashTotal, onlineTotal, consultantTotal, productTotal, grandTotal } = reportData

    // Title
    doc.setFontSize(18)
    doc.text(title, 14, 22)
    doc.setFontSize(11)
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 29)
    doc.text("MedZeal", 190, 22, { align: "right" })

    // Table
    const tableColumn = [
      "Date",
      "Patient",
      "Phone",
      "Service",
      "Price (RS)",
      "Consultant (RS)",
      "Product (RS)",
      "Payment",
    ]
    const tableRows = []

    filtered.forEach((app) => {
      const row = [
        app.appointmentDate,
        app.name || "N/A",
        app.phone || "N/A",
        app.subCategory || "N/A",
        app.price ? `${Number.parseFloat(app.price).toFixed(2)}` : "0.00",
        app.consultantAmount ? `${Number.parseFloat(app.consultantAmount).toFixed(2)}` : "0.00",
        app.productAmount ? `${Number.parseFloat(app.productAmount).toFixed(2)}` : "0.00",
        app.paymentMethod || "N/A",
      ]
      tableRows.push(row)
    })

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      headStyles: { fillColor: [0, 123, 255] },
      styles: { fontSize: 8 },
    })

    // Totals
    const finalY = (doc).lastAutoTable.finalY || 45
    doc.setFontSize(12)
    doc.text("Summary:", 14, finalY + 10)
    doc.setFontSize(10)
    doc.text(`Total Cash: RS ${cashTotal.toFixed(2)}`, 14, finalY + 16)
    doc.text(`Total Online: RS ${onlineTotal.toFixed(2)}`, 14, finalY + 21)
    doc.text(`Total Consultant: RS ${consultantTotal.toFixed(2)}`, 14, finalY + 26)
    doc.text(`Total Product: RS ${productTotal.toFixed(2)}`, 14, finalY + 31)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`Grand Total: RS ${grandTotal.toFixed(2)}`, 14, finalY + 38)

    return doc.output("blob")
  }

  // --- WHATSAPP SENDERS ---

  /**
   * CENTRAL WHATSAPP SENDER
   * This function uploads a PDF blob and sends it via your new API
   */
  const sendWhatsAppReport = async (pdfBlob, caption, phoneNumber, friendlyFileName) => {
    // 1. Upload Blob to Firebase Storage
    const storage = getStorage()
    const fileRef = storageRef(storage, `invoices/${friendlyFileName}`)
    await uploadBytes(fileRef, pdfBlob)
    const downloadUrl = await getDownloadURL(fileRef)

    // 2. Prepare WhatsApp Payload (using your new API)
    const payload = {
      number: "918907866786", // e.g., "918907866786"
      mediatype: "document",
      mimetype: "application/pdf",
      caption: caption,
      media: downloadUrl, // This is the public Supabase/Firebase URL
      fileName: friendlyFileName,
    }

    // 3. Send via API
    const res = await fetch("https://evo.infispark.in/message/sendMedia/medfordlab", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // This header name 'apikey' matches your API spec
        apikey: process.env.NEXT_PUBLIC_WHATSAPP_API_KEY || "",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errorResult = await res.json().catch(() => ({})) // Try to get json error
      throw new Error(
        `Failed to send via WhatsApp. Status: ${res.status}. ${errorResult.message || "Unknown API error"}`
      )
    }

    return await res.json()
  }

  // Handler 1: Send Today's Report (from HTML)
  const handleSendTodayReport = async (phoneNumber) => {
    try {
      setSending(true)

      // 1. Generate Blob from HTML (existing function)
      const pdfBlob = await generatePDFBlob()

      // 2. Create Caption
      const grandTotal = totalCash + totalOnline + totalConsultant + totalProductAmount
      const formattedDate = new Date(selectedDate).toLocaleDateString()
      const caption = `
Please find attached the invoice for the attended appointments on ${formattedDate}.

The calculation details are as follows:
- Total Cash: RS ${totalCash.toFixed(2)}
- Total Online: RS ${totalOnline.toFixed(2)}
- Total Consultant Amount: RS ${totalConsultant.toFixed(2)}
- Total Product Amount: RS ${totalProductAmount.toFixed(2)}
- Grand Total: RS ${grandTotal.toFixed(2)}

Thank you for your business.
MedZeal`

      // 3. Send
      const friendlyFileName = `Invoice_${selectedDate}.pdf`
      await sendWhatsAppReport(pdfBlob, caption, phoneNumber, friendlyFileName)

      alert("Invoice sent successfully!")
    } catch (error) {
      console.error("Error sending invoice:", error)
      alert(`There was an error sending the invoice: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  // Handler 2: Send Multi-Day Report (from Data)
  const handleSendMultiDayReport = async (days) => {
    setSending(true)
    try {
      const today = new Date()
      const endDateStr = getISODateString(today)

      const startDate = new Date(today)
      startDate.setDate(today.getDate() - (days - 1)) // -6 for 7 days (inclusive)
      const startDateStr = getISODateString(startDate)

      const title = `DPR for Last ${days} Days (${startDateStr} to ${endDateStr})`

      // 1. Filter data
      const reportData = filterAppointmentsByDateRange(startDateStr, endDateStr)

      if (reportData.filtered.length === 0) {
        alert(`No attended appointments found for the last ${days} days.`)
        setSending(false)
        return
      }

      // 2. Generate PDF Blob from data
      const pdfBlob = generateMultiDayPDFBlob(reportData, title)

      // 3. Create caption
      const caption = `
Please find attached the ${title}.

Summary:
- Total Cash: RS ${reportData.cashTotal.toFixed(2)}
- Total Online: RS ${reportData.onlineTotal.toFixed(2)}
- Total Consultant: RS ${reportData.consultantTotal.toFixed(2)}
- Total Product: RS ${reportData.productTotal.toFixed(2)}
- Grand Total: RS ${reportData.grandTotal.toFixed(2)}

Thank you,
MedZeal`

      // 4. Send
      const friendlyFileName = `DPR_Last_${days}_Days_${endDateStr}.pdf`
      await sendWhatsAppReport(pdfBlob, caption, "918907866786", friendlyFileName) // Hardcoded Meraj Sir's number

      alert(`Last ${days} days report sent successfully!`)
    } catch (error) {
      console.error(`Error sending ${days} day report:`, error)
      alert(`Failed to send ${days} day report: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  // --- RENDER ---

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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <h1 className="display-4">
          <FaClinicMedical className="me-2 text-primary" />
          Attended Appointments Report
        </h1>
        <div className="d-flex flex-wrap align-items-center mt-3 mt-md-0">
          <Form.Group controlId="dateFilter" className="me-3 mb-2 mb-md-0">
            <Form.Label className="mb-1">Select Date:</Form.Label>
            <Form.Control type="date" value={selectedDate} onChange={handleDateChange} />
          </Form.Group>
          <Button variant="success" onClick={generatePDF} className="d-flex align-items-center me-2 mb-2 mb-md-0">
            <FaFileDownload className="me-2" />
            Download PDF
          </Button>
          <Button
            variant="info"
            onClick={() => handleSendTodayReport("918907866786")} // Meraj Sir's number
            className="d-flex align-items-center me-2 mb-2 mb-md-0"
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Today's DPR"}
          </Button>
          <Button
            variant="warning"
            onClick={() => handleSendMultiDayReport(7)}
            className="d-flex align-items-center me-2 mb-2 mb-md-0"
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Last 7 Days DPR"}
          </Button>
          <Button
            variant="danger"
            onClick={() => handleSendMultiDayReport(30)}
            className="d-flex align-items-center mb-2 mb-md-0"
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Last 30 Days DPR"}
          </Button>
        </div>
      </div>

      {/* This 'invoiceRef' is only used for the Today's Report */}
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
        @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap");
        .invoice-container {
          font-family: "Roboto", sans-serif;
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
        .invoice-table td,
        .invoice-table th {
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
          .invoice-table td,
          .invoice-table th {
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
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
        }
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
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