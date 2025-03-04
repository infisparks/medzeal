"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { ref, onValue, update } from "firebase/database";
import { db, storage } from "../../../lib/firebaseConfig";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import letterhead from "../../../../public/letterhead.png";
import front from "../../../../public/front.png";
import {
  FaCalendar,
  FaSearch,
  FaUser,
  FaPrescriptionBottleAlt,
  FaPlusCircle,
  FaTrash,
  FaArrowLeft,
} from "react-icons/fa";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const DoctorPrescription = () => {
  const router = useRouter();

  // State for all appointments and filtering
  const [allAppointments, setAllAppointments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Prescription form state
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [showMedicineDetails, setShowMedicineDetails] = useState(false);
  const [medicines, setMedicines] = useState([
    {
      name: "",
      consumptionDays: "",
      times: { morning: false, evening: false, night: false },
      instruction: "",
    },
  ]);
  const [overallInstruction, setOverallInstruction] = useState("");
  const [prescriptionSaved, setPrescriptionSaved] = useState(false);

  // Previous history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyModalItems, setHistoryModalItems] = useState([]);

  // Refs for hidden PDF pages
  const frontRef = useRef(null);
  const prescriptionRef = useRef(null);

  // Modal styles
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalContentStyle = {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "5px",
    width: "80%",
    maxHeight: "80%",
    overflowY: "auto",
    position: "relative",
  };

  const closeButtonStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    fontSize: "1.2rem",
  };

  // Fetch appointments from Firebase
  useEffect(() => {
    const appointmentsRef = ref(db, "appointments");
    const unsubscribe = onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val();
      const all = [];
      if (data) {
        Object.entries(data).forEach(([uid, userAppointments]) => {
          Object.entries(userAppointments).forEach(([appointmentId, appointment]) => {
            all.push({ ...appointment, uid, appointmentId });
          });
        });
      }
      setAllAppointments(all);
      const filtered = all.filter((a) => a.appointmentDate === selectedDate);
      setAppointments(filtered);
    });
    return () => unsubscribe();
  }, [selectedDate]);

  // Filter appointments based on search term
  const filteredAppointments = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return appointments.filter((appointment) => {
      return (
        appointment.doctor.toLowerCase().includes(lowerSearch) ||
        appointment.treatment.toLowerCase().includes(lowerSearch) ||
        appointment.subCategory.toLowerCase().includes(lowerSearch) ||
        appointment.name.toLowerCase().includes(lowerSearch) ||
        appointment.phone.includes(searchTerm)
      );
    });
  }, [appointments, searchTerm]);

  // Compute previous medicine names for the selected patient
  const previousMedicineNames = useMemo(() => {
    if (!selectedAppointment) return [];
    const patientHistory = allAppointments.filter(
      (a) => a.phone === selectedAppointment.phone && a.presciption
    );
    const medsSet = new Set();
    patientHistory.forEach((a) => {
      if (a.presciption.medicines && Array.isArray(a.presciption.medicines)) {
        a.presciption.medicines.forEach((med) => {
          if (med.name && med.name.trim() !== "") {
            medsSet.add(med.name);
          }
        });
      }
    });
    return Array.from(medsSet);
  }, [selectedAppointment, allAppointments]);

  // Handler for selecting a suggestion
  const handleSelectSuggestion = (index, suggestion) => {
    const newMedicines = [...medicines];
    newMedicines[index].name = suggestion;
    setMedicines(newMedicines);
  };

  // --- Prescription Logic ---
  const handleSelectAppointmentForAdd = (appointment) => {
    setSelectedAppointment(appointment);
    setSymptoms("");
    setShowMedicineDetails(false);
    setMedicines([
      {
        name: "",
        consumptionDays: "",
        times: { morning: false, evening: false, night: false },
        instruction: "",
      },
    ]);
    setOverallInstruction("");
    setPrescriptionSaved(false);
  };

  const handleSelectAppointmentForUpdate = (appointment) => {
    if (appointment.presciption) {
      setSelectedAppointment(appointment);
      setSymptoms(appointment.presciption.symptoms || "");
      setOverallInstruction(appointment.presciption.overallInstruction || "");
      if (
        appointment.presciption.medicines &&
        appointment.presciption.medicines.length > 0
      ) {
        setMedicines(appointment.presciption.medicines);
        setShowMedicineDetails(true);
      } else {
        setMedicines([
          {
            name: "",
            consumptionDays: "",
            times: { morning: false, evening: false, night: false },
            instruction: "",
          },
        ]);
        setShowMedicineDetails(false);
      }
      setPrescriptionSaved(false);
    }
  };

  const handleDownloadExistingPrescription = (appointment) => {
    if (appointment.presciption) {
      setSelectedAppointment(appointment);
      setSymptoms(appointment.presciption.symptoms || "");
      setOverallInstruction(appointment.presciption.overallInstruction || "");
      if (
        appointment.presciption.medicines &&
        appointment.presciption.medicines.length > 0
      ) {
        setMedicines(appointment.presciption.medicines);
        setShowMedicineDetails(true);
      } else {
        setMedicines([]);
        setShowMedicineDetails(false);
      }
      setTimeout(() => {
        generateAndUploadPDF(false);
      }, 500);
    }
  };

  // Medicine Details Functions
  const toggleMedicineDetails = () => {
    setShowMedicineDetails((prev) => !prev);
  };

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: "",
        consumptionDays: "",
        times: { morning: false, evening: false, night: false },
        instruction: "",
      },
    ]);
  };

  const handleRemoveMedicine = (index) => {
    const newMedicines = medicines.filter((_, i) => i !== index);
    setMedicines(newMedicines);
  };

  const handleMedicineChange = (index, field, value) => {
    const newMedicines = [...medicines];
    newMedicines[index][field] = value;
    setMedicines(newMedicines);
  };

  const handleTimeToggle = (index, time) => {
    const newMedicines = [...medicines];
    newMedicines[index].times[time] = !newMedicines[index].times[time];
    setMedicines(newMedicines);
  };

  // --- PDF Generation & Compression ---
  const generatePDFBlob = async () => {
    if (!frontRef.current || !prescriptionRef.current) return null;
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();

    // Page 1: Front Page
    const canvasFront = await html2canvas(frontRef.current, { scale: 1.5 });
    const pdfHeightFront = (canvasFront.height * pdfWidth) / canvasFront.width;
    pdf.addImage(
      canvasFront.toDataURL("image/jpeg", 0.7),
      "JPEG",
      0,
      0,
      pdfWidth,
      pdfHeightFront
    );

    // Page 2: Prescription Details
    pdf.addPage();
    const canvasPrescription = await html2canvas(prescriptionRef.current, { scale: 1.5 });
    const pdfHeightPrescription = (canvasPrescription.height * pdfWidth) / canvasPrescription.width;
    pdf.addImage(
      canvasPrescription.toDataURL("image/jpeg", 0.7),
      "JPEG",
      0,
      0,
      pdfWidth,
      pdfHeightPrescription
    );
    return pdf.output("blob");
  };

  const downloadPrescriptionReport = async () => {
    const pdfBlob = await generatePDFBlob();
    if (!pdfBlob) return;
    const blobURL = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = blobURL;
    link.download = "PrescriptionReport.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobURL);
  };

  // Upload PDF to Firebase & send via WhatsApp
  const uploadPDFAndSendWhatsApp = async () => {
    if (!selectedAppointment) return;
    const pdfBlob = await generatePDFBlob();
    if (!pdfBlob) return;
    try {
      const pdfStorageRef = storageRef(
        storage,
        `prescriptions/${selectedAppointment.uid}/${selectedAppointment.appointmentId}.pdf`
      );
      await uploadBytes(pdfStorageRef, pdfBlob);
      const downloadURL = await getDownloadURL(pdfStorageRef);
      const payload = {
        token: "99583991572",
        number: `91${selectedAppointment.phone}`,
        imageUrl: downloadURL,
        caption:
          "Your prescription has been generated. Please check your attachment.",
      };
      await fetch("https://wa.medblisss.com/send-image-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      alert("Prescription report sent to the user via WhatsApp!");
    } catch (error) {
      console.error("Error uploading or sending PDF via WhatsApp:", error);
      alert("Error sending prescription via WhatsApp.");
    }
  };

  // Combined function for PDF actions
  const generateAndUploadPDF = async (uploadAndSend = true) => {
    if (uploadAndSend) {
      await uploadPDFAndSendWhatsApp();
    } else {
      downloadPrescriptionReport();
    }
  };

  // Form Submit Handler
  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    const prescriptionData = {
      symptoms,
      medicines: showMedicineDetails ? medicines : [],
      overallInstruction,
      createdAt: new Date().toISOString(),
    };
    const appointmentRef = ref(
      db,
      `appointments/${selectedAppointment.uid}/${selectedAppointment.appointmentId}`
    );
    try {
      await update(appointmentRef, { presciption: prescriptionData });
      alert("Prescription saved successfully!");
      setPrescriptionSaved(true);
      generateAndUploadPDF(true);
    } catch (error) {
      console.error("Error saving prescription:", error);
      alert("Error saving prescription.");
    }
  };

  // --- Render ---
  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">
        <FaPrescriptionBottleAlt className="me-2" />
        Patient Appointments
      </h1>

      {/* Filter Controls */}
      <div className="row mb-3 align-items-center">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text">
              <FaCalendar />
            </span>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-8">
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by doctor, treatment, subcategory, or name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="row">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment, idx) => {
            const phoneHistory = allAppointments.filter(
              (a) =>
                a.phone === appointment.phone &&
                a.presciption &&
                a.appointmentId !== appointment.appointmentId
            );
            return (
              <div className="col-md-6 mb-3" key={idx}>
                <div className="card shadow-sm border-primary h-100">
                  <div className="card-body">
                    <h5 className="card-title">
                      <FaUser className="me-2 text-primary" /> {appointment.name}
                    </h5>
                    <p className="card-text mb-1">
                      <strong>Doctor:</strong> {appointment.doctor}
                    </p>
                    <p className="card-text mb-1">
                      <strong>Treatment:</strong> {appointment.treatment}
                    </p>
                    <p className="card-text mb-1">
                      <strong>Subcategory:</strong> {appointment.subCategory}
                    </p>
                    <p className="card-text">
                      <strong>Phone:</strong> {appointment.phone}
                    </p>
                    {phoneHistory.length > 0 && (
                      <button
                        className="btn btn-secondary btn-sm mt-2"
                        onClick={() => {
                          setHistoryModalItems(phoneHistory);
                          setShowHistoryModal(true);
                        }}
                      >
                        See Previous History
                      </button>
                    )}
                    <div className="mt-3">
                      {appointment.presciption ? (
                        <>
                          <button
                            className="btn btn-info me-2 btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadExistingPrescription(appointment);
                            }}
                          >
                            Download Prescription
                          </button>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAppointmentForUpdate(appointment);
                            }}
                          >
                            Update Prescription
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAppointmentForAdd(appointment);
                          }}
                        >
                          Add Prescription
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-12">
            <p className="text-center text-muted">
              No appointments found for the selected date.
            </p>
          </div>
        )}
      </div>

      {/* Prescription Form */}
      {selectedAppointment && (
        <div className="card mt-5 border-success">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h4>
              Add/Update Prescription for {selectedAppointment.name}
            </h4>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setSelectedAppointment(null)}
            >
              <FaArrowLeft className="me-1" /> Back to Appointments
            </button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmitPrescription}>
              <div className="mb-3">
                <label className="form-label">
                  <strong>Symptoms/Disease:</strong>
                </label>
                <textarea
                  className="form-control"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                  placeholder="Enter symptoms or disease..."
                ></textarea>
              </div>

              <div className="mb-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={toggleMedicineDetails}
                >
                  <FaPlusCircle className="me-2" />
                  {showMedicineDetails
                    ? "Hide Medicine Details"
                    : "Add Medicine Details"}
                </button>
              </div>

              {showMedicineDetails && (
                <>
                  {medicines.map((medicine, index) => (
                    <div key={index} className="card mb-3 border-secondary">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h5 className="card-title">
                            Medicine {index + 1}
                          </h5>
                          {medicines.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveMedicine(index)}
                            >
                              <FaTrash className="me-1" /> Remove
                            </button>
                          )}
                        </div>
                        {/* Medicine Name with Autocomplete */}
                        <div className="mb-2" style={{ position: "relative" }}>
                          <label className="form-label">
                            Medicine Name:
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={medicine.name}
                            onChange={(e) =>
                              handleMedicineChange(index, "name", e.target.value)
                            }
                            placeholder="Enter medicine name"
                          />
                          {medicine.name &&
                            previousMedicineNames.filter((sug) =>
                              sug.toLowerCase().startsWith(medicine.name.toLowerCase())
                            ).length > 0 && (
                              <ul
                                style={{
                                  position: "absolute",
                                  top: "100%",
                                  left: 0,
                                  right: 0,
                                  background: "#fff",
                                  border: "1px solid #ccc",
                                  zIndex: 10,
                                  listStyle: "none",
                                  margin: 0,
                                  padding: 0,
                                }}
                              >
                                {previousMedicineNames
                                  .filter((sug) =>
                                    sug.toLowerCase().startsWith(medicine.name.toLowerCase())
                                  )
                                  .map((suggestion, idx) => (
                                    <li
                                      key={idx}
                                      style={{ padding: "8px", cursor: "pointer" }}
                                      onClick={() => handleSelectSuggestion(index, suggestion)}
                                    >
                                      {suggestion}
                                    </li>
                                  ))}
                              </ul>
                            )}
                        </div>
                        <div className="mb-2">
                          <label className="form-label">
                            Consumption Days:
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={medicine.consumptionDays}
                            onChange={(e) =>
                              handleMedicineChange(
                                index,
                                "consumptionDays",
                                e.target.value
                              )
                            }
                            placeholder="e.g., 7"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label">Time:</label>
                          <div>
                            <div className="form-check form-check-inline">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={medicine.times.morning}
                                onChange={() =>
                                  handleTimeToggle(index, "morning")
                                }
                                id={`morning-${index}`}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`morning-${index}`}
                              >
                                Morning
                              </label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={medicine.times.evening}
                                onChange={() =>
                                  handleTimeToggle(index, "evening")
                                }
                                id={`evening-${index}`}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`evening-${index}`}
                              >
                                Evening
                              </label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={medicine.times.night}
                                onChange={() =>
                                  handleTimeToggle(index, "night")
                                }
                                id={`night-${index}`}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`night-${index}`}
                              >
                                Night
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="form-label">
                            Medicine Instruction (Optional):
                          </label>
                          <textarea
                            className="form-control"
                            value={medicine.instruction}
                            onChange={(e) =>
                              handleMedicineChange(index, "instruction", e.target.value)
                            }
                            rows={2}
                            placeholder="Additional instruction for this medicine"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-primary mb-3"
                    onClick={addMedicine}
                  >
                    <FaPlusCircle className="me-2" />
                    Add More Medicine
                  </button>
                </>
              )}

              <div className="mb-3">
                <label className="form-label">
                  <strong>Overall Instructions:</strong>
                </label>
                <textarea
                  className="form-control"
                  value={overallInstruction}
                  onChange={(e) => setOverallInstruction(e.target.value)}
                  rows={3}
                  placeholder="Any additional instructions..."
                ></textarea>
              </div>
              <button type="submit" className="btn btn-success">
                Save Prescription
              </button>
            </form>

            {prescriptionSaved && (
              <div className="mt-3">
                <button
                  type="button"
                  className="btn btn-info"
                  onClick={downloadPrescriptionReport}
                >
                  Download Prescription
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden PDF Pages */}
      {selectedAppointment && (
        <>
          {/* Page 1: Front Page */}
          <div
            ref={frontRef}
            style={{
              width: "210mm",
              height: "297mm",
              overflow: "hidden",
              position: "absolute",
              top: "-10000px",
              left: "-10000px",
            }}
          >
            <img
              src={front.src}
              alt="Front Page"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Page 2: Prescription Details */}
          <div
            ref={prescriptionRef}
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "20mm",
              backgroundImage: `url(${letterhead.src})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center top",
              color: "#000",
              position: "absolute",
              top: "-10000px",
              left: "-10000px",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "10mm" }}></div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10mm",
              }}
            >
              <div style={{ width: "45%" }}>
                <p style={{ fontSize: "12pt", margin: "4px 0" }}>
                  <strong>Name:</strong> {selectedAppointment.name}
                </p>
                <p style={{ fontSize: "12pt", margin: "4px 0" }}>
                  <strong>Phone:</strong> {selectedAppointment.phone}
                </p>
              </div>
              <div style={{ width: "45%", textAlign: "right" }}>
                <p style={{ fontSize: "12pt", margin: "4px 0" }}>
                  <strong>Doctor:</strong> {selectedAppointment.doctor}
                </p>
                <p style={{ fontSize: "12pt", margin: "4px 0" }}>
                  <strong>Treatment:</strong> {selectedAppointment.treatment}
                </p>
                <p style={{ fontSize: "12pt", margin: "4px 0" }}>
                  <strong>Subcategory:</strong> {selectedAppointment.subCategory}
                </p>
              </div>
            </div>
            <hr
              style={{
                border: "none",
                borderBottom: "1px solid #ccc",
                marginBottom: "10mm",
              }}
            />
            <div style={{ marginBottom: "10mm" }}>
              <h3 style={{ fontSize: "14pt", marginBottom: "4mm" }}>
                Prescription Details
              </h3>
              <p style={{ fontSize: "12pt", margin: "4px 0" }}>
                <strong>Symptoms/Disease:</strong> {symptoms}
              </p>
              {showMedicineDetails && medicines.length > 0 && (
                <div style={{ marginTop: "5mm" }}>
                  <div
                    style={{
                      display: "flex",
                      padding: "8px 0",
                      borderBottom: "1px solid #eee",
                      fontWeight: "bold",
                    }}
                  >
                    <div style={{ flex: 3 }}>Medicine Name</div>
                    <div style={{ flex: 1, textAlign: "center" }}>Days</div>
                    <div style={{ flex: 2, textAlign: "center" }}>Time</div>
                    <div style={{ flex: 4 }}>Instruction</div>
                  </div>
                  {medicines.map((medicine, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        padding: "8px 0",
                        borderBottom: "1px solid #f5f5f5",
                      }}
                    >
                      <div style={{ flex: 3 }}>{medicine.name}</div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        {medicine.consumptionDays}
                      </div>
                      <div style={{ flex: 2, textAlign: "center" }}>
                        {medicine.times.morning ? "Morning " : ""}
                        {medicine.times.evening ? "Evening " : ""}
                        {medicine.times.night ? "Night" : ""}
                      </div>
                      <div
                        style={{
                          flex: 4,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {medicine.instruction}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginBottom: "10mm" }}>
              <h3 style={{ fontSize: "14pt", marginBottom: "4mm" }}>
                Overall Instructions
              </h3>
              <p style={{ fontSize: "12pt" }}>{overallInstruction}</p>
            </div>
            <hr
              style={{
                border: "none",
                borderBottom: "1px solid #ccc",
                marginBottom: "5mm",
              }}
            />
            <div style={{ textAlign: "center", fontSize: "10pt" }}>
              <p>Report generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </>
      )}

      {/* Previous History Modal */}
      {showHistoryModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <button
              style={closeButtonStyle}
              onClick={() => setShowHistoryModal(false)}
            >
              &times;
            </button>
            <h4>Previous Prescription History</h4>
            {historyModalItems.map((item, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  marginBottom: "1rem",
                  padding: "1rem",
                }}
              >
                <p>
                  <strong>Appointment Date:</strong> {item.appointmentDate}
                </p>
                <p>
                  <strong>Symptoms/Disease:</strong>{" "}
                  {item.presciption.symptoms}
                </p>
                <p>
                  <strong>Overall Instructions:</strong>{" "}
                  {item.presciption.overallInstruction}
                </p>
                {item.presciption.medicines &&
                  item.presciption.medicines.length > 0 && (
                    <div>
                      <h5>Medicines:</h5>
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Days</th>
                            <th>Time</th>
                            <th>Instruction</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.presciption.medicines.map((med, i) => (
                            <tr key={i}>
                              <td>{med.name}</td>
                              <td>{med.consumptionDays}</td>
                              <td>
                                {(med.times.morning ? "Morning " : "") +
                                  (med.times.evening ? "Evening " : "") +
                                  (med.times.night ? "Night" : "")}
                              </td>
                              <td
                                style={{
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}
                              >
                                {med.instruction}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPrescription;
