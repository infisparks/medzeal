"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '@/lib/firebaseConfig';

const AdminPage = () => {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getDatabase(app);

  // State to hold the current user's role and a loading flag
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the current logged-in user from Firebase Auth
    const currentUser = auth.currentUser;
    if (currentUser) {
      const uid = currentUser.uid;
      // Get the user's record from the Realtime Database at node "users/{uid}"
      const userRef = ref(db, `users/${uid}`);
      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            // Check if a role exists in the user data
            if (userData && userData.role) {
              setUserRole(userData.role);
            }
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          setLoading(false);
        });
    } else {
      // If no user is logged in, you might want to handle this scenario differently.
      setLoading(false);
    }
    // The dependency array is left empty because auth.currentUser
    // is expected to be available once the component mounts.
  }, []);

  // Navigation when clicking the "Admin" card
  const handleAdminClick = () => {
    if (userRole === "doctor") {
      router.push('/admin/doctoradmin');
    } else {
      router.push('/admin/dashboard');
    }
  };

  if (loading) {
    return <div className="container mt-5">Loading...</div>;
  }

  // Optionally, if no role is found, display a message (or you can handle it as needed)
  if (!userRole) {
    return <div className="container mt-5">User role not found.</div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="display-4 mb-4 text-center">Admin Panel</h1>
      <div className="row">
        {/* Show the Staff card if the role is "admin" or "staff" */}
        {(userRole === "admin" || userRole === "staff") && (
          <div className="col-md-6 mb-4 d-flex">
            <div
              className="card flex-fill text-center shadow-sm border-light"
              onClick={() => router.push('/admin/staff')}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-body">
                <h2 className="card-title">Staff</h2>
                <button className="btn btn-primary">Manage Staff</button>
              </div>
            </div>
          </div>
        )}

        {/* Show the Admin card if the role is "admin" or "doctor" */}
        {(userRole === "admin" || userRole === "doctor") && (
          <div className="col-md-6 mb-4 d-flex">
            <div
              className="card flex-fill text-center shadow-sm border-light"
              onClick={handleAdminClick}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-body">
                <h2 className="card-title">Admin</h2>
                <button className="btn btn-primary">
                  {userRole === "doctor" ? "Doctor Admin" : "Manage Admins"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
