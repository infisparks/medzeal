"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from '@/lib/firebaseConfig';

export default function WorkHour() {
  const auth = getAuth(app);
  const db = getDatabase(app);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      const appointmentsRef = ref(db, `appointments/${user.uid}`);
      const unsubscribe = onValue(appointmentsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const appointmentList = Object.entries(data)
            .map(([key, value]) => ({
              id: key,
              ...value,
            }))
            .filter((appointment) => appointment.approved);
          
          setAppointments(appointmentList);
        } else {
          setAppointments([]);
        }
        setLoading(false);
      }, (error) => {
        setError(error); // Handle errors
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [auth]);

  if (loading) {
    return <div className="text-white">Loading appointments...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error fetching appointments: {error.message}</div>;
  }

  const firstThreeAppointments = appointments.slice(0, 3).reverse();

  return (
    <div className="work-hour p-6 bg-blue-600 rounded-lg shadow-lg">
      <h3 className="text-3xl text-white mb-4">Your Last Appointments</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {firstThreeAppointments.length > 0 ? (
          firstThreeAppointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300">
              <h4 className="text-blue-600 font-semibold mb-2">{appointment.doctor}</h4>
              <p className="text-gray-700"><strong>Date:</strong> {appointment.appointmentDate}</p>
              <p className="text-gray-700"><strong>Time:</strong> {appointment.appointmentTime}</p>
            </div>
          ))
        ) : (
          <div className="text-white">No approved appointments found.</div>
        )}
      </div>
    </div>
  );
}
