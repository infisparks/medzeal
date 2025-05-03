"use client"

import { useEffect, useState } from "react"
import { db } from "../../../lib/firebaseConfig"
import { ref, onValue, off, update } from "firebase/database"
import {
  FaPhoneAlt,
  FaMoneyBillWave,
  FaCreditCard,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaStethoscope,
  FaSyringe,
  FaComments,
  FaFileExport,
  FaEdit,
  FaSearch,
  FaPlus,
  FaSave,
  FaTimes,
  FaShoppingCart,
} from "react-icons/fa"
import { Spinner, Button, Modal, Form, InputGroup } from "react-bootstrap"
import * as XLSX from "xlsx"

const TodayAttendedAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [doctors, setDoctors] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Track total price and consultant amounts separately
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalConsultant, setTotalConsultant] = useState(0)
  const [totalProductAmount, setTotalProductAmount] = useState(0)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [editFormData, setEditFormData] = useState({
    price: "",
    paymentMethod: "",
    consultantAmount: "",
    productAmount: "",
    productDescription: "",
  })

  // Add product modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [addProductData, setAddProductData] = useState({
    productAmount: "",
    productDescription: "",
  })

  useEffect(() => {
    const appointmentsRef = ref(db, "appointments")
    const doctorsRef = ref(db, "doctors")

    // Handler for appointments
    const handleAppointments = (snapshot) => {
      const data = snapshot.val()
      const today = new Date().toISOString().split("T")[0]

      const attendedAppointments = []
      let totalPrice = 0
      let totalConsult = 0
      let totalProduct = 0

      if (data) {
        // Loop through all appointments and filter today's attended
        Object.entries(data).forEach(([userId, userAppointments]) => {
          Object.entries(userAppointments).forEach(([id, details]) => {
            if (details.attended === true && details.appointmentDate === today && !details.deleted) {
              attendedAppointments.push({ ...details, id, userId })

              // Accumulate price
              if (details.price) {
                totalPrice += Number.parseFloat(details.price) || 0
              }
              // Accumulate consultantAmount if present
              if (details.consultantAmount) {
                totalConsult += Number.parseFloat(details.consultantAmount) || 0
              }
              // Accumulate productAmount if present
              if (details.productAmount) {
                totalProduct += Number.parseFloat(details.productAmount) || 0
              }
            }
          })
        })
      }

      // Sort appointments by date/time descending (latest first)
      attendedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate} ${a.appointmentTime}`)
        const dateB = new Date(`${b.appointmentDate} ${b.appointmentTime}`)
        return dateB - dateA // Descending order
      })

      setAppointments(attendedAppointments)
      setFilteredAppointments(attendedAppointments)
      setTotalAmount(totalPrice)
      setTotalConsultant(totalConsult)
      setTotalProductAmount(totalProduct)
      setLoading(false)
    }

    // Handler for doctors
    const handleDoctors = (snapshot) => {
      const data = snapshot.val()
      setDoctors(data || {})
    }

    // Attach listeners
    onValue(appointmentsRef, handleAppointments)
    onValue(doctorsRef, handleDoctors)

    // Cleanup
    return () => {
      off(appointmentsRef, "value", handleAppointments)
      off(doctorsRef, "value", handleDoctors)
    }
  }, [])

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredAppointments(appointments)
    } else {
      const filtered = appointments.filter(
        (appointment) =>
          (appointment.name && appointment.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (appointment.phone && appointment.phone.includes(searchTerm)) ||
          (appointment.subCategory && appointment.subCategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (appointment.doctor && appointment.doctor.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredAppointments(filtered)
    }
  }, [searchTerm, appointments])

  const exportToExcel = () => {
    if (appointments.length === 0) {
      alert("No appointments to export.")
      return
    }

    // Prepare data
    const dataToExport = appointments.map((appointment) => ({
      Name: appointment.name || "N/A",
      Email: appointment.email || "N/A",
      Phone: appointment.phone || "N/A",
      Treatment: appointment.treatment || "N/A",
      Subcategory: appointment.subCategory || "N/A",
      // Try to look up the doctor's name if the 'doctor' is a key in 'doctors'
      Doctor: doctors[appointment.doctor]?.name || appointment.doctor || "N/A",
      Date: appointment.appointmentDate || "N/A",
      Time: appointment.appointmentTime || "N/A",
      Payment_Method: appointment.paymentMethod || "N/A",
      Amount_Paid: appointment.price !== undefined && appointment.price !== null ? `RS ${appointment.price}` : "N/A",
      Consultant_Amount:
        appointment.consultantAmount !== undefined && appointment.consultantAmount !== null
          ? `RS ${appointment.consultantAmount}`
          : "N/A",
      Product_Amount:
        appointment.productAmount !== undefined && appointment.productAmount !== null
          ? `RS ${appointment.productAmount}`
          : "N/A",
      Product_Description: appointment.productDescription || "N/A",
      Message: appointment.message || "N/A",
    }))

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attended Appointments")

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    })

    // Create Blob from buffer
    const data = new Blob([excelBuffer], { type: "application/octet-stream" })

    // Create download link
    const url = window.URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Attended_Appointments_${new Date().toISOString().split("T")[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Open edit modal
  const handleEditClick = (appointment) => {
    setEditingAppointment(appointment)
    setEditFormData({
      price: appointment.price || "",
      paymentMethod: appointment.paymentMethod || "",
      consultantAmount: appointment.consultantAmount || "",
      productAmount: appointment.productAmount || "",
      productDescription: appointment.productDescription || "",
    })
    setShowEditModal(true)
  }

  // Open add product modal
  const handleAddProductClick = (appointment) => {
    setEditingAppointment(appointment)
    setAddProductData({
      productAmount: "",
      productDescription: "",
    })
    setShowAddProductModal(true)
  }

  // Handle form input changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditFormData({
      ...editFormData,
      [name]: value,
    })
  }

  // Handle product form input changes
  const handleProductFormChange = (e) => {
    const { name, value } = e.target
    setAddProductData({
      ...addProductData,
      [name]: value,
    })
  }

  // Save edited appointment
  const handleSaveEdit = async () => {
    if (!editingAppointment) return

    try {
      const appointmentRef = ref(db, `appointments/${editingAppointment.userId}/${editingAppointment.id}`)

      // Prepare update data
      const updateData = {}
      if (editFormData.price) updateData.price = Number.parseFloat(editFormData.price)
      if (editFormData.paymentMethod) updateData.paymentMethod = editFormData.paymentMethod
      if (editFormData.consultantAmount) updateData.consultantAmount = Number.parseFloat(editFormData.consultantAmount)
      if (editFormData.productAmount) updateData.productAmount = Number.parseFloat(editFormData.productAmount)
      if (editFormData.productDescription) updateData.productDescription = editFormData.productDescription

      // Update in Firebase
      await update(appointmentRef, updateData)
      setShowEditModal(false)
      // Success message
      alert("Appointment updated successfully!")
    } catch (error) {
      console.error("Error updating appointment:", error)
      alert("Failed to update appointment. Please try again.")
    }
  }

  // Save added product
  const handleSaveProduct = async () => {
    if (!editingAppointment) return

    try {
      const appointmentRef = ref(db, `appointments/${editingAppointment.userId}/${editingAppointment.id}`)

      // Prepare update data
      const updateData = {
        productAmount: Number.parseFloat(addProductData.productAmount),
      }
      if (addProductData.productDescription) updateData.productDescription = addProductData.productDescription

      // Update in Firebase
      await update(appointmentRef, updateData)
      setShowAddProductModal(false)
      // Success message
      alert("Product added successfully!")
    } catch (error) {
      console.error("Error adding product:", error)
      alert("Failed to add product. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading appointments...</p>
      </div>
    )
  }

  return (
    <div className="container mt-5">
      {/* Header, Search and Export Button */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <h1 className="display-4 mb-3 mb-md-0">Today Attended Appointments</h1>
        <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
          <div className="search-container mb-2 mb-md-0 flex-grow-1">
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">
                <FaSearch className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by name, phone, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0 shadow-none"
              />
            </InputGroup>
          </div>
          <Button variant="success" onClick={exportToExcel} className="d-flex align-items-center">
            <FaFileExport className="me-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Totals */}
      <div className="mb-4 p-3 bg-light rounded shadow-sm">
        <div className="row">
          <div className="col-md-4">
            <div className="d-flex align-items-center">
              <div className="icon-container bg-primary text-white rounded-circle p-3 me-3">
                <FaMoneyBillWave />
              </div>
              <div>
                <h6 className="mb-0 text-muted">Total Amount</h6>
                <h4 className="mb-0">RS {totalAmount.toFixed(2)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="d-flex align-items-center">
              <div className="icon-container bg-success text-white rounded-circle p-3 me-3">
                <FaUser />
              </div>
              <div>
                <h6 className="mb-0 text-muted">Consultant Amount</h6>
                <h4 className="mb-0">RS {totalConsultant.toFixed(2)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="d-flex align-items-center">
              <div className="icon-container bg-warning text-white rounded-circle p-3 me-3">
                <FaShoppingCart />
              </div>
              <div>
                <h6 className="mb-0 text-muted">Product Amount</h6>
                <h4 className="mb-0">RS {totalProductAmount.toFixed(2)}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length > 0 ? (
        <div className="row">
          {filteredAppointments.map(
            ({
              id,
              userId,
              appointmentDate,
              appointmentTime,
              doctor,
              message,
              name,
              phone,
              treatment,
              subCategory,
              price,
              paymentMethod,
              consultantAmount,
              productAmount,
              productDescription,
            }) => (
              <div key={id} className="col-lg-4 col-md-6 mb-4">
                <div className="card shadow-sm border-0 h-100 appointment-card">
                  <div className="card-header bg-gradient-primary text-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="card-title mb-0 d-flex align-items-center">
                        <FaUser className="me-2" />
                        {name || "N/A"}
                      </h5>
                      <div>
                        <Button
                          variant="light"
                          size="sm"
                          className="btn-icon me-1"
                          onClick={() =>
                            handleEditClick({
                              id,
                              userId,
                              price,
                              paymentMethod,
                              consultantAmount,
                              productAmount,
                              productDescription,
                            })
                          }
                        >
                          <FaEdit />
                        </Button>
                        {!productAmount && (
                          <Button
                            variant="warning"
                            size="sm"
                            className="btn-icon"
                            onClick={() => handleAddProductClick({ id, userId })}
                          >
                            <FaPlus />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <div className="appointment-details">
                      {/* Subcategory */}
                      <div className="detail-item">
                        <div className="detail-icon">
                          <FaSyringe className="text-success" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Subcategory</span>
                          <span className="detail-value">{subCategory || "N/A"}</span>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="detail-item">
                        <div className="detail-icon">
                          <FaPhoneAlt className="text-warning" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Phone</span>
                          <span className="detail-value">{phone || "N/A"}</span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="detail-item">
                        <div className="detail-icon">
                          <FaCalendarAlt className="text-secondary" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Date</span>
                          <span className="detail-value">{appointmentDate || "N/A"}</span>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="detail-item">
                        <div className="detail-icon">
                          <FaClock className="text-info" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Time</span>
                          <span className="detail-value">{appointmentTime || "N/A"}</span>
                        </div>
                      </div>

                      {/* Doctor */}
                      <div className="detail-item">
                        <div className="detail-icon">
                          <FaStethoscope className="text-danger" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Doctor</span>
                          <span className="detail-value">{doctors[doctor]?.name || doctor || "N/A"}</span>
                        </div>
                      </div>

                      {/* Message */}
                      <div className="detail-item">
                        <div className="detail-icon">
                          <FaComments className="text-muted" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Message</span>
                          <span className="detail-value">{message || "N/A"}</span>
                        </div>
                      </div>

                      {/* Treatment */}
                      <div className="detail-item">
                        <div className="detail-icon">
                          <FaSyringe className="text-primary" />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Treatment</span>
                          <span className="detail-value">{treatment || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="payment-details mt-3 p-3 bg-light rounded">
                      <h6 className="mb-2 text-uppercase fw-bold text-primary">Payment Details</h6>
                      <div className="d-flex justify-content-between mb-2">
                        <span>
                          <strong>Amount:</strong>
                        </span>
                        <span className="badge bg-primary">
                          {price !== undefined && price !== null ? `RS ${price}` : "N/A"}
                        </span>
                      </div>

                      <div className="d-flex justify-content-between mb-2">
                        <span>
                          <strong>Payment Method:</strong>
                        </span>
                        <span>
                          {paymentMethod || "N/A"}{" "}
                          {paymentMethod === "Cash" ? (
                            <FaMoneyBillWave className="text-success" title="Cash Payment" />
                          ) : paymentMethod === "Online" ? (
                            <FaCreditCard className="text-primary" title="Online Payment" />
                          ) : null}
                        </span>
                      </div>

                      {/* Show Consultant Amount if available */}
                      {consultantAmount && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>
                            <strong>Consultant Amount:</strong>
                          </span>
                          <span className="badge bg-success">{`RS ${consultantAmount}`}</span>
                        </div>
                      )}

                      {/* Show Product Amount if available */}
                      {productAmount && (
                        <>
                          <div className="d-flex justify-content-between mb-2">
                            <span>
                              <strong>Product Amount:</strong>
                            </span>
                            <span className="badge bg-warning text-dark">{`RS ${productAmount}`}</span>
                          </div>
                          {productDescription && (
                            <div className="product-description mt-2">
                              <small>
                                <strong>Product Description:</strong> {productDescription}
                              </small>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Call Button */}
                    <a href={`tel:${phone}`} className="btn btn-outline-info mt-3 w-100 call-btn">
                      <FaPhoneAlt className="me-2" />
                      Call
                    </a>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="text-center p-5 bg-light rounded shadow-sm">
          <FaSearch className="text-muted mb-3" style={{ fontSize: "3rem" }} />
          <p className="lead text-muted">
            {searchTerm ? "No appointments match your search criteria." : "No attended appointments found for today."}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header className="bg-primary text-white">
          <Modal.Title>Edit Appointment Details</Modal.Title>
          <Button variant="close" className="btn-close-white" onClick={() => setShowEditModal(false)} />
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Payment Method</Form.Label>
              <Form.Select
                name="paymentMethod"
                value={editFormData.paymentMethod}
                onChange={handleEditFormChange}
                className="form-control"
              >
                <option value="">Select Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Price (RS)</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={editFormData.price}
                onChange={handleEditFormChange}
                placeholder="Enter price"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Consultant Amount (RS)</Form.Label>
              <Form.Control
                type="number"
                name="consultantAmount"
                value={editFormData.consultantAmount}
                onChange={handleEditFormChange}
                placeholder="Enter consultant amount"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Product Amount (RS)</Form.Label>
              <Form.Control
                type="number"
                name="productAmount"
                value={editFormData.productAmount}
                onChange={handleEditFormChange}
                placeholder="Enter product amount"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Product Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="productDescription"
                value={editFormData.productDescription}
                onChange={handleEditFormChange}
                placeholder="Enter product description"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            <FaTimes className="me-2" /> Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            <FaSave className="me-2" /> Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Product Modal */}
      <Modal show={showAddProductModal} onHide={() => setShowAddProductModal(false)} centered>
        <Modal.Header className="bg-warning text-dark">
          <Modal.Title>Add Product</Modal.Title>
          <Button variant="close" onClick={() => setShowAddProductModal(false)} />
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Product Amount (RS)</Form.Label>
              <Form.Control
                type="number"
                name="productAmount"
                value={addProductData.productAmount}
                onChange={handleProductFormChange}
                placeholder="Enter product amount"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Product Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="productDescription"
                value={addProductData.productDescription}
                onChange={handleProductFormChange}
                placeholder="Enter product description"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddProductModal(false)}>
            <FaTimes className="me-2" /> Cancel
          </Button>
          <Button variant="warning" onClick={handleSaveProduct} disabled={!addProductData.productAmount}>
            <FaShoppingCart className="me-2" /> Add Product
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Scoped Styles */}
      <style jsx>{`
        .bg-gradient-primary {
          background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
          color: white;
        }
        
        .appointment-card {
          border-radius: 10px;
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05) !important;
        }
        
        .appointment-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
        }
        
        .card-header {
          border-bottom: none;
        }
        
        .btn-icon {
          width: 32px;
          height: 32px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .detail-item {
          display: flex;
          margin-bottom: 12px;
          align-items: flex-start;
        }
        
        .detail-icon {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8f9fa;
          border-radius: 50%;
          margin-right: 10px;
        }
        
        .detail-content {
          flex: 1;
        }
        
        .detail-label {
          display: block;
          font-size: 0.75rem;
          color: #6c757d;
          margin-bottom: 2px;
        }
        
        .detail-value {
          font-weight: 500;
        }
        
        .payment-details {
          background-color: #f8f9fa;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        
        .call-btn {
          border-radius: 50px;
          font-weight: 500;
          transition: all 0.3s;
        }
        
        .call-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(23, 162, 184, 0.3);
        }
        
        .badge {
          padding: 0.5em 0.8em;
          border-radius: 50px;
          font-weight: 500;
        }
        
        .icon-container {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .search-container {
          max-width: 400px;
        }
        
        .product-description {
          background-color: #fff;
          padding: 8px;
          border-radius: 4px;
          border-left: 3px solid #ffc107;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .display-4 {
            font-size: 1.75rem;
          }
          
          .detail-item {
            margin-bottom: 8px;
          }
          
          .detail-icon {
            width: 24px;
            height: 24px;
          }
        }
        
        /* Modal customizations */
        :global(.modal-content) {
          border: none;
          border-radius: 10px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        }
        
        :global(.btn-close-white) {
          filter: brightness(0) invert(1);
        }
      `}</style>
    </div>
  )
}

export default TodayAttendedAppointments
