import React from "react";

// SEO-friendly metadata for this specific page
export const metadata = {
  title: "Doctor Schedule | Medzeal Mumbra - Find Available Specialists",
  description:
    "Check the weekly schedule of our medical specialists at Medzeal Mumbra. Find available dermatologists, neurologists, oncologists, and more to book your appointments.",
  keywords:
    "doctor schedule, Medzeal Mumbra, available doctors, dermatologists, neurologists, oncologists, pain management, orthopedics, surgeons",
};

export default function DoctorSchedule() {
  // Define the days of the week
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Define the time slots based on doctors' availability
  const timeSlots = [
    { start: "10:00 AM", end: "1:00 PM" },
    { start: "11:30 AM", end: "1:30 PM" },
    { start: "2:00 PM", end: "5:00 PM" },
    { start: "5:00 PM", end: "8:00 PM" },
    { start: "8:00 PM", end: "10:00 PM" },
  ];

  // Define doctors with their availability
  const doctors = [
    {
      name: "Dr. Saheba",
      specialty: "General Practitioner",
      availability: [
        { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], time: "11:30 AM - 1:30 PM" },
      ],
    },
    {
      name: "Dr. Shajar",
      specialty: "Specialist Surgeon",
      availability: [
        { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], time: "2:00 PM - 5:00 PM" },
        { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], time: "8:00 PM - 10:00 PM" },
      ],
    },
    {
      name: "Dr. Shoeb",
      specialty: "Orthopedic Specialist",
      availability: [
        { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], time: "5:00 PM - 8:00 PM" },
      ],
    },
    {
      name: "Faiz Ahmed Shaikh",
      specialty: "Cardiologist",
      availability: [
        { days: ["Monday", "Wednesday", "Saturday"], time: "10:00 AM - 1:00 PM" },
      ],
    },
    {
      name: "Rupa Nandi",
      specialty: "Pediatrician",
      availability: [
        { days: ["Monday", "Wednesday", "Saturday"], time: "2:00 PM - 5:00 PM" },
      ],
    },
  ];

  // Helper function to get doctors available for a specific day and time slot
  const getDoctorsForSlot = (day, time) => {
    return doctors
      .filter((doctor) =>
        doctor.availability.some(
          (slot) => slot.days.includes(day) && slot.time === `${time.start} - ${time.end}`
        )
      )
      .map((doctor) => ({ name: doctor.name, specialty: doctor.specialty }));
  };

  return (
    <>
      <div className="doctor-calendar-table table-responsive">
        <h1>Doctor Schedule</h1>
        <p>Check out our weekly schedule to find available doctors and specialists at Medzeal Mumbra.</p>

        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Time</th>
              {days.map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {timeSlots.map((slot, index) => (
              <tr key={index}>
                <td>
                  <span className="time">
                    <div>{slot.start}</div>
                    <div>{slot.end}</div>
                  </span>
                </td>
                {days.map((day, dayIndex) => {
                  const availableDoctors = getDoctorsForSlot(day, slot);
                  return (
                    <td key={dayIndex}>
                      {availableDoctors.length > 0 ? (
                        availableDoctors.map((doctor, docIndex) => (
                          <div key={docIndex}>
                            <h4>{doctor.name}</h4>
                            <span>{doctor.specialty}</span>
                          </div>
                        ))
                      ) : (
                        <span>--</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
