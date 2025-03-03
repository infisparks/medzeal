"use client";
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Form, Button, Card } from 'react-bootstrap';

const PrescriptionPage = () => {
  const router = useRouter();
  const { patientId } = useParams();

  // State for the patient’s symptoms or disease
  const [symptoms, setSymptoms] = useState('');
  // State for an array of medicine prescriptions
  const [medicines, setMedicines] = useState([
    { name: '', consumption: '', times: { morning: false, evening: false, night: false }, instruction: '' }
  ]);
  // Overall instructions for the prescription
  const [overallInstruction, setOverallInstruction] = useState('');

  // Handler for symptoms input
  const handleSymptomsChange = (e) => {
    setSymptoms(e.target.value);
  };

  // Handler for changing medicine details in a given row
  const handleMedicineChange = (index, field, value) => {
    const newMedicines = [...medicines];
    if (field === 'name' || field === 'consumption' || field === 'instruction') {
      newMedicines[index][field] = value;
    } else if (['morning', 'evening', 'night'].includes(field)) {
      newMedicines[index].times[field] = value;
    }
    setMedicines(newMedicines);
  };

  // Add a new medicine entry to the form
  const addMedicine = () => {
    setMedicines([
      ...medicines,
      { name: '', consumption: '', times: { morning: false, evening: false, night: false }, instruction: '' }
    ]);
  };

  // Handler for form submission – replace with your save logic
  const handleSubmit = (e) => {
    e.preventDefault();
    const prescriptionData = {
      patientId,
      symptoms,
      medicines,
      overallInstruction,
      date: new Date().toISOString(),
    };
    console.log("Prescription Data:", prescriptionData);
    // Save prescriptionData to your backend or Firebase here.
    alert("Prescription submitted successfully!");
    router.push('/doctor/patients'); // Navigate back to the patient list or desired page
  };

  return (
    <div className="container mt-5">
      <Card className="p-4">
        <h2>Prescription for Patient {patientId}</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="symptoms" className="mb-3">
            <Form.Label>Symptoms / Disease</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Enter symptoms or disease" 
              value={symptoms} 
              onChange={handleSymptomsChange} 
              required 
            />
          </Form.Group>
          <h4>Medicines</h4>
          {medicines.map((medicine, index) => (
            <div key={index} className="border p-3 mb-3">
              <Form.Group controlId={`medicineName-${index}`} className="mb-2">
                <Form.Label>Medicine Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter medicine name"
                  value={medicine.name}
                  onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group controlId={`consumption-${index}`} className="mb-2">
                <Form.Label>Consumption Days</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter consumption days (e.g., 7)"
                  value={medicine.consumption}
                  onChange={(e) => handleMedicineChange(index, 'consumption', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Time</Form.Label>
                <div>
                  <Form.Check
                    inline
                    label="Morning"
                    type="checkbox"
                    checked={medicine.times.morning}
                    onChange={(e) => handleMedicineChange(index, 'morning', e.target.checked)}
                  />
                  <Form.Check
                    inline
                    label="Evening"
                    type="checkbox"
                    checked={medicine.times.evening}
                    onChange={(e) => handleMedicineChange(index, 'evening', e.target.checked)}
                  />
                  <Form.Check
                    inline
                    label="Night"
                    type="checkbox"
                    checked={medicine.times.night}
                    onChange={(e) => handleMedicineChange(index, 'night', e.target.checked)}
                  />
                </div>
              </Form.Group>
              <Form.Group controlId={`medicineInstruction-${index}`} className="mb-2">
                <Form.Label>Medicine Instruction (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter instruction for this medicine"
                  value={medicine.instruction}
                  onChange={(e) => handleMedicineChange(index, 'instruction', e.target.value)}
                />
              </Form.Group>
            </div>
          ))}
          <Button variant="secondary" onClick={addMedicine} className="mb-3">
            Add More Medicine
          </Button>
          <Form.Group controlId="overallInstruction" className="mb-3">
            <Form.Label>Overall Instruction</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter any overall instructions"
              value={overallInstruction}
              onChange={(e) => setOverallInstruction(e.target.value)}
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit Prescription
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default PrescriptionPage;
