"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { ref, onValue, update } from "firebase/database";
import { db, storage } from "../../../lib/firebaseConfig"; // Assuming correct path
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
// Ensure correct paths to your images
import letterhead from "../../../../public/letterhead.png";
import front from "../../../../public/front.png";
import {
  FaCalendar,
  FaSearch,
  FaUser,
  FaPrescriptionBottleAlt,
  FaTrash,
  FaTimes,
  FaHistory,
  FaCamera,
  FaDownload,
  FaFileUpload,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "sonner";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

// --- Image Compression Function ---
/**
 * Compresses an image file (File or Blob) into a smaller JPEG Blob.
 * @param {File | Blob} file - The image file to compress.
 * @returns {Promise<Blob>} The compressed image Blob.
 */
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Set max dimensions for reasonable compression, e.g., max width 1200px
                const maxWidth = 1200; 
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = height * (maxWidth / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert canvas content to Blob with JPEG format and reduced quality
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed.'));
                    }
                }, 'image/jpeg', 0.7); // 0.7 is the compression quality
            };
            img.onerror = (error) => reject(error);
            img.src = event.target.result;
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};
// --- END: Image Compression Function ---

// --- START: Component Definition ---
const DoctorPrescription = () => {
  const router = useRouter();

  // States for appointments and filtering
  const [allAppointments, setAllAppointments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Prescription form state
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [prescriptionSaved, setPrescriptionSaved] = useState(false);
  
  // --- Photo/Image State (Primary Focus) ---
  // Stores file objects for new uploads: [{ file: File, preview: string, id: string }]
  const [newPhotos, setNewPhotos] = useState([]);
  // Stores saved photo objects: [{ url: string, storagePath: string }]
  const [existingPhotos, setExistingPhotos] = useState([]); 
  // --- END Photo/Image State ---

  // Previous history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyModalItems, setHistoryModalItems] = useState([]);
  const [fullScreenPhoto, setFullScreenPhoto] = useState(null);

  // Refs for hidden PDF pages
  const frontRef = useRef(null);
  const prescriptionRef = useRef(null);
  const photoInputRef = useRef(null); // Ref for hidden file input

  // --- Firebase Data Fetching ---

  // 1. Fetch appointments
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
  
  // --- Photo/Image Handlers ---

  const handlePhotoUpload = (event) => {
    if (!selectedAppointment) return;
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        const id = uuidv4();
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewPhotos(prev => [...prev, { file, preview: reader.result, id }]);
        };
        reader.readAsDataURL(file);
    });

    // Clear the input value so the same file can be selected again
    event.target.value = null; 
  };

  const handleRemovePhoto = (id) => {
    setNewPhotos(prev => prev.filter(photo => photo.id !== id));
  };
  
  const handleRemoveExistingPhoto = async (storagePath) => {
    if (!selectedAppointment) return;
    
    // 1. Delete from Firebase Storage
    const photoRef = storageRef(storage, storagePath);
    try {
        await deleteObject(photoRef);
        toast.success("Photo removed from storage.");
    } catch (error) {
        console.error("Error deleting photo from storage:", error);
        toast.error("Failed to delete photo from storage.");
        return;
    }
    
    // 2. Update local state
    const updatedExistingPhotos = existingPhotos.filter(photo => photo.storagePath !== storagePath);
    setExistingPhotos(updatedExistingPhotos);
    
    // 3. Update Firebase Realtime Database
    const appointmentRef = ref(
        db,
        `appointments/${selectedAppointment.uid}/${selectedAppointment.appointmentId}`
    );
    try {
        await update(appointmentRef, { 
            presciption: { 
                ...(selectedAppointment.presciption || {}),
                photos: updatedExistingPhotos 
            }
        });
        toast.success("Prescription photos updated in database.");
        // Also update the selectedAppointment to reflect the change immediately
        setSelectedAppointment(prev => prev ? ({ ...prev, presciption: { ...prev.presciption, photos: updatedExistingPhotos } }) : null);

    } catch (error) {
        console.error("Error updating prescription photos:", error);
        toast.error("Failed to update prescription in database.");
    }
  };
  
  /**
   * Uploads new photos after compressing them.
   */
  const uploadNewPhotos = async () => {
    if (!selectedAppointment || newPhotos.length === 0) return [];
    
    const uploadPromises = newPhotos.map(async (photo) => {
        const uniqueId = uuidv4();
        const storagePath = `prescriptions/${selectedAppointment.uid}/${selectedAppointment.appointmentId}/photo_${uniqueId}.jpeg`;
        const photoStorageRef = storageRef(storage, storagePath);
        
        // --- Compress the image before uploading ---
        const compressedBlob = await compressImage(photo.file);
        
        await uploadBytes(photoStorageRef, compressedBlob, { contentType: 'image/jpeg' });
        const downloadURL = await getDownloadURL(photoStorageRef);
        
        return { url: downloadURL, storagePath };
    });

    return Promise.all(uploadPromises);
  };
  
  // --- END Photo/Image Handlers ---

  // --- Prescription Modal Handlers ---

  const closeModal = () => {
    setSelectedAppointment(null);
    setIsPrescriptionModalOpen(false);
    setPrescriptionSaved(false);
    setNewPhotos([]);
    setExistingPhotos([]);
  };

  const resetPrescriptionState = (appointment) => {
    setSelectedAppointment(appointment);
    setExistingPhotos(appointment?.presciption?.photos || []);
    setNewPhotos([]); 
  };

  const handleSelectAppointmentForAdd = (appointment) => {
    resetPrescriptionState({ ...appointment, presciption: { photos: [] } }); 
    setIsPrescriptionModalOpen(true);
  };

  const handleSelectAppointmentForUpdate = (appointment) => {
    resetPrescriptionState(appointment);
    setIsPrescriptionModalOpen(true);
  };

  const handleDownloadExistingPrescription = (appointment) => {
    resetPrescriptionState(appointment); 
    setTimeout(() => {
        generateAndDownloadPDF(); // Call without upload/send
    }, 500);
  };
  
  // --- Form Submit Handler (UPDATED: Removed WhatsApp) ---
  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    
    if (newPhotos.length === 0 && existingPhotos.length === 0) {
        toast.error("Please upload at least one prescription photo before saving.");
        return;
    }

    const saveToastId = toast.loading("Saving photos and generating PDF...", { id: 'save-presc' });
    
    try {
        // 1. Upload new photos (now compressed)
        const newPhotoData = await uploadNewPhotos();
        const finalPhotoList = [...existingPhotos, ...newPhotoData];

        // 2. Prepare Prescription Data (Photos ONLY)
        const prescriptionData = {
            photos: finalPhotoList, 
            createdAt: new Date().toISOString(),
            // Retain placeholder text or old data for PDF formatting purposes
            symptoms: selectedAppointment?.presciption?.symptoms || "Prescription uploaded as photo.",
            overallInstruction: selectedAppointment?.presciption?.overallInstruction || "View attached photos for details.",
            medicines: selectedAppointment?.presciption?.medicines || [],
        };

        // 3. Update Firebase
        const appointmentRef = ref(
            db,
            `appointments/${selectedAppointment.uid}/${selectedAppointment.appointmentId}`
        );
        await update(appointmentRef, { presciption: prescriptionData });
        
        toast.success("Prescription photos saved successfully! Starting PDF download...", { id: saveToastId });
        setPrescriptionSaved(true);
        
        // Update local state for immediate re-render and PDF generation
        const updatedAppointment = { ...selectedAppointment, presciption: prescriptionData };
        setSelectedAppointment(updatedAppointment);
        setNewPhotos([]); 
        setExistingPhotos(finalPhotoList); 
        
        // 4. Generate and Download PDF
        await generateAndDownloadPDF(updatedAppointment); 

    } catch (error) {
        console.error("Error saving prescription:", error);
        toast.error(`Error saving prescription: ${error.message}`, { id: saveToastId });
    }
  };

  // --- PDF Generation and Download (SIMPLIFIED) ---
  
  const generatePDFBlob = useCallback(async (appointment) => {
    if (!appointment) return null;
    
    const dataToUse = appointment.presciption || {};
    const photosToInclude = dataToUse.photos || [];

    if (!frontRef.current || !prescriptionRef.current) return null;

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    
    // --- Page 1: Front Page ---
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

    // --- Page 2: Patient Info & Photo Index ---
    pdf.addPage();
    const originalContent = prescriptionRef.current.innerHTML;

    prescriptionRef.current.innerHTML = `
      <div style="text-align: center; margin-bottom: 10mm;"></div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10mm; font-size: 12pt;">
          <div style="width: 45%;">
              <p style="margin: 4px 0;"><strong>Patient:</strong> ${appointment.name}</p>
              <p style="margin: 4px 0;"><strong>Phone:</strong> ${appointment.phone}</p>
          </div>
          <div style="width: 45%; text-align: right;">
              <p style="margin: 4px 0;"><strong>Doctor:</strong> ${appointment.doctor}</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${appointment.appointmentDate}</p>
          </div>
      </div>
      <hr style="border: none; border-bottom: 1px solid #ccc; margin-bottom: 15mm;" />
      <h3 style="font-size: 18pt; text-align: center; margin-bottom: 5mm; color: #007bff;">PRESCRIPTION ATTACHMENT</h3>
      <p style="font-size: 14pt; text-align: center; color: #555;">
        This document serves as the cover page for the official prescription and reports uploaded by the doctor.
      </p>
      <p style="font-size: 14pt; text-align: center; margin-top: 15mm; color: #dc3545;">
        ${photosToInclude.length > 0 ? `Total ${photosToInclude.length} Photo(s) Attached.` : `No Prescription Photo Attached.`}
      </p>
      <div style="position: absolute; bottom: 20mm; width: 100%; text-align: center; font-size: 10pt;">
          Report generated on: ${new Date().toLocaleString()}
      </div>
    `;

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
    
    // --- Subsequent Pages: Photos ---
    if (photosToInclude.length > 0) {
        let yPos = margin;
        const imgWidth = pdfWidth - 2 * margin; // Max width of A4
        const photoMargin = 15;
        
        pdf.setFontSize(16);

        for (const photo of photosToInclude) {
            try {
                const img = await new Promise((resolve, reject) => {
                    const image = new Image();
                    image.crossOrigin = "anonymous";
                    image.onload = () => resolve(image);
                    image.onerror = (e) => reject(new Error(`Image load failed: ${e.target.src}`));
                    image.src = photo.url;
                });

                const ratio = img.width / img.height;
                let finalWidth = imgWidth;
                let finalHeight = imgWidth / ratio;
                
                // Scale down if image height is too large for one page
                if (finalHeight > pdf.internal.pageSize.getHeight() - photoMargin * 2) {
                     finalHeight = pdf.internal.pageSize.getHeight() - photoMargin * 2;
                     finalWidth = finalHeight * ratio;
                }
                
                // If the height is too much for the remaining space, start a new page
                if (yPos + finalHeight + photoMargin > pdf.internal.pageSize.getHeight()) {
                    pdf.addPage();
                    yPos = margin;
                }
                
                pdf.text(`Attached Photo ${photosToInclude.indexOf(photo) + 1}`, margin, yPos);
                yPos += 5; // Space after title
                
                pdf.addImage(img, 'JPEG', margin, yPos, finalWidth, finalHeight);
                yPos += finalHeight + photoMargin;
            } catch (e) {
                console.error("Error loading photo for PDF:", e);
                // Fallback text if image fails to load
                if (yPos + 10 > pdf.internal.pageSize.getHeight()) { pdf.addPage(); yPos = margin; }
                pdf.text(`Error loading image ${photosToInclude.indexOf(photo) + 1}`, margin, yPos);
                yPos += 15;
            }
        }
    }

    // Restore original content
    prescriptionRef.current.innerHTML = originalContent;

    return pdf.output("blob");
  }, []);

  const generateAndDownloadPDF = async (appointment = selectedAppointment) => {
    if (!appointment) { toast.error("No appointment selected to generate PDF."); return; }
    
    const pdfBlob = await generatePDFBlob(appointment);
    if (!pdfBlob) { toast.error("Failed to generate PDF."); return; }
    
    const blobURL = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = blobURL;
    link.download = `Prescription-${appointment?.name}-${appointment?.appointmentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobURL);
    toast.success("PDF downloaded successfully!");
  };
  
  // --- START: MODAL STYLES (RESTORED) ---
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalContentStyle = {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "95%",
    maxWidth: "600px", // Reduced width for simpler modal
    maxHeight: "95%",
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
    fontSize: "1.5rem",
  };
  // --- END: MODAL STYLES (RESTORED) ---


  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">
        <FaPrescriptionBottleAlt className="me-2 text-info" />
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
            const phoneHistory = allAppointments
              .filter((a) => a.phone === appointment.phone && a.presciption && a.presciption.photos && a.presciption.photos.length > 0)
              .sort((a, b) => new Date(b.presciption.createdAt) - new Date(a.presciption.createdAt));
            
            const hasPrescriptionPhotos = appointment.presciption && appointment.presciption.photos && appointment.presciption.photos.length > 0;
            
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
                    <p className="card-text">
                      <strong>Phone:</strong> {appointment.phone}
                    </p>
                    <div className="mt-3">
                      {/* Show History Button */}
                      {phoneHistory.length > 0 && (
                        <button
                          className="btn btn-secondary btn-sm me-2"
                          onClick={() => {
                            setHistoryModalItems(phoneHistory);
                            setShowHistoryModal(true);
                          }}
                        >
                          <FaHistory className="me-1"/> History ({phoneHistory.length})
                        </button>
                      )}
                      
                      {hasPrescriptionPhotos ? (
                        <>
                          <button
                            className="btn btn-info me-2 btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadExistingPrescription(appointment);
                            }}
                          >
                            <FaDownload className="me-1"/> Download
                          </button>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAppointmentForUpdate(appointment);
                            }}
                          >
                            Update Photos
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
                          Upload Prescription
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

      {/* --- Prescription Modal (Simplified) --- */}
      {isPrescriptionModalOpen && selectedAppointment && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <button style={closeButtonStyle} onClick={closeModal}>
              <FaTimes />
            </button>
            <h4 className="mb-4 text-success">
              <FaCamera className="me-2" /> Upload Prescription Photo for {selectedAppointment.name}
            </h4>
            
            <form onSubmit={handleSubmitPrescription}>
                
                {/* --- Photo Upload Section --- */}
                <div className="mb-4 p-3 border rounded">
                    <p className="mb-3 text-muted">
                        Use the button below to upload photos of the physical prescription or reports. 
                    </p>
                    
                    {/* File Input (Hidden) - CAPTURE ENABLED */}
                    <input
                        type="file"
                        ref={photoInputRef}
                        onChange={handlePhotoUpload}
                        multiple
                        accept="image/*"
                        capture="environment" 
                        style={{ display: 'none' }}
                    />
                    
                    {/* Trigger Button */}
                    <button
                        type="button"
                        className="btn btn-outline-dark w-100 mb-3"
                        onClick={() => photoInputRef.current && photoInputRef.current.click()}
                    >
                        <FaFileUpload className="me-2" /> Select or Capture Photo(s)
                    </button>
                    
                    {/* Photo Previews */}
                    {(existingPhotos.length > 0 || newPhotos.length > 0) && (
                        <div>
                            <h5>Current Photos:</h5>
                            <div className="d-flex flex-wrap gap-2 mt-3">
                                {/* Existing Photos */}
                                {existingPhotos.map((photo, index) => (
                                    <div key={photo.storagePath} className="position-relative border rounded p-1" style={{ width: '100px', height: '100px' }}>
                                        <img 
                                            src={photo.url} 
                                            alt={`Existing Photo ${index + 1}`} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                            onClick={() => setFullScreenPhoto(photo.url)}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0"
                                            style={{ width: '20px', height: '20px', lineHeight: '20px', fontSize: '10px' }}
                                            onClick={() => handleRemoveExistingPhoto(photo.storagePath)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                {/* New Photos */}
                                {newPhotos.map(photo => (
                                    <div key={photo.id} className="position-relative border rounded p-1" style={{ width: '100px', height: '100px' }}>
                                        <img 
                                            src={photo.preview} 
                                            alt="New Upload Preview" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                            onClick={() => setFullScreenPhoto(photo.preview)}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0"
                                            style={{ width: '20px', height: '20px', lineHeight: '20px', fontSize: '10px' }}
                                            onClick={() => handleRemovePhoto(photo.id)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {newPhotos.length > 0 && (
                        <p className="text-warning text-sm mt-2">
                            * {newPhotos.length} new photo(s) pending save (will be compressed upon saving).
                        </p>
                    )}
                </div>
                {/* --- End Photo Upload Section --- */}

                <div className="d-flex justify-content-center pt-3 border-top">
                    <button type="submit" className="btn btn-success" disabled={newPhotos.length === 0 && existingPhotos.length === 0}>
                        Save Photos & Download PDF
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden PDF Pages (Used for PDF Generation) */}
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
              padding: "30mm 20mm 20mm 20mm",
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
            {/* Content is dynamically generated in generatePDFBlob */}
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
              <FaTimes />
            </button>
            <h4>Prescription History for {historyModalItems[0]?.name}</h4>
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
                  <strong>Appointment Date:</strong> {item.appointmentDate} (Created: {new Date(item.presciption?.createdAt).toLocaleDateString()})
                </p>
                {/* History Photo Display (Primary Content) */}
                {item.presciption?.photos && item.presciption.photos.length > 0 && (
                    <div>
                        <h5>Uploaded Photos ({item.presciption.photos.length}):</h5>
                        <div className="d-flex flex-wrap gap-2">
                            {item.presciption.photos.map((photo, i) => (
                                <img
                                    key={i}
                                    src={photo.url}
                                    alt={`History Photo ${i + 1}`}
                                    style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid #eee', cursor: 'pointer' }}
                                    onClick={() => setFullScreenPhoto(photo.url)}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {!item.presciption?.photos || item.presciption.photos.length === 0 && (
                    <p className="text-muted">No photos attached for this appointment.</p>
                )}
                <hr className="my-2"/>
                 <button
                    className="btn btn-sm btn-outline-info"
                    onClick={() => {
                        handleSelectAppointmentForUpdate(item); 
                        setShowHistoryModal(false);
                    }}
                >
                    <FaArrowLeft className="me-1"/> Update Photos for this Appointment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Full Screen Photo Viewer Modal */}
      {fullScreenPhoto && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, maxWidth: '90%', width: 'auto', padding: '0', backgroundColor: 'transparent'}}>
            <button 
                style={{...closeButtonStyle, color: 'white'}} 
                onClick={(e) => {e.stopPropagation(); setFullScreenPhoto(null);}}
            >
                <FaTimes />
            </button>
            <img 
                src={fullScreenPhoto} 
                alt="Full Screen View" 
                style={{ maxHeight: '95vh', maxWidth: '95vw', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPrescription;