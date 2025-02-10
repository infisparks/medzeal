"use client";
import React, { useState } from 'react';
import { db, storage } from '../../lib/firebaseConfig'; 
import { ref, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const DoctorRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    biography: '',
    education: '',
    role: '',
  });

  const [photo, setPhoto] = useState(null);
  const [password, setPassword] = useState('');
  const [workingHours, setWorkingHours] = useState({
    Monday: { start: '', end: '', notWorking: false },
    Tuesday: { start: '', end: '', notWorking: false },
    Wednesday: { start: '', end: '', notWorking: false },
    Thursday: { start: '', end: '', notWorking: false },
    Friday: { start: '', end: '', notWorking: false },
    Saturday: { start: '', end: '', notWorking: false },
    Sunday: { start: '', end: '', notWorking: false },
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleWorkingHoursChange = (day, e, type) => {
    const value = type === 'notWorking' ? e.target.checked : e.target.value;
    setWorkingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [type]: value },
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const auth = getAuth();
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);
        const user = userCredential.user;

        if (photo) {
            // Create a reference to the storage path
            const photoRef = storageRef(storage, `doctors/${user.uid}/${photo.name}`);
            // Upload the file directly without any compression
            await uploadBytes(photoRef, photo);
            const photoURL = await getDownloadURL(photoRef);

            const doctorRef = ref(db, `doctors/${user.uid}`);
            await set(doctorRef, { ...formData, workingHours, photoURL });

            alert('Doctor registered successfully!');
            resetForm();
        }
    } catch (error) {
        console.error("Error registering doctor: ", error);
        alert('There was an error registering the doctor.');
    } finally {
        setLoading(false);
    }
};

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      location: '',
      biography: '',
      education: '',
      role: '',
    });
    setPhoto(null);
    setPassword('');
    setWorkingHours({
      Monday: { start: '', end: '', notWorking: false },
      Tuesday: { start: '', end: '', notWorking: false },
      Wednesday: { start: '', end: '', notWorking: false },
      Thursday: { start: '', end: '', notWorking: false },
      Friday: { start: '', end: '', notWorking: false },
      Saturday: { start: '', end: '', notWorking: false },
      Sunday: { start: '', end: '', notWorking: false },
    });
  };

  return (
    <div className="p-5 bg-light max-w-md mx-auto rounded shadow-lg">
      <h1 className="h3 mb-4 text-center">Doctor Registration</h1>
      <form className="needs-validation" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password:</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone:</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Location:</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Biography:</label>
          <textarea
            name="biography"
            value={formData.biography}
            onChange={handleChange}
            required
            className="form-control"
            rows="3"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Education:</label>
          <textarea
            name="education"
            value={formData.education}
            onChange={handleChange}
            required
            className="form-control"
            rows="3"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Role:</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="" disabled>Select a role</option>
            <option value="Physiotherapy">Physiotherapy</option>
            <option value="Consultant">Consultant</option>
            <option value="Wellness Center">Wellness Center</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Photo:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
            className="form-control"
          />
        </div>
        <h5 className="mb-3">Working Hours:</h5>
        {Object.keys(workingHours).map((day) => (
          <div key={day} className="mb-3 d-flex align-items-center">
            <label className="me-2">{day}:</label>
            <input
              type="checkbox"
              checked={workingHours[day].notWorking}
              onChange={(e) => handleWorkingHoursChange(day, e, 'notWorking')}
              className="me-2"
            />
            <span className="me-2">Not Working</span>
            {!workingHours[day].notWorking && (
              <>
                <input
                  type="time"
                  value={workingHours[day].start}
                  onChange={(e) => handleWorkingHoursChange(day, e, 'start')}
                  className="form-control me-2"
                  required
                />
                <input
                  type="time"
                  value={workingHours[day].end}
                  onChange={(e) => handleWorkingHoursChange(day, e, 'end')}
                  className="form-control me-2"
                  required
                />
              </>
            )}
          </div>
        ))}
        <button 
          type="submit" 
          className={`btn btn-primary w-100 ${loading ? 'disabled' : ''}`}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register Doctor'}
        </button>
      </form>
    </div>
  );
};

export default DoctorRegister;
