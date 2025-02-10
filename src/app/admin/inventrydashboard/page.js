// pages/admin/inventrydashboard.jsx

"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig'; 
import { ref, onValue } from 'firebase/database';
import { useRouter } from 'next/navigation';
import { 
  FaUsers, 
  FaBlog, 
  FaClipboardList, 
  FaShoppingCart, 
  FaDollarSign,
  FaExclamationTriangle
} from 'react-icons/fa'; // Example icons
import { Alert, Container } from 'react-bootstrap';

const Inventrydashboard = () => {
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [blogsCount, setBlogsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0); // New state for low stock
  const [loadingLowStock, setLoadingLowStock] = useState(true);
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
    });

    // Fetching the total number of blogs
    const unsubscribeBlogs = onValue(blogsRef, (snapshot) => {
      const data = snapshot.val();
      const count = data ? Object.keys(data).length : 0;
      setBlogsCount(count);
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
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeAppointments();
      unsubscribeBlogs();
      unsubscribeVendors();
    };
  }, []);

  // Define card data
  const cards = [
    { 
      title: 'Add Vendor', 
      path: '/admin/vendorentry',
      icon: <FaUsers size={40} color="#0d6efd" />,
      count: null
    },
    { 
      title: 'All Vendors & Add Products', 
      path: '/admin/vendors',
      icon: <FaClipboardList size={40} color="#0d6efd" />,
      count: null
    },
    { 
      title: 'All Sell', 
      path: '/admin/sellpage',
      icon: <FaShoppingCart size={40} color="#0d6efd" />,
      count: null
    },
    { 
      title: 'Credit Cycle', 
      path: '/admin/creditcycle',
      icon: <FaDollarSign size={40} color="#0d6efd" />,
      count: null
    },
    { 
      title: 'Sell Product', 
      path: '/admin/inventrysell',
      icon: <FaShoppingCart size={40} color="#0d6efd" />,
      count: null
    }, 
    { 
      title: 'All Products', 
      path: '/admin/allproduct',
      icon: <FaShoppingCart size={40} color="#0d6efd" />,
      count: null
    },
  ];

  return (
    <Container className="mt-5">
      <h1 className="display-4 mb-4 text-center">Inventory Dashboard</h1>

      {/* Alert for Low Stock Products */}
      {!loadingLowStock && lowStockCount > 0 && (
        <Alert variant="danger" className="d-flex align-items-center">
          <FaExclamationTriangle size={24} className="me-2" />
          <div>
            {lowStockCount === 1
              ? '1 product is out of stock.'
              : `${lowStockCount} products are out of stock.`}
          </div>
        </Alert>
      )}

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
                {card.count !== null && (
                  <p className="card-text display-6 text-primary">{card.count}</p>
                )}
                <button className="btn btn-primary mt-auto">View {card.title}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Optional: Add some custom CSS for hover effects */}
      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
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

export default Inventrydashboard;
