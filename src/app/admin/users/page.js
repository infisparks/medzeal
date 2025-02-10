"use client";
import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebaseConfig'; 
import { ref, onValue } from 'firebase/database';

const UsersPage = () => {
  const [users, setUsers] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const usersRef = ref(db, 'users');

    onValue(usersRef, (snapshot) => {
      setUsers(snapshot.val());
    });
  }, []);

  // Filter users based on the search term
  const filteredUsers = users ? Object.entries(users).filter(([key, user]) => {
    // Ensure user is defined and has the necessary properties
    const name = user?.name?.toLowerCase() || '';
    const email = user?.email?.toLowerCase() || '';
    const phone = user?.phone?.toLowerCase() || '';

    return (
      name.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm.toLowerCase())
    );
  }) : [];

  return (
    <div className="container mt-5">
      <h1 className="display-4 text-center mb-4">Users</h1>

      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Search by name, email, or phone" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="row">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(([key, user]) => (
            <div key={key} className="col-md-6 mb-4">
              <div className="card shadow-sm border-light hover-shadow">
                <div className="card-body">
                  <p className="font-semibold text-lg">{user?.name || 'Unknown'}</p>
                  <p className="text-gray-600"><strong>Email:</strong> {user?.email || 'N/A'}</p>
                  <p className="text-gray-600"><strong>Phone:</strong> {user?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <p className="text-center text-muted">No users found matching the search criteria.</p>
          </div>
        )}
      </div>

      {/* Custom CSS for hover effect */}
      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          transition: box-shadow 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default UsersPage;
