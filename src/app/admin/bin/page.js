"use client"
import { useEffect, useState, useMemo } from "react"
import { db } from "../../../lib/firebaseConfig"
import { ref, onValue, update } from "firebase/database"
import * as XLSX from "xlsx"

const BinAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Get the current year dynamically
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const appointmentsRef = ref(db, "appointments")

    const unsubscribe = onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const deletedAppointments = Object.entries(data)
          .flatMap(([key, appointmentGroup]) =>
            Object.entries(appointmentGroup).map(([id, details]) => ({
              ...details,
              id,
              key,
            })),
          )
          .filter(({ deleted }) => deleted === true)

        setAppointments(deletedAppointments)
      } else {
        setAppointments([])
      }
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    if (!appointments) return []

    return appointments.filter(({ appointmentDate, doctor, message, name, phone, productDescription, deletedBy }) => {
      const isDateMatch = selectedDate ? appointmentDate === selectedDate : true
      const isMonthMatch = selectedMonth ? appointmentDate.split("-")[1] === selectedMonth : true
      const isYearMatch = selectedYear ? appointmentDate.split("-")[0] === selectedYear : true
      const isSearchMatch =
        doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phone.includes(searchTerm) ||
        (deletedBy && deletedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (productDescription && productDescription.toLowerCase().includes(searchTerm.toLowerCase()))

      return isDateMatch && isMonthMatch && isYearMatch && isSearchMatch
    })
  }, [appointments, selectedDate, selectedMonth, selectedYear, searchTerm])

  // Restore Appointment
  const handleRestoreAppointment = (key, id) => {
    const confirmed = window.confirm("Do you want to restore this appointment?")
    if (!confirmed) return

    const appointmentRef = ref(db, `appointments/${key}/${id}`)
    update(appointmentRef, {
      deleted: null,
      deletedBy: null,
      deletedAt: null,
    })
      .then(() => {
        console.log("Appointment restored successfully")
      })
      .catch((error) => {
        console.error("Error restoring appointment:", error)
      })
  }

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
        DeletedBy: appointment.deletedBy,
        DeletedAt: appointment.deletedAt,
      })),
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Deleted Appointments")

    // Generate and download the Excel file
    XLSX.writeFile(workbook, "deleted-appointments.xlsx")
  }

  // Today's Date
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="container mt-5">
      <h1 className="display-4 text-center mb-4">Bin Appointments</h1>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by doctor, message, name, phone or deleted by"
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
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="form-select">
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
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="form-select">
            <option value="">All Years</option>
            {Array.from({ length: 10 }, (_, i) => {
              const year = currentYear - i
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      {/* Today's Appointments Button */}
      <button onClick={() => setSelectedDate(today)} className="btn btn-primary mb-4">
        Todays Deleted Appointments
      </button>

      {/* Export to Excel Button */}
      <button onClick={handleExport} className="btn btn-success mb-4 float-end">
        Export to Excel
      </button>

      <div className="row">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="col-md-6 mb-4">
              <div className="card shadow-sm border-light hover-shadow">
                <div className="card-header bg-light">
                  <h5 className="card-title mb-0 fw-bold">{appointment.name}</h5>
                  <p className="text-muted mb-0">{appointment.email}</p>
                </div>
                <div className="card-body">
                  <div className="appointment-details">
                    <div className="detail-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{appointment.appointmentDate}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Time:</span>
                      <span className="detail-value">{appointment.appointmentTime}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Doctor:</span>
                      <span className="detail-value highlight-doctor">{appointment.doctor}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{appointment.phone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value">
                        <span className="badge bg-success me-1">Approved</span>
                        <span className="badge bg-success">Attended</span>
                        <span className="badge bg-danger ms-1">Deleted</span>
                      </span>
                    </div>
                    {appointment.message && (
                      <div className="detail-item">
                        <span className="detail-label">Message:</span>
                        <span className="detail-value">{appointment.message}</span>
                      </div>
                    )}
                    {appointment.subCategory && (
                      <div className="detail-item">
                        <span className="detail-label">Category:</span>
                        <span className="detail-value highlight-category">{appointment.subCategory}</span>
                      </div>
                    )}
                    {appointment.treatment && (
                      <div className="detail-item">
                        <span className="detail-label">Treatment:</span>
                        <span className="detail-value highlight-treatment">{appointment.treatment}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Deleted By:</span>
                      <span className="detail-value highlight-deleted-by">{appointment.deletedBy || "Unknown"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Deleted At:</span>
                      <span className="detail-value">
                        {appointment.deletedAt ? new Date(appointment.deletedAt).toLocaleString() : "Unknown"}
                      </span>
                    </div>
                  </div>

                  <div className="financial-details mt-3 pt-3 border-top">
                    <h6 className="mb-2 text-primary">Payment Details</h6>
                    <div className="detail-item">
                      <span className="detail-label">Payment Method:</span>
                      <span className="detail-value">{appointment.paymentMethod}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Price:</span>
                      <span className="detail-value highlight-price">₹{appointment.price}</span>
                    </div>
                    {appointment.consultantAmount > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Consultant Amount:</span>
                        <span className="detail-value highlight-price">₹{appointment.consultantAmount}</span>
                      </div>
                    )}
                    {appointment.productAmount > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Product Amount:</span>
                        <span className="detail-value highlight-price">₹{appointment.productAmount}</span>
                      </div>
                    )}
                    {appointment.productDescription && (
                      <div className="detail-item">
                        <span className="detail-label">Product Description:</span>
                        <span className="detail-value">{appointment.productDescription}</span>
                      </div>
                    )}
                    <div className="detail-item total-row">
                      <span className="detail-label fw-bold">Total:</span>
                      <span className="detail-value highlight-total">
                        ₹{(Number(appointment.price || 0) + Number(appointment.productAmount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-top d-flex justify-content-center">
                    <button
                      onClick={() => handleRestoreAppointment(appointment.key, appointment.id)}
                      className="btn btn-success"
                    >
                      Restore Appointment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <p className="text-center text-muted">No deleted appointments found for the selected criteria.</p>
          </div>
        )}
      </div>

      {/* Custom CSS for hover effect */}
      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          transition: box-shadow 0.3s ease;
        }
        .detail-item {
          display: flex;
          margin-bottom: 8px;
          align-items: flex-start;
        }

        .detail-label {
          font-weight: 600;
          min-width: 140px;
          color: #495057;
        }

        .detail-value {
          flex: 1;
        }

        .highlight-doctor {
          font-weight: bold;
          color: #343a40;
        }

        .highlight-category {
          color: #6610f2;
          font-weight: 500;
        }

        .highlight-treatment {
          color: #0d6efd;
          font-weight: 500;
        }

        .highlight-price {
          color: #198754;
          font-weight: 500;
        }

        .highlight-total {
          color: #dc3545;
          font-weight: bold;
          font-size: 1.1em;
        }
        
        .highlight-deleted-by {
          color: #fd7e14;
          font-weight: 500;
        }

        .financial-details {
          background-color: #f8f9fa;
          padding: 10px;
          border-radius: 5px;
          margin-top: 10px;
        }

        .total-row {
          border-top: 1px dashed #dee2e6;
          padding-top: 8px;
          margin-top: 8px;
        }

        .card-header {
          border-bottom: 2px solid #e9ecef;
        }

        .badge {
          padding: 5px 8px;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

export default BinAppointmentsPage
