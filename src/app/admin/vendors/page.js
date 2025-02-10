// src/app/admin/vendors/page.js
"use client";

import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import Link from 'next/link';
import { Spinner, Alert, Card, Button } from 'react-bootstrap';

const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch vendors from Firebase
  useEffect(() => {
    const vendorsRef = ref(db, 'vendors');

    const unsubscribe = onValue(
      vendorsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const vendorsList = Object.entries(data).map(([key, vendorData]) => ({
            id: key,
            ...vendorData,
          }));
          setVendors(vendorsList);
        } else {
          setVendors([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching vendors:', error);
        setError(true);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="display-4 text-center mb-4">Vendor Profiles</h1>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status" />
          <span className="ms-2">Loading vendors...</span>
        </div>
      ) : error ? (
        <Alert variant="danger">
          There was an error loading the vendors. Please try again later.
        </Alert>
      ) : vendors.length === 0 ? (
        <Alert variant="info">No vendors found. Please add a vendor.</Alert>
      ) : (
        <div className="row">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="col-md-4 mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{vendor.name}</Card.Title>
                  <Card.Text>
                    <strong>Number:</strong> {vendor.number}
                  </Card.Text>
                  <Card.Text>
                    <strong>Address:</strong> {vendor.address}
                  </Card.Text>
                  <Link href={`/admin/vendors/${vendor.id}`} passHref>
                    <Button variant="primary" className="mt-auto">
                      View Products
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorsPage;
