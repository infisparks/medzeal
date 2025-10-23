"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { ref, onValue, update, push } from "firebase/database";
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
  FaMicrophone,
  FaStop,
  FaSpinner,
  FaTimes,
  FaHistory,
} from "react-icons/fa";
import { toast } from "sonner";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

// --- Gemini AI Imports & Config ---
import { GoogleGenAI } from "@google/genai";

// WARNING: Storing API keys directly in client-side code is insecure.
const GEMINI_API_KEY = "AIzaSyAl5dV0c_PCj09rujWaq6ZAgupMY9f5wTM";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- Core Gemini API Call Function for Structured Output (UPDATED PROMPT) ---
async function getPrescriptionFromAudio(audioBlob) {
  const audioFile = new File([audioBlob], `presc-audio-${uuidv4()}.webm`, { type: 'audio/webm' });
  let uploadedFile = null;

  try {
    toast.loading("Uploading audio to Gemini...", { id: 'gemini-upload-presc' });
    uploadedFile = await ai.files.upload({
      file: audioFile,
      config: { mimeType: 'audio/webm' }
    });
    toast.success("Audio uploaded successfully.", { id: 'gemini-upload-presc' });

    // UPDATED PROMPT: More context, instruction for synthesizing fields, and tolerance for breaks.
    const prompt = `
        You are a highly efficient medical scribe. Analyze the provided audio, which contains a doctor's dictation of a patient's analysis, symptoms, and treatment plan. The doctor may pause, think, or dictate the information out of order.

        **Your task is to synthesize the key facts from the entire recording and STRICTLY extract them into the following clean JSON structure:**
        
        - symptoms: The patient's primary clinical symptoms and chief complaint.
        - medicines: An array of medications. Each item must have name, consumptionDays (duration in days), time (e.g., "Morning, Evening"), and instruction (e.g., "After Food").
        - overallInstruction: Any general patient advice, follow-up plan, or lifestyle modifications.

        If a field is not dictated, return an empty string "" or an empty array [] for medicines.
        Format the output only as JSON.
    `;

    const prescriptionSchema = {
      type: "object",
      properties: {
        symptoms: { type: "string", description: "Clinical symptoms." },
        medicines: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Medicine name/dosage." },
              consumptionDays: { type: "string", description: "Duration in days (e.g., '7')." },
              time: { type: "string", description: "Consumption time, comma-separated (e.g., 'Morning, Evening')." },
              instruction: { type: "string", description: "Specific instruction (e.g., 'Before Food')." },
            },
            required: ["name", "consumptionDays", "time", "instruction"],
          },
        },
        overallInstruction: { type: "string", description: "General instructions or follow-up." },
      },
      required: ["symptoms", "medicines", "overallInstruction"]
    };

    toast.loading("Analyzing dictation with AI...", { id: 'gemini-analysis-presc' });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        {
          parts: [
            { fileData: { mimeType: uploadedFile.mimeType, fileUri: uploadedFile.uri } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: prescriptionSchema,
        maxOutputTokens: 2048,
      },
    });
    toast.success("AI analysis complete!", { id: 'gemini-analysis-presc' });

    if (!response.text) {
      throw new Error("AI returned an empty response text.");
    }

    const jsonText = response.text.trim().replace(/^```json|```$/g, '').trim();
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Gemini API Error:", error);
    toast.error(`AI analysis failed: ${error.message}`, { id: 'gemini-analysis-presc' });
    throw new Error("Failed to generate prescription from audio.");
  } finally {
    if (uploadedFile && uploadedFile.name) {
      try {
        await ai.files.delete({ name: uploadedFile.name });
        console.log(`Cleaned up Gemini file: ${uploadedFile.name}`);
      } catch (cleanupError) {
        console.error("Error cleaning up Gemini file:", cleanupError);
      }
    }
  }
}
// --- END Core Gemini API Call Function ---


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
  const [symptoms, setSymptoms] = useState("");
  const [showMedicineDetails, setShowMedicineDetails] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [overallInstruction, setOverallInstruction] = useState("");
  const [prescriptionSaved, setPrescriptionSaved] = useState(false);
  
  // Previous history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyModalItems, setHistoryModalItems] = useState([]);
  const [fullScreenPhoto, setFullScreenPhoto] = useState(null);

  // --- Voice/Audio State ---
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  // --- END Voice/Audio State ---

  // --- Medicine Autocomplete State ---
  const [allMedicineNames, setAllMedicineNames] = useState([]);

  // Refs for hidden PDF pages
  const frontRef = useRef(null);
  const prescriptionRef = useRef(null);

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

  // 2. Fetch all unique medicine names for autocomplete
  useEffect(() => {
    const medicinesRef = ref(db, "medicines");
    const unsubscribe = onValue(medicinesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAllMedicineNames(Object.values(data));
      } else {
        setAllMedicineNames([]);
      }
    });
    return () => unsubscribe();
  }, []);

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

  // --- Voice Recording Logic ---

  const startRecording = async () => {
    if (isRecording || isProcessingAudio) return;
    try {
      if (!window.MediaRecorder || !navigator.mediaDevices) {
        toast.error("Recording is not supported by your browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        if (audioBlob.size > 0) {
          processAudio(audioBlob);
        } else {
          toast.error("Recording failed or was too short.");
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info("Recording started... Dictate the full analysis and prescription.");
    } catch (err) {
      toast.error("Failed to start recording. Check microphone permissions.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  /**
   * Processes the recorded audio, gets structured data from Gemini, and
   * updates the form fields.
   */
  const processAudio = async (audioBlob) => {
    setIsProcessingAudio(true);

    try {
      const aiData = await getPrescriptionFromAudio(audioBlob);

      // --- 1. Update Symptoms and Overall Instruction ---
      setSymptoms(aiData.symptoms || "");
      setOverallInstruction(aiData.overallInstruction || "");

      // --- 2. Convert AI Medicine format to Local State format ---
      const newMedicines = (aiData.medicines || []).map(aiMed => {
        const times = { morning: false, evening: false, night: false };
        const timeArray = (aiMed.time || "").split(',').map(t => t.trim().toLowerCase());
        if (timeArray.includes('morning')) times.morning = true;
        if (timeArray.includes('evening')) times.evening = true;
        if (timeArray.includes('night')) times.night = true;

        return {
          name: aiMed.name || "",
          consumptionDays: aiMed.consumptionDays || "",
          times,
          instruction: aiMed.instruction || "",
        };
      });

      if (newMedicines.length > 0) {
        setMedicines(newMedicines);
        setShowMedicineDetails(true);
      } else {
        setMedicines([]);
        setShowMedicineDetails(false);
      }

      toast.success("AI analysis complete! Form fields updated. Please review and save.");

    } catch (err) {
      // Error handled in getPrescriptionFromAudio
      setMedicines([]); // Clear medicines on failure
    } finally {
      setIsProcessingAudio(false);
    }
  };

  // --- End Voice Recording Logic ---

  // --- Prescription Modal Handlers ---

  const closeModal = () => {
    setSelectedAppointment(null);
    setIsPrescriptionModalOpen(false);
    setPrescriptionSaved(false);
    if (isRecording) stopRecording(); // Stop recording if open
  };

  const resetPrescriptionState = (appointment) => {
    setSelectedAppointment(appointment);
    setSymptoms(appointment?.presciption?.symptoms || "");
    setOverallInstruction(appointment?.presciption?.overallInstruction || "");

    const existingMedicines = appointment?.presciption?.medicines || [];
    if (existingMedicines.length > 0) {
      setMedicines(existingMedicines);
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
    // Note: Photos state is no longer managed for new uploads
  };

  const handleSelectAppointmentForAdd = (appointment) => {
    resetPrescriptionState({ ...appointment, presciption: undefined }); // Pass undefined presciption to clear fields
    setIsPrescriptionModalOpen(true);
  };

  const handleSelectAppointmentForUpdate = (appointment) => {
    resetPrescriptionState(appointment);
    setIsPrescriptionModalOpen(true);
  };

  const handleDownloadExistingPrescription = (appointment) => {
    resetPrescriptionState(appointment);
    setTimeout(() => {
      generateAndUploadPDF(false); // Only download
    }, 500);
  };

  // --- Medicine Details Functions ---
  const toggleMedicineDetails = () => {
    setShowMedicineDetails((prev) => {
      if (!prev && medicines.length === 0) {
        setMedicines([
          {
            name: "",
            consumptionDays: "",
            times: { morning: false, evening: false, night: false },
            instruction: "",
          },
        ]);
      }
      return !prev;
    });
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

  const handleSelectSuggestion = (index, suggestion) => {
    const newMedicines = [...medicines];
    newMedicines[index].name = suggestion;
    setMedicines(newMedicines);
  };

  // --- Firebase Medicine Saving Helper (NEW) ---
  const saveNewMedicineName = async (name) => {
    if (!name || name.trim() === "") return;
    const isExisting = allMedicineNames.some(
      (med) => med.toLowerCase() === name.trim().toLowerCase()
    );

    if (!isExisting) {
      try {
        const medicinesRef = ref(db, "medicines");
        await push(medicinesRef, name.trim());
        toast.info(`New medicine '${name.trim()}' saved for future reference.`);
      } catch (error) {
        console.error("Error saving new medicine name:", error);
      }
    }
  };
  
  // --- Form Submit Handler ---
  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!selectedAppointment || isProcessingAudio) return;

    // 1. Save any new, manually entered medicine names
    const namesToSave = new Set();
    medicines.forEach(med => {
        if (med.name.trim() !== "" && !allMedicineNames.some(n => n.toLowerCase() === med.name.trim().toLowerCase())) {
            namesToSave.add(med.name.trim());
        }
    });
    for (const name of Array.from(namesToSave)) {
        await saveNewMedicineName(name);
    }

    // 2. Prepare Prescription Data
    const prescriptionData = {
      symptoms,
      medicines: showMedicineDetails ? medicines : [],
      overallInstruction,
      photos: selectedAppointment.presciption?.photos || [], // Keep existing photos for history/data integrity
      createdAt: new Date().toISOString(),
    };

    // 3. Update Firebase
    const appointmentRef = ref(
      db,
      `appointments/${selectedAppointment.uid}/${selectedAppointment.appointmentId}`
    );
    try {
      await update(appointmentRef, { presciption: prescriptionData });
      toast.success("Prescription saved successfully! Preparing PDF...");
      setPrescriptionSaved(true);
      
      // Update selectedAppointment state with new prescription data to ensure PDF generation is accurate
      setSelectedAppointment(prev => prev ? ({ ...prev, presciption: prescriptionData }) : null);
      
      generateAndUploadPDF(true); // Upload PDF and send WhatsApp
    } catch (error) {
      console.error("Error saving prescription:", error);
      toast.error("Error saving prescription.");
    }
  };

  // --- PDF Generation and WhatsApp ---
  const generatePDFBlob = useCallback(async (isHistory = false) => {
    if (!selectedAppointment) return null;
    
    // Use the prescription data from the current state if not viewing history
    const dataToUse = isHistory ? selectedAppointment.presciption : { 
        symptoms, 
        medicines, 
        overallInstruction 
    };
    
    if (!frontRef.current || !prescriptionRef.current || !dataToUse) return null;

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
    // Temporarily update prescriptionRef's content for accurate rendering
    const originalContent = prescriptionRef.current.innerHTML;

    // Helper to format medicine time
    const formatTime = (times) => {
      if (!times) return '';
      const t = times.morning ? 'Morning ' : '';
      const e = times.evening ? 'Evening ' : '';
      const n = times.night ? 'Night' : '';
      return (t + e + n).trim().replace(/ /g, ', ');
    };

    const currentMedicines = dataToUse.medicines || [];

    const medicinesHtml = currentMedicines.length > 0 ? `
        <div style="margin-top: 5mm;">
            <div style="display: flex; padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; font-size: 11pt;">
                <div style="flex: 3;">Medicine Name</div>
                <div style="flex: 1; text-align: center;">Days</div>
                <div style="flex: 2; text-align: center;">Time</div>
                <div style="flex: 4;">Instruction</div>
            </div>
            ${currentMedicines.map((medicine, index) => `
                <div key=${index} style="display: flex; padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 10pt;">
                    <div style="flex: 3;">${medicine.name}</div>
                    <div style="flex: 1; text-align: center;">${medicine.consumptionDays}</div>
                    <div style="flex: 2; text-align: center;">${formatTime(medicine.times)}</div>
                    <div style="flex: 4; white-space: pre-wrap; word-break: break-word;">${medicine.instruction}</div>
                </div>
            `).join('')}
        </div>
    ` : `<p style="font-size: 11pt;">No medicines prescribed.</p>`;

    prescriptionRef.current.innerHTML = `
      <div style="text-align: center; margin-bottom: 10mm;"></div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10mm; font-size: 12pt;">
          <div style="width: 45%;">
              <p style="margin: 4px 0;"><strong>Name:</strong> ${selectedAppointment.name}</p>
              <p style="margin: 4px 0;"><strong>Phone:</strong> ${selectedAppointment.phone}</p>
          </div>
          <div style="width: 45%; text-align: right;">
              <p style="margin: 4px 0;"><strong>Doctor:</strong> ${selectedAppointment.doctor}</p>
              <p style="margin: 4px 0;"><strong>Treatment:</strong> ${selectedAppointment.treatment}</p>
              <p style="margin: 4px 0;"><strong>Subcategory:</strong> ${selectedAppointment.subCategory}</p>
          </div>
      </div>
      <hr style="border: none; border-bottom: 1px solid #ccc; margin-bottom: 10mm;" />
      <div style="margin-bottom: 10mm;">
          <h3 style="font-size: 14pt; margin-bottom: 4mm;">Prescription Details</h3>
          <p style="font-size: 12pt; margin: 4px 0;"><strong>Symptoms/Disease:</strong> ${dataToUse.symptoms}</p>
          ${medicinesHtml}
      </div>
      <div style="margin-bottom: 10mm;">
          <h3 style="font-size: 14pt; margin-bottom: 4mm;">Overall Instructions</h3>
          <p style="font-size: 12pt;">${dataToUse.overallInstruction}</p>
      </div>
      <hr style="border: none; border-bottom: 1px solid #ccc; margin-bottom: 5mm;" />
      <div style="text-align: center; font-size: 10pt;">
          <p>Report generated on: ${new Date().toLocaleString()}</p>
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

    // Restore original content (important)
    prescriptionRef.current.innerHTML = originalContent;

    return pdf.output("blob");
  }, [selectedAppointment, symptoms, medicines, overallInstruction]);

  const downloadPrescriptionReport = async () => {
    const pdfBlob = await generatePDFBlob();
    if (!pdfBlob) { toast.error("Failed to generate PDF."); return; }
    const blobURL = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = blobURL;
    link.download = `Prescription-${selectedAppointment?.name}-${selectedAppointment?.appointmentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobURL);
    toast.success("PDF downloaded successfully!");
  };

  const uploadPDFAndSendWhatsApp = async () => {
    if (!selectedAppointment) return;
    const pdfBlob = await generatePDFBlob();
    if (!pdfBlob) { toast.error("Failed to generate PDF for WhatsApp."); return; }

    const waToastId = toast.loading("Uploading PDF and sending WhatsApp...", { id: 'whatsapp-send' });
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
          `Dear ${selectedAppointment.name}, your prescription for the appointment on ${selectedAppointment.appointmentDate} has been generated. Please find the attachment.`,
      };
      const response = await fetch("https://wa.medblisss.com/send-image-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("WhatsApp API failed.");

      toast.success("Prescription sent to the user via WhatsApp!", { id: waToastId });
    } catch (error) {
      console.error("Error uploading or sending PDF via WhatsApp:", error);
      toast.error("Error sending prescription via WhatsApp.", { id: waToastId });
    }
  };

  // Combined function for PDF actions
  const generateAndUploadPDF = async (uploadAndSend = true) => {
    if (uploadAndSend) {
      await uploadPDFAndSendWhatsApp();
    } else {
      await downloadPrescriptionReport();
    }
  };

  // --- Modal Styles (Unchanged) ---
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
    maxWidth: "900px",
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
              .filter((a) => a.phone === appointment.phone && a.presciption)
              .sort((a, b) => new Date(b.presciption.createdAt) - new Date(a.presciption.createdAt));
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
                      {phoneHistory.length > 0 && (
                        <button
                          className="btn btn-secondary btn-sm me-2"
                          onClick={() => {
                            setHistoryModalItems(phoneHistory);
                            setShowHistoryModal(true);
                          }}
                        >
                          <FaHistory className="me-1"/> See Previous History
                        </button>
                      )}
                      {appointment.presciption ? (
                        <>
                          <button
                            className="btn btn-info me-2 btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadExistingPrescription(appointment);
                            }}
                          >
                            <FaMicrophone className="me-1"/> Download
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

      {/* --- Prescription Modal --- */}
      {isPrescriptionModalOpen && selectedAppointment && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <button style={closeButtonStyle} onClick={closeModal}>
              <FaTimes />
            </button>
            <h4 className="mb-4 text-success">
              Prescription for {selectedAppointment.name} (Phone: {selectedAppointment.phone})
            </h4>

            {/* --- Voice Control UI --- */}
            <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#f0e6ff' }}>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessingAudio}
                className={`w-100 btn text-lg d-flex align-items-center justify-content-center gap-2 ${isProcessingAudio ? 'btn-warning' : isRecording ? 'btn-danger' : 'btn-purple'}`}
                style={{ backgroundColor: isRecording ? '#dc3545' : '#6f42c1', color: 'white' }}
              >
                {isProcessingAudio ? (
                  <><FaSpinner className="me-2 animate-spin" /> Analyzing Voice Dictation...</>
                ) : isRecording ? (
                  <><FaStop className="me-2 animate-pulse" /> Stop Recording & Process</>
                ) : (
                  <><FaMicrophone className="me-2" /> Dictate Prescription (AI Voice Input)</>
                )}
              </button>
              {isProcessingAudio && (
                <p className="text-center mt-2 text-sm text-muted">
                  AI is structuring the prescription. This will overwrite all fields below.
                </p>
              )}
            </div>
            {/* --- END Voice Control UI --- */}

            <form onSubmit={handleSubmitPrescription}>
              <div className="mb-3">
                <label className="form-label">
                  <strong>1. Symptoms/Disease:</strong>
                </label>
                <textarea
                  className="form-control"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                  placeholder="Enter symptoms or dictate to fill automatically"
                  disabled={isProcessingAudio}
                ></textarea>
              </div>

              <div className="mb-3">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={toggleMedicineDetails}
                  disabled={isProcessingAudio}
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
                          {(medicines.length > 0 || index > 0) && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveMedicine(index)}
                              disabled={isProcessingAudio}
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
                            placeholder="Enter medicine name or select from dropdown"
                            disabled={isProcessingAudio}
                          />
                          {/* Autocomplete Dropdown (Manual Input Only) */}
                          {medicine.name && !isProcessingAudio && (
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
                                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                                maxHeight: '200px',
                                overflowY: 'auto'
                              }}
                            >
                              {allMedicineNames
                                .filter((sug) =>
                                  sug.toLowerCase().startsWith(medicine.name.toLowerCase())
                                )
                                .map((suggestion, idx) => (
                                  <li
                                    key={idx}
                                    style={{ padding: "8px", cursor: "pointer", borderBottom: '1px solid #eee' }}
                                    onClick={() => handleSelectSuggestion(index, suggestion)}
                                  >
                                    {suggestion}
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
                        {/* Other Medicine Fields */}
                        <div className="mb-2">
                          <label className="form-label">
                            Consumption Days:
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={medicine.consumptionDays}
                            onChange={(e) =>
                              handleMedicineChange(index, "consumptionDays", e.target.value)
                            }
                            placeholder="e.g., 7"
                            disabled={isProcessingAudio}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label">Time:</label>
                          <div>
                            {['morning', 'evening', 'night'].map(time => (
                              <div className="form-check form-check-inline" key={time}>
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={medicine.times[time]}
                                  onChange={() => handleTimeToggle(index, time)}
                                  id={`${time}-${index}`}
                                  disabled={isProcessingAudio}
                                />
                                <label className="form-check-label" htmlFor={`${time}-${index}`}>
                                  {time.charAt(0).toUpperCase() + time.slice(1)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="form-label">
                            Medicine Instruction (Optional):
                          </label>
                          <textarea
                            className="form-control"
                            value={medicine.instruction}
                            onChange={(e) => handleMedicineChange(index, "instruction", e.target.value)}
                            rows={2}
                            placeholder="Additional instruction for this medicine"
                            disabled={isProcessingAudio}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-primary mb-3"
                    onClick={addMedicine}
                    disabled={isProcessingAudio}
                  >
                    <FaPlusCircle className="me-2" />
                    Add More Medicine
                  </button>
                </>
              )}

              <div className="mb-3">
                <label className="form-label">
                  <strong>2. Overall Instructions:</strong>
                </label>
                <textarea
                  className="form-control"
                  value={overallInstruction}
                  onChange={(e) => setOverallInstruction(e.target.value)}
                  rows={3}
                  placeholder="Any additional instructions or follow-up details..."
                  disabled={isProcessingAudio}
                ></textarea>
              </div>

              <div className="d-flex justify-content-between pt-3 border-top">
                <button type="submit" className="btn btn-success" disabled={isProcessingAudio}>
                  Save & Send Prescription
                </button>
                <button
                  type="button"
                  className="btn btn-info"
                  onClick={downloadPrescriptionReport}
                  disabled={!selectedAppointment?.presciption || isProcessingAudio}
                >
                  <FaMicrophone className="me-1"/> Download PDF
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
            {/* Content is dynamically generated in generatePDFBlob to use current state */}
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
            <h4>Prescription History</h4>
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
                  <strong>Symptoms/Disease:</strong> {item.presciption?.symptoms}
                </p>
                <p>
                  <strong>Overall Instructions:</strong> {item.presciption?.overallInstruction}
                </p>
                {item.presciption?.medicines &&
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
                                {(med.times?.morning ? "Morning " : "") +
                                  (med.times?.evening ? "Evening " : "") +
                                  (med.times?.night ? "Night" : "")}
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