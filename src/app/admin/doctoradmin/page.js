// pages/admin/doctoradmindashboard.jsx

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaClipboardList, FaShoppingCart } from 'react-icons/fa';
import { Container } from 'react-bootstrap';

const DoctorAdminDashboard = () => {
  const router = useRouter();

  // Define only the four required cards
  const cards = [
    { 
      title: 'ADD & View Prescription', 
      path: '/admin/medicine',
      icon: <FaClipboardList size={40} color="#0d6efd" />
    },
    { 
      title: 'Sell Report', 
      path: '/admin/sellpage',
      icon: <FaShoppingCart size={40} color="#0d6efd" />
    },
    { 
      title: 'Add Vendor', 
      path: '/admin/vendorentry',
      icon: <FaUsers size={40} color="#0d6efd" />
    },
    { 
      title: 'All Vendors & Add Products', 
      path: '/admin/vendors',
      icon: <FaClipboardList size={40} color="#0d6efd" />
    },
    { 
      title: 'Sell Product', 
      path: '/admin/inventrysell',
      icon: <FaShoppingCart size={40} color="#0d6efd" />
    },
    { 
      title: 'All Products', 
      path: '/admin/allproduct',
      icon: <FaShoppingCart size={40} color="#0d6efd" />
    },
  ];

  return (
    <Container className="mt-5">
      <h1 className="display-4 mb-4 text-center">Doctor Admin Dashboard</h1>
      
      <div className="row">
        {cards.map((card, index) => (
          <div 
            key={index}
            className="col-lg-3 col-md-4 col-sm-6 mb-4 d-flex"
            onClick={() => router.push(card.path)}
            style={{ cursor: 'pointer' }}
            aria-label={`Navigate to ${card.title}`}
          >
            <div className="card flex-fill text-center shadow-sm border-0 hover-shadow transition" style={{ width: '100%' }}>
              <div className="card-body d-flex flex-column align-items-center justify-content-center">
                <div className="mb-3">
                  {card.icon}
                </div>
                <h5 className="card-title mb-2">{card.title}</h5>
                <button className="btn btn-primary mt-auto">View {card.title}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom CSS for hover effects */}
      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
          transform: translateY(-5px);
          transition: all 0.3s ease-in-out;
        }
        .transition {
          transition: all 0.3s ease-in-out;
        }
      `}</style>
    </Container>
  );
};

export default DoctorAdminDashboard;
