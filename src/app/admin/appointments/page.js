"use client"
import { useEffect, useState, useMemo } from "react"
import { db } from "../../../lib/firebaseConfig"
import { ref, onValue, update } from "firebase/database"
import * as XLSX from "xlsx"

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingAppointment, setEditingAppointment] = useState(null)

  // Get the current year dynamically
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const appointmentsRef = ref(db, "appointments")

    const unsubscribe = onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const attendedAppointments = Object.entries(data)
          .flatMap(([key, appointmentGroup]) =>
            Object.entries(appointmentGroup).map(([id, details]) => ({
              ...details,
              id,
              key,
            })),
          )
          .filter(({ approved, attended, deleted }) => approved && attended && !deleted)

        setAppointments(attendedAppointments)
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

    return appointments.filter(({ appointmentDate, doctor, message, name, phone, productDescription }) => {
      const isDateMatch = selectedDate ? appointmentDate === selectedDate : true
      const isMonthMatch = selectedMonth ? appointmentDate.split("-")[1] === selectedMonth : true
      const isYearMatch = selectedYear ? appointmentDate.split("-")[0] === selectedYear : true
      const isSearchMatch =
        doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phone.includes(searchTerm) ||
        (productDescription && productDescription.toLowerCase().includes(searchTerm.toLowerCase()))

      return isDateMatch && isMonthMatch && isYearMatch && isSearchMatch
    })
  }, [appointments, selectedDate, selectedMonth, selectedYear, searchTerm])

  // Total Price Calculation
  const totalPrice = useMemo(() => {
    return filteredAppointments.reduce((acc, { price }) => {
      const numericPrice = Number.parseFloat(price)
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return acc // Skip if price is not a valid number or zero/negative
      }
      return acc + numericPrice
    }, 0)
  }, [filteredAppointments])

  // Total Consultant Amount Calculation
  const totalConsultant = useMemo(() => {
    return filteredAppointments.reduce((acc, { consultantAmount }) => {
      const numericConsultant = Number.parseFloat(consultantAmount)
      if (isNaN(numericConsultant) || numericConsultant <= 0) {
        return acc // Skip if consultantAmount is not a valid number or zero/negative
      }
      return acc + numericConsultant
    }, 0)
  }, [filteredAppointments])

  // Total Product Amount Calculation
  const totalProductAmount = useMemo(() => {
    return filteredAppointments.reduce((acc, { productAmount }) => {
      const numericProductAmount = Number.parseFloat(productAmount)
      if (isNaN(numericProductAmount) || numericProductAmount <= 0) {
        return acc // Skip if productAmount is not a valid number or zero/negative
      }
      return acc + numericProductAmount
    }, 0)
  }, [filteredAppointments])

  // Today's Date
  const today = new Date().toISOString().split("T")[0]

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
      })),
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments")

    // Generate and download the Excel file
    XLSX.writeFile(workbook, "appointments.xlsx")
  }

  // Move to Bin instead of Delete
  const handleMoveToBin = (key, id) => {
    const confirmed = window.confirm("Do you want to move this appointment to bin?")
    if (!confirmed) return

    const appointmentRef = ref(db, `appointments/${key}/${id}`)
    const userEmail = localStorage.getItem("userEmail") || "unknown@example.com" // Get logged in user email

    update(appointmentRef, {
      deleted: true,
      deletedBy: userEmail,
      deletedAt: new Date().toISOString(),
    })
      .then(() => {
        console.log("Appointment moved to bin successfully")
      })
      .catch((error) => {
        console.error("Error moving appointment to bin:", error)
      })
  }

  // Edit Appointment
  const handleEdit = (appointment) => {
    setEditingAppointment(appointment)
  }

  const handleEditFormChange = (e) => {
    const { name, value, type } = e.target
    setEditingAppointment((prevAppointment) => ({
      ...prevAppointment,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }))
  }

  const handleUpdateAppointment = (e) => {
    e.preventDefault()
    const { key, id, ...updatedData } = editingAppointment
    const appointmentRef = ref(db, `appointments/${key}/${id}`)
    update(appointmentRef, updatedData)
      .then(() => {
        console.log("Appointment updated successfully")
        setEditingAppointment(null)
      })
      .catch((error) => {
        console.error("Error updating appointment:", error)
      })
  }

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
        Today Appointments
      </button>

      {/* Export to Excel Button */}
      <button onClick={handleExport} className="btn btn-success mb-4 float-end">
        Export to Excel
      </button>

      {/* Totals Display */}
      <div className="total-summary">
        <h3>Summary</h3>
        <div className="total-item">
          <span className="total-label">Total Price:</span>
          <span className="total-value">₹{totalPrice.toFixed(2)}</span>
        </div>
        <div className="total-item">
          <span className="total-label">Total Consultant Amount:</span>
          <span className="total-value">₹{totalConsultant.toFixed(2)}</span>
        </div>
        <div className="total-item">
          <span className="total-label">Total Product Amount:</span>
          <span className="total-value">₹{totalProductAmount.toFixed(2)}</span>
        </div>
        <div className="total-item">
          <span className="total-label">Grand Total:</span>
          <span className="total-value">₹{(totalPrice + totalProductAmount).toFixed(2)}</span>
        </div>
      </div>

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

                  <div className="mt-3 pt-2 border-top d-flex justify-content-between">
                    <button onClick={() => handleEdit(appointment)} className="btn btn-primary">
                      Edit
                    </button>
                    <button
                      onClick={() => handleMoveToBin(appointment.key, appointment.id)}
                      className="btn btn-warning"
                    >
                      Move to Bin
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

      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Edit Appointment</h2>
                <button type="button" className="btn-close" onClick={() => setEditingAppointment(null)}></button>
              </div>
              <form onSubmit={handleUpdateAppointment}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
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
                    <div className="col-md-6 mb-3">
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

                  <div className="row">
                    <div className="col-md-6 mb-3">
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
                    <div className="col-md-6 mb-3">
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
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email:</label>
                    <input
                      type="email"
                      name="email"
                      value={editingAppointment.email || ""}
                      onChange={handleEditFormChange}
                      className="form-control"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Message:</label>
                    <textarea
                      name="message"
                      value={editingAppointment.message || ""}
                      onChange={handleEditFormChange}
                      className="form-control"
                      rows="2"
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Treatment:</label>
                    <input
                      type="text"
                      name="treatment"
                      value={editingAppointment.treatment || ""}
                      onChange={handleEditFormChange}
                      className="form-control"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Category:</label>
                    <input
                      type="text"
                      name="subCategory"
                      value={editingAppointment.subCategory || ""}
                      onChange={handleEditFormChange}
                      className="form-control"
                    />
                  </div>

                  <hr className="my-3" />
                  <h5>Payment Details</h5>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Payment Method:</label>
                      <select
                        name="paymentMethod"
                        value={editingAppointment.paymentMethod || ""}
                        onChange={handleEditFormChange}
                        className="form-select"
                      >
                        <option value="">Select Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Price:</label>
                      <input
                        type="number"
                        name="price"
                        value={editingAppointment.price || ""}
                        onChange={handleEditFormChange}
                        className="form-control"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
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
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Product Amount:</label>
                      <input
                        type="number"
                        name="productAmount"
                        value={editingAppointment.productAmount || ""}
                        onChange={handleEditFormChange}
                        className="form-control"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Product Description:</label>
                    <textarea
                      name="productDescription"
                      value={editingAppointment.productDescription || ""}
                      onChange={handleEditFormChange}
                      className="form-control"
                      rows="2"
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                  <button type="button" onClick={() => setEditingAppointment(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
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
          margin: 5% auto;
          max-width: 700px;
          width: 90%;
        }
        .modal-content {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #dee2e6;
          background-color: #f8f9fa;
        }
        .modal-body {
          padding: 20px;
          max-height: 70vh;
          overflow-y: auto;
        }
        .modal-footer {
          padding: 15px 20px;
          border-top: 1px solid #dee2e6;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .btn-close {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6c757d;
        }
        .btn-close:hover {
          color: #343a40;
        }
        /* Optional: Scrollbar styling for better UX */
        .modal-content::-webkit-scrollbar {
          width: 8px;
        }
        .modal-content::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .total-summary {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 5px;
        }

        .total-summary h3 {
          font-size: 1.5rem;
          margin-bottom: 10px;
          color: #343a40;
        }

        .total-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #dee2e6;
        }

        .total-item:last-child {
          border-bottom: none;
        }

        .total-label {
          font-weight: bold;
          color: #495057;
        }

        .total-value {
          color: #28a745;
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

export default AppointmentsPage
