// pages/admin/dashboard.jsx

"use client";

import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebaseConfig'; 
import { ref, onValue } from 'firebase/database';
import { useRouter } from 'next/navigation';
import { 
  FaCalendarAlt, 
  FaBoxOpen, 
  FaFileAlt, 
  FaBlog, 
  FaChartLine, 
  FaPhoneAlt, 
  FaStar, 
  FaMoneyCheckAlt,
  FaExclamationTriangle 
} from 'react-icons/fa'; // Importing relevant icons
import { Alert, Container } from 'react-bootstrap'; // Import Alert and Container from react-bootstrap

const Dashboard = () => {
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [blogsCount, setBlogsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0); // New state for low stock
  const [loadingLowStock, setLoadingLowStock] = useState(true);
  const [errorLowStock, setErrorLowStock] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const appointmentsRef = ref(db, 'appointments');
    const blogsRef = ref(db, 'blogs');
    const vendorsRef = ref(db, 'vendors'); // Reference to vendors for products

    // Fetching the total number of appointments
    const unsubscribeAppointments = onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val();
      const count = data ? Object.values(data).flatMap(Object.values).length : 0;
      setAppointmentsCount(count);
    }, (error) => {
      console.error('Error fetching appointments:', error);
    });

    // Fetching the total number of blogs
    const unsubscribeBlogs = onValue(blogsRef, (snapshot) => {
      const data = snapshot.val();
      const count = data ? Object.keys(data).length : 0;
      setBlogsCount(count);
    }, (error) => {
      console.error('Error fetching blogs:', error);
    });

    
    // Fetching all products to determine low stock
    const unsubscribeVendors = onValue(vendorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let count = 0;
        Object.values(data).forEach(vendorData => {
          const { products } = vendorData;
          if (products) {
            Object.values(products).forEach(product => {
              if (product.quantity < product.avgQuantity) {
                count += 1;
              }
            });
          }
        });
        setLowStockCount(count);
      } else {
        setLowStockCount(0);
      }
      setLoadingLowStock(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      setErrorLowStock(true);
      setLoadingLowStock(false);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeAppointments();
      unsubscribeBlogs();
      unsubscribeVendors();
    };
  }, []);

  // Define card data with icons
  const cards = [
    { 
      title: 'Total Appointments', 
      count: appointmentsCount, 
      path: '/admin/appointments',
      icon: <FaCalendarAlt size={40} color="#0d6efd" />
    },
    { 
      title: 'Inventory Dashboard', 
      path: '/admin/inventrydashboard',
      icon: <FaBoxOpen size={40} color="#0d6efd" />,
      count: null
    },
    { 
      title: 'Doctor Report', 
      path: '/admin/doctorreport',
      icon: <FaFileAlt size={40} color="#0d6efd" />,
      count: null
    },
    { 
      title: 'Total Blogs', 
      count: blogsCount, 
      path: '/admin/blogmake',
      icon: <FaBlog size={40} color="#0d6efd" />
    },
    { 
      title: 'Price Graph', 
      path: '/admin/graphprice',
      icon: <FaChartLine size={40} color="#0d6efd" />,
      count: null
    },
    { 
      title: 'Total Appointments Graph', 
      path: '/admin/graphtotal',
      icon: <FaChartLine size={40} color="#0d6efd" />,
      count: null
    },
    { 
      title: 'Contact Us', 
      path: '/admin/contact',
      icon: <FaPhoneAlt size={40} color="#0d6efd" />,
      count: null
    },
    { 
      title: 'Service Rank Graph', 
      path: '/admin/bookedAppoinmentGraph',
      icon: <FaStar size={40} color="#0d6efd" />,
      count: null
    },
    // Uncomment if needed
    // { 
    //   title: 'Financial Overview', 
    //   path: '/admin/financialoverview',
    //   icon: <FaMoneyCheckAlt size={40} color="#0d6efd" />,
    //   count: null
    // },
  ];

  return (
    <Container className="mt-5">
      <h1 className="display-4 mb-4 text-center">Dashboard</h1>

      {/* Alert for Low Stock Products */}
      {!loadingLowStock && !errorLowStock && lowStockCount > 0 && (
        <Alert variant="danger" className="d-flex align-items-center">
          <FaExclamationTriangle size={24} className="me-2" />
          <div>
            {lowStockCount === 1
              ? '1 product is out of stock in inventory.'
              : `${lowStockCount} products are out of stock inventory.`}
          </div>
        </Alert>
      )}

      {/* Optional: Alert for errors in fetching low stock data */}
      {!loadingLowStock && errorLowStock && (
        <Alert variant="warning">
          Unable to fetch product stock information. Please try again later.
        </Alert>
      )}

      <div className="row">
        {cards.map((card, index) => (
          <div 
            key={index}
            className="col-lg-3 col-md-4 col-sm-6 mb-4 d-flex"
            onClick={() => router.push(card.path)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') router.push(card.path); }}
            aria-label={`Navigate to ${card.title}`}
          >
            <div className="card flex-fill text-center shadow-sm border-0 hover-shadow transition">
              <div className="card-body d-flex flex-column align-items-center justify-content-center">
                <div className="mb-3">
                  {card.icon}
                </div>
                <h5 className="card-title mb-2">{card.title}</h5>
                {card.count !== null && (
                  <p className="card-text display-6 text-primary">{card.count}</p>
                )}
                <button className="btn btn-primary mt-auto">View</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom CSS for hover effects */}
      <style jsx>{`
        .hover-shadow {
          transition: transform 0.3s, box-shadow 0.3s;
          cursor: pointer;
        }
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        }
        .transition {
          transition: all 0.3s ease-in-out;
        }
        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
        }
        .card-text {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .btn-primary {
          width: 100%;
          transition: background-color 0.3s, border-color 0.3s;
        }
        .btn-primary:hover {
          background-color: #0056b3;
          border-color: #0056b3;
        }
      `}</style>
    </Container>
  );
};

export default Dashboard;
