"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

const AdminPage = () => {
  const router = useRouter();

  return (
    <div className="container mt-5">
      <h1 className="display-4 mb-4 text-center">Admin Panel</h1>

      <div className="row">
        {/* Staff Button */}
        <div className="col-md-6 mb-4 d-flex">
          <div 
            className="card flex-fill text-center shadow-sm border-light"
            onClick={() => router.push('/admin/staff')} // Change the path as needed
          >
            <div className="card-body">
              <h2 className="card-title">Staff</h2>
              <button className="btn btn-primary">Manage Staff</button>
            </div>
            
          </div>
        </div>
       

        {/* Admin Button */}
        <div className="col-md-6 mb-4 d-flex">
          <div 
            className="card flex-fill text-center shadow-sm border-light"
            onClick={() => router.push('/admin/dashboard')} // Change the path as needed
          >
            <div className="card-body">
              <h2 className="card-title">Admin</h2>
              <button className="btn btn-primary">Manage Admins</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
