// pages/admin/allproducts.jsx

"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import {
  Spinner,
  Alert,
  Card,
  Button,
  Container,
  Row,
  Col,
  Form,
  InputGroup
} from 'react-bootstrap';
import { FaPhoneAlt, FaBoxOpen, FaExclamationTriangle, FaSearch } from 'react-icons/fa';

const AllProductsPage = () => {
  // State variables
  const [products, setProducts] = useState([]); // Array of all products with vendor info
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Fetch all vendors and their products
  useEffect(() => {
    const vendorsRef = ref(db, 'vendors');

    const unsubscribe = onValue(
      vendorsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const allProducts = [];

          Object.entries(data).forEach(([vendorId, vendorData]) => {
            const { name: vendorName, number: vendorNumber, products: vendorProducts } = vendorData;

            if (vendorProducts) {
              Object.entries(vendorProducts).forEach(([productId, productData]) => {
                allProducts.push({
                  productId,
                  vendorId,
                  vendorName,
                  vendorNumber,
                  ...productData,
                });
              });
            }
          });

          setProducts(allProducts);
        } else {
          setProducts([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching vendors:', err);
        setError(true);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Debounce search input (optional)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // 300ms debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    const query = debouncedSearch.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.vendorName.toLowerCase().includes(query)
    );
  });

  // Helper function to calculate low stock
  const getLowStockAmount = (avgQty, currentQty) => {
    return avgQty - currentQty;
  };

  // Render loading state
  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Loading products...</span>
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          Unable to fetch products. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <h1 className="mb-4 text-center">All Products</h1>

      {/* Search Bar */}
      <Form className="mb-4">
        <InputGroup>
          <InputGroup.Text>
            <FaSearch />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Search by Product or Vendor Name"
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search Products"
          />
        </InputGroup>
      </Form>

      {filteredProducts.length === 0 ? (
        <Alert variant="info">No products match your search criteria.</Alert>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {filteredProducts.map((product, index) => {
            const {
              productId,
              vendorId,
              vendorName,
              vendorNumber,
              name,
              avgQuantity,
              quantity,
              productPrice,
              mrpPrice,
              creditCycleDate,
            } = product;

            const isLowStock = avgQuantity > quantity;
            const lowStockAmount = isLowStock ? getLowStockAmount(avgQuantity, quantity) : 0;

            return (
              <Col key={productId}>
                <Card
                  className={`h-100 shadow-sm ${
                    isLowStock ? 'border-danger' : 'border-primary'
                  }`}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <FaBoxOpen size={30} color={isLowStock ? '#dc3545' : '#0d6efd'} />
                      {isLowStock && (
                        <FaExclamationTriangle size={20} color="#dc3545" title="Low Stock" />
                      )}
                    </div>
                    <Card.Title className="mt-3">{name}</Card.Title>
                    <Card.Text>
                      <strong>Avg Quantity:</strong> {avgQuantity}
                      <br />
                      <strong>Current Quantity:</strong>{' '}
                      <span className={isLowStock ? 'text-danger' : 'text-success'}>
                        {quantity}
                      </span>
                      {isLowStock && (
                        <>
                          <br />
                          <strong>Low Stock By:</strong> {lowStockAmount}
                        </>
                      )}
                      <br />
                      <strong>Price:</strong> ₹{productPrice}
                      <br />
                      <strong>MRP:</strong> ₹{mrpPrice}
                      <br />
                      <strong>Credit Cycle:</strong> {creditCycleDate} days
                    </Card.Text>
                  </Card.Body>
                  <Card.Footer className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Vendor:</strong>
                      <br />
                      {vendorName}
                      <br />
                      {vendorNumber}
                    </div>
                    <a href={`tel:${vendorNumber}`} className="btn btn-outline-primary">
                      <FaPhoneAlt /> Call
                    </a>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
};

export default AllProductsPage;
