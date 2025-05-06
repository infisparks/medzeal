"use client"
import { useEffect, useState, useMemo } from "react"
import { db } from "../../../lib/firebaseConfig"
import { ref, onValue } from "firebase/database"
import * as XLSX from "xlsx"
import { 
  FaFileExport, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaCalendarDay,
  FaUser,
  FaClock
} from "react-icons/fa"

const ChangesHistoryPage = () => {
  const [changesHistory, setChangesHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedActionType, setSelectedActionType] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [uniqueUsers, setUniqueUsers] = useState([])

  // Get the current year dynamically
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const changesHistoryRef = ref(db, "changesHistory")
    setLoading(true)

    const unsubscribe = onValue(changesHistoryRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        // Transform the nested data structure into a flat array
        const historyArray = []
        const usersSet = new Set()

        // First level: user ID
        Object.entries(data).forEach(([userId, appointments]) => {
          // Second level: appointment ID
          Object.entries(appointments).forEach(([appointmentId, changes]) => {
            // Third level: change entries
            Object.entries(changes).forEach(([changeId, changeDetails]) => {
              // Add user to unique users set
              if (changeDetails.enteredByEmail) {
                usersSet.add(changeDetails.enteredByEmail)
              }

              // Format the change entry
              const formattedChange = {
                id: changeId,
                appointmentId,
                userId,
                ...changeDetails,
                // Handle both old and new format
                actionType: changeDetails.actionType || changeDetails.type || "unknown",
                timestamp: changeDetails.timestamp || Date.now(),
              }
              historyArray.push(formattedChange)
            })
          })
        })

        // Sort by timestamp descending (newest first)
        historyArray.sort((a, b) => b.timestamp - a.timestamp)
        setChangesHistory(historyArray)
        setUniqueUsers(Array.from(usersSet))
      } else {
        setChangesHistory([])
        setUniqueUsers([])
      }
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  // Filtered History
  const filteredHistory = useMemo(() => {
    if (!changesHistory.length) return []

    return changesHistory.filter((change) => {
      // Get date from timestamp
      const changeDate = new Date(change.timestamp)
      const dateString = changeDate.toISOString().split("T")[0]
      const monthString = String(changeDate.getMonth() + 1).padStart(2, "0")
      const yearString = String(changeDate.getFullYear())

      // Check date filters
      const isDateMatch = selectedDate ? dateString === selectedDate : true
      const isMonthMatch = selectedMonth ? monthString === selectedMonth : true
      const isYearMatch = selectedYear ? yearString === selectedYear : true
      
      // Check action type filter
      const isActionTypeMatch = selectedActionType ? 
        (change.actionType === selectedActionType || change.type === selectedActionType) : true
      
      // Check user filter
      const isUserMatch = selectedUser ? change.enteredByEmail === selectedUser : true

      // Check search term
      const isSearchMatch = searchTerm ? 
        (
          // Search in changes array if it exists
          (change.changes && Array.isArray(change.changes) && 
            change.changes.some(c => 
              typeof c === 'string' ? 
                c.toLowerCase().includes(searchTerm.toLowerCase()) : 
                (c.field && c.field.toLowerCase().includes(searchTerm.toLowerCase()))
            )
          ) ||
          // Search in appointment data if it exists
          (change.appointmentData && 
            Object.values(change.appointmentData).some(value => 
              value && typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
            )
          ) ||
          // Search in user info
          (change.enteredByEmail && change.enteredByEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (change.enteredByName && change.enteredByName.toLowerCase().includes(searchTerm.toLowerCase()))
        ) : true

      return isDateMatch && isMonthMatch && isYearMatch && isActionTypeMatch && isUserMatch && isSearchMatch
    })
  }, [changesHistory, selectedDate, selectedMonth, selectedYear, selectedActionType, selectedUser, searchTerm])

  // Export to Excel
  const handleExport = () => {
    if (filteredHistory.length === 0) {
      alert("No data to export.")
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredHistory.map((change) => {
        // Format changes for Excel
        let changesText = ""
        if (change.changes) {
          if (Array.isArray(change.changes)) {
            if (typeof change.changes[0] === 'string') {
              // Old format: array of strings
              changesText = change.changes.join("; ")
            } else {
              // New format: array of objects
              changesText = change.changes.map(c => 
                `${c.field} changed from ${c.from || 'empty'} to ${c.to || 'empty'}`
              ).join("; ")
            }
          }
        }

        // Format appointment data for Excel
        let appointmentDataText = ""
        if (change.appointmentData) {
          appointmentDataText = Object.entries(change.appointmentData)
            .filter(([key]) => !key.startsWith('_') && key !== 'id' && key !== 'key')
            .map(([key, value]) => `${key}: ${value}`)
            .join("; ")
        }

        return {
          Date: new Date(change.timestamp).toLocaleString(),
          Action: change.actionType || change.type || "Unknown",
          User: change.enteredByEmail || "Unknown",
          UserName: change.enteredByName || "Unknown",
          Changes: changesText,
          AppointmentData: appointmentDataText,
          AppointmentId: change.appointmentId,
          UserId: change.userId
        }
      })
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Changes History")

    // Generate and download the Excel file
    XLSX.writeFile(workbook, `changes-history-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A"
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Today's Date
  const today = new Date().toISOString().split("T")[0]

  // Render change details based on type
  const renderChangeDetails = (change) => {
    // For delete actions
    if (change.actionType === "delete" || change.type === "delete") {
      return (
        <div className="deleted-appointment-data">
          <p className="mb-2 fw-bold">Deleted Appointment Details:</p>
          {change.appointmentData ? (
            <ul className="list-unstyled mb-0">
              <li><strong>Name:</strong> {change.appointmentData.name || "N/A"}</li>
              <li><strong>Date:</strong> {change.appointmentData.appointmentDate || "N/A"}</li>
              <li><strong>Time:</strong> {change.appointmentData.appointmentTime || "N/A"}</li>
              <li><strong>Doctor:</strong> {change.appointmentData.doctor || "N/A"}</li>
              <li><strong>Phone:</strong> {change.appointmentData.phone || "N/A"}</li>
              {change.appointmentData.price && (
                <li><strong>Price:</strong> ₹{change.appointmentData.price}</li>
              )}
              {change.appointmentData.consultantAmount && (
                <li><strong>Consultant Amount:</strong> ₹{change.appointmentData.consultantAmount}</li>
              )}
              {change.appointmentData.productAmount && (
                <li><strong>Product Amount:</strong> ₹{change.appointmentData.productAmount}</li>
              )}
              {change.appointmentData.productDescription && (
                <li><strong>Product Description:</strong> {change.appointmentData.productDescription}</li>
              )}
            </ul>
          ) : (
            <p className="text-muted">Detailed appointment data not available</p>
          )}
        </div>
      )
    }
    
    // For edit actions
    else if (change.actionType === "edit" || change.type === "edit") {
      // Handle both old and new format
      if (change.changes) {
        if (Array.isArray(change.changes)) {
          if (typeof change.changes[0] === 'string') {
            // Old format: array of strings
            return (
              <ul className="list-unstyled mb-0">
                {change.changes.map((changeText, index) => (
                  <li key={index} className="history-change-item">
                    <FaEdit className="me-2 text-muted" />
                    {changeText}
                  </li>
                ))}
              </ul>
            )
          } else {
            // New format: array of objects
            return (
              <ul className="list-unstyled mb-0">
                {change.changes.map((changeObj, index) => (
                  <li key={index} className="history-change-item">
                    <FaEdit className="me-2 text-muted" />
                    <strong>{changeObj.field}</strong> changed from{" "}
                    <span className="text-danger">{changeObj.from || "empty"}</span> to{" "}
                    <span className="text-success">{changeObj.to || "empty"}</span>
                  </li>
                ))}
              </ul>
            )
          }
        }
      }
      return <p className="text-muted">No change details available</p>
    }
    
    // For move to bin actions
    else if (change.actionType === "move-to-bin") {
      return (
        <p>Appointment was moved to bin</p>
      )
    }
    
    // Default case
    return <p className="text-muted">No details available for this action</p>
  }

  return (
    <div className="container mt-5">
      <h1 className="display-4 text-center mb-4">Changes History</h1>

      {/* Search Input */}
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text bg-white">
            <FaSearch className="text-muted" />
          </span>
          <input
            type="text"
            placeholder="Search in changes history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control border-start-0"
          />
        </div>
      </div>

      {/* Filter Inputs */}
      <div className="mb-4">
        <div className="card shadow-sm">
          <div className="card-header bg-light d-flex align-items-center">
            <FaFilter className="me-2" />
            <h5 className="mb-0">Filters</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3 mb-3">
                <label className="form-label">Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Month:</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="form-select">
                  <option value="">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={String(i + 1).padStart(2, "0")}>
                      {new Date(0, i).toLocaleString("default", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Year:</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="form-select">
                  <option value="">All Years</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = currentYear - i
                    return (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Action Type:</label>
                <select value={selectedActionType} onChange={(e) => setSelectedActionType(e.target.value)} className="form-select">
                  <option value="">All Actions</option>
                  <option value="edit">Edit</option>
                  <option value="delete">Delete</option>
                  <option value="move-to-bin">Move to Bin</option>
                </select>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">User:</label>
                <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="form-select">
                  <option value="">All Users</option>
                  {uniqueUsers.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <button onClick={() => {
                  setSelectedDate("")
                  setSelectedMonth("")
                  setSelectedYear("")
                  setSelectedActionType("")
                  setSelectedUser("")
                  setSearchTerm("")
                }} className="btn btn-secondary me-2">
                  Clear Filters
                </button>
                <button onClick={() => setSelectedDate(today)} className="btn btn-primary me-2">
                  <FaCalendarDay className="me-2" />
                  Today Changes
                </button>
                <button onClick={handleExport} className="btn btn-success">
                  <FaFileExport className="me-2" />
                  Export to Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <div className="alert alert-info">
          <div className="d-flex justify-content-between align-items-center">
            <span>
              <strong>Total Changes:</strong> {filteredHistory.length}
            </span>
            <span>
              <strong>Filtered from:</strong> {changesHistory.length} total records
            </span>
          </div>
        </div>
      </div>

      {/* Changes History List */}
      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading changes history...</p>
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="history-timeline">
          {filteredHistory.map((change) => (
            <div key={change.id} className="history-item">
              <div className="history-time">
                <div className={`history-dot ${
                  change.actionType === "delete" || change.type === "delete" 
                    ? "history-dot-delete" 
                    : change.actionType === "move-to-bin" 
                      ? "history-dot-bin" 
                      : "history-dot-edit"
                }`}></div>
                <div className="history-date">{formatDate(change.timestamp)}</div>
              </div>
              <div className="history-content">
                <div className={`history-card ${
                  change.actionType === "delete" || change.type === "delete" 
                    ? "history-card-delete" 
                    : ""
                }`}>
                  <div className="history-header">
                    <div className="d-flex align-items-center">
                      {change.actionType === "delete" || change.type === "delete" ? (
                        <FaTrash className="me-2 text-danger" />
                      ) : (
                        <FaEdit className="me-2 text-primary" />
                      )}
                      <span className={`badge ${
                        change.actionType === "delete" || change.type === "delete" 
                          ? "bg-danger" 
                          : change.actionType === "move-to-bin" 
                            ? "bg-warning text-dark" 
                            : "bg-primary"
                      }`}>
                        {change.actionType === "delete" || change.type === "delete" 
                          ? "Delete" 
                          : change.actionType === "move-to-bin" 
                            ? "Move to Bin" 
                            : "Edit"}
                      </span>
                      <span className="ms-2">
                        Appointment ID: <strong>{change.appointmentId}</strong>
                      </span>
                    </div>
                    <div className="history-user">
                      <FaUser className="me-1" />
                      <span>{change.enteredByName || "Unknown"}</span>
                      <span className="text-muted ms-2">({change.enteredByEmail || "Unknown email"})</span>
                    </div>
                  </div>
                  <div className="history-changes">
                    {renderChangeDetails(change)}
                  </div>
                  <div className="history-footer">
                    <small className="text-muted">
                      <FaClock className="me-1" />
                      {formatDate(change.timestamp)}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-5 bg-light rounded shadow-sm">
          <FaSearch className="text-muted mb-3" style={{ fontSize: "3rem" }} />
          <p className="lead text-muted">No changes history found for the selected criteria.</p>
        </div>
      )}

      {/* Custom CSS */}
      <style jsx>{`
        /* History timeline styles */
        .history-timeline {
          position: relative;
          padding-left: 30px;
          margin-bottom: 50px;
        }
        
        .history-timeline::before {
          content: '';
          position: absolute;
          left: 10px;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: #dee2e6;
        }
        
        .history-item {
          position: relative;
          margin-bottom: 20px;
        }
        
        .history-time {
          position: relative;
          margin-bottom: 8px;
        }
        
        .history-dot {
          position: absolute;
          left: -30px;
          top: 5px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #0d6efd;
          border: 3px solid #fff;
          box-shadow: 0 0 0 2px #0d6efd;
        }
        
        .history-dot-delete {
          background-color: #dc3545;
          box-shadow: 0 0 0 2px #dc3545;
        }
        
        .history-dot-bin {
          background-color: #ffc107;
          box-shadow: 0 0 0 2px #ffc107;
        }
        
        .history-date {
          font-size: 0.85rem;
          color: #6c757d;
          font-weight: 500;
        }
        
        .history-card {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        
        .history-card:hover {
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .history-card-delete {
          background-color: #ffebee;
          border-left: 4px solid #dc3545;
        }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .history-user {
          font-size: 0.85rem;
          color: #6c757d;
          display: flex;
          align-items: center;
        }
        
        .history-changes {
          font-size: 0.95rem;
          padding: 10px;
          background-color: rgba(255, 255, 255, 0.7);
          border-radius: 5px;
        }
        
        .history-change-item {
          padding: 8px 0;
          border-bottom: 1px dashed #dee2e6;
          display: flex;
          align-items: flex-start;
        }
        
        .history-change-item:last-child {
          border-bottom: none;
        }
        
        .history-footer {
          margin-top: 10px;
          text-align: right;
        }
        
        .deleted-appointment-data {
          background-color: #fff;
          padding: 10px;
          border-radius: 5px;
          border-left: 3px solid #dc3545;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .history-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .history-user {
            margin-top: 5px;
          }
        }
      `}</style>
    </div>
  )
}

export default ChangesHistoryPage
