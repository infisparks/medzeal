"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '../../../../lib/firebaseConfig';
import {
  ref,
  onValue,
  push,
  update,
  set,
  child
} from 'firebase/database';
import {
  Spinner,
  Alert,
  Table,
  Button,
  Form,
  Card,
  Collapse,
  Toast,
  ToastContainer,
  InputGroup
} from 'react-bootstrap';
import { 
  BsArrowLeft, 
  BsPlusCircle, 
  BsCheckCircle, 
  BsExclamationTriangle, 
  BsSave, 
  BsTrash 
} from 'react-icons/bs';

const VendorProductPage = () => {
  const router = useRouter();
  const params = useParams();
  const { vendorId } = params;

  // Vendor details
  const [vendor, setVendor] = useState(null);
  // Products object: { productId: { ...productFields, history: {...} }, ... }
  const [products, setProducts] = useState({});

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // State for adding a new product
  const [newProduct, setNewProduct] = useState({
    name: '',
    avgQuantity: '',
    quantity: '',
    productPrice: '',
    mrpPrice: '',
    creditCycleDate: '',
  });

  // Additional quantity inputs (per product)
  // e.g., { productId1: '5', productId2: '3' }
  const [stockValues, setStockValues] = useState({});

  // Track which product's history is toggled open
  // e.g., { productId1: true, productId2: false }
  const [historyToggles, setHistoryToggles] = useState({});

  // State for toggling the add product form
  const [showAddProductForm, setShowAddProductForm] = useState(false);

  // Toast Notifications
  const [toast, setToast] = useState({
    show: false,
    message: '',
    variant: '',
  });

  // -------------------------------
  // 1. Fetch Vendor + Products
  // -------------------------------
  useEffect(() => {
    if (!vendorId) {
      setError(true);
      setLoading(false);
      return;
    }

    const vendorRef = ref(db, `vendors/${vendorId}`);
    const unsubscribe = onValue(
      vendorRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setVendor({
            id: vendorId,
            name: data.name,
            number: data.number,
            address: data.address,
          });
          setProducts(data.products || {});
        } else {
          setError(true);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching vendor:', err);
        setError(true);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [vendorId]);

  // -------------------------------
  // 2. Handle Add New Product
  // -------------------------------
  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddNewProduct = async (e) => {
    e.preventDefault();
    // Basic validation
    if (
      !newProduct.name ||
      !newProduct.avgQuantity ||
      !newProduct.quantity ||
      !newProduct.productPrice ||
      !newProduct.mrpPrice ||
      !newProduct.creditCycleDate
    ) {
      showToast('Please fill in all fields for the new product.', 'danger');
      return;
    }

    // Reference to vendor's products
    const productsRef = ref(db, `vendors/${vendorId}/products`);
    // Generate a new product key
    const newProductRef = push(productsRef);

    // Parse input values
    const initialQuantity = parseInt(newProduct.quantity, 10) || 0;
    const now = new Date().toISOString();

    // Prepare product data
    const productData = {
      name: newProduct.name,
      avgQuantity: parseInt(newProduct.avgQuantity, 10),
      quantity: initialQuantity,
      productPrice: parseFloat(newProduct.productPrice),
      mrpPrice: parseFloat(newProduct.mrpPrice),
      creditCycleDate: parseInt(newProduct.creditCycleDate, 10),
      lastUpdated: now,
      // Start with no history in the object
      history: {},
    };

    try {
      // 2.1. Create the product
      await set(newProductRef, productData);

      // 2.2. If the user entered a non-zero quantity,
      //      log that in the product's history as the "initial" addition
      if (initialQuantity > 0) {
        const historyRef = child(newProductRef, 'history');
        const historyEntry = {
          date: now,
          addedQuantity: initialQuantity,
          newQuantity: initialQuantity,
          payment: "pending"
        };
        await push(historyRef, historyEntry);
      }

      // 2.3. Reset new product form
      setNewProduct({
        name: '',
        avgQuantity: '',
        quantity: '',
        productPrice: '',
        mrpPrice: '',
        creditCycleDate: '',
      });

      setShowAddProductForm(false);
      showToast('New product added successfully!', 'success');
    } catch (err) {
      console.error('Error adding product:', err);
      showToast('Failed to add product. Please try again.', 'danger');
    }
  };

  // -------------------------------
  // 3. Handle Add Stock to Existing Product
  // -------------------------------
  const handleStockChange = (productId, e) => {
    setStockValues((prev) => ({
      ...prev,
      [productId]: e.target.value,
    }));
  };

  const handleSaveStock = async (productId) => {
    const additionalQuantity = parseInt(stockValues[productId] || '0', 10);
    if (isNaN(additionalQuantity) || additionalQuantity <= 0) {
      showToast('Please enter a valid positive number for additional quantity.', 'danger');
      return;
    }

    const productPath = `vendors/${vendorId}/products/${productId}`;
    const productRef = ref(db, productPath);
    const currentProduct = products[productId];

    if (!currentProduct) {
      showToast('Product not found.', 'danger');
      return;
    }

    const updatedQuantity = currentProduct.quantity + additionalQuantity;
    const now = new Date().toISOString();

    // 3.1. Update main product
    try {
      await update(productRef, {
        quantity: updatedQuantity,
        lastUpdated: now,
      });
    } catch (err) {
      console.error('Error updating quantity:', err);
      showToast('Failed to update quantity. Please try again.', 'danger');
      return;
    }

    // 3.2. Push a new history record
    const historyRef = ref(db, `${productPath}/history`);
    const historyData = {
      date: now,
      addedQuantity: additionalQuantity,
      newQuantity: updatedQuantity,
      payment: "pending"
    };

    try {
      await push(historyRef, historyData);
    } catch (err) {
      console.error('Error pushing history:', err);
      showToast('Failed to update product history. Please try again.', 'danger');
      return;
    }

    // 3.3. Clear the input
    setStockValues((prev) => ({
      ...prev,
      [productId]: '',
    }));
    showToast('Quantity updated and history saved successfully!', 'success');
  };

  // -------------------------------
  // 4. Toggle History View
  // -------------------------------
  const handleToggleHistory = (productId) => {
    setHistoryToggles((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // -------------------------------
  // 5. Toast Notification Handler
  // -------------------------------
  const showToast = (message, variant) => {
    setToast({
      show: true,
      message,
      variant,
    });

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast({
        show: false,
        message: '',
        variant: '',
      });
    }, 3000);
  };

  // -------------------------------
  // 6. Rendering Logic
  // -------------------------------
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Loading vendor details...</span>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="container mt-5">
        <Alert variant="danger" className="d-flex align-items-center">
          <BsExclamationTriangle className="me-2" size={24} />
          <span>Unable to fetch vendor details. Please ensure the vendor exists and try again.</span>
        </Alert>
        <Link href="/admin/vendors" passHref>
          <Button variant="secondary" className="d-flex align-items-center">
            <BsArrowLeft className="me-2" /> Back to Vendors List
          </Button>
        </Link>
      </div>
    );
  }

  const productEntries = Object.entries(products);

  return (
    <div className="container mt-5 mb-5">
      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          onClose={() => setToast({ ...toast, show: false })}
          show={toast.show}
          bg={toast.variant}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Vendor Info */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-2">{vendor.name}</h2>
              <p className="mb-1"><strong>Number:</strong> {vendor.number}</p>
              <p className="mb-0"><strong>Address:</strong> {vendor.address}</p>
            </div>
            <Link href="/admin/vendors" passHref>
              <Button variant="secondary" className="d-flex align-items-center">
                <BsArrowLeft className="me-2" /> Back
              </Button>
            </Link>
          </div>
        </Card.Body>
      </Card>

      {/* Existing Products */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Products</h3>
        {/* Button to toggle the add product form */}
        <Button 
          variant="primary" 
          onClick={() => setShowAddProductForm(!showAddProductForm)}
          className="d-flex align-items-center"
        >
          <BsPlusCircle className="me-2" /> {showAddProductForm ? 'Close' : 'Add New Product'}
        </Button>
      </div>

      {/* Integrated Add Product Form */}
      <Collapse in={showAddProductForm}>
        <div className="mb-4">
          <Card className="shadow-sm">
            <Card.Body>
              <Form onSubmit={handleAddNewProduct}>
                <div className="row">
                  {/* Product Name */}
                  <div className="col-md-4 mb-3">
                    <Form.Label>Product Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={newProduct.name}
                      onChange={handleNewProductChange}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  {/* Avg Quantity */}
                  <div className="col-md-2 mb-3">
                    <Form.Label>Average Quantity <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="avgQuantity"
                      value={newProduct.avgQuantity}
                      onChange={handleNewProductChange}
                      min="0"
                      placeholder="e.g., 50"
                      required
                    />
                  </div>
                  {/* Quantity */}
                  <div className="col-md-2 mb-3">
                    <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="quantity"
                      value={newProduct.quantity}
                      onChange={handleNewProductChange}
                      min="0"
                      placeholder="e.g., 100"
                      required
                    />
                  </div>
                  {/* Product Price */}
                  <div className="col-md-2 mb-3">
                    <Form.Label>Product Price (₹) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="productPrice"
                      value={newProduct.productPrice}
                      onChange={handleNewProductChange}
                      min="0"
                      step="0.01"
                      placeholder="e.g., 500"
                      required
                    />
                  </div>
                  {/* MRP Price */}
                  <div className="col-md-2 mb-3">
                    <Form.Label>MRP Price (₹) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="mrpPrice"
                      value={newProduct.mrpPrice}
                      onChange={handleNewProductChange}
                      min="0"
                      step="0.01"
                      placeholder="e.g., 550"
                      required
                    />
                  </div>
                  {/* Credit Cycle Date */}
                  <div className="col-md-2 mb-3">
                    <Form.Label>Credit Cycle (Days) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="creditCycleDate"
                      value={newProduct.creditCycleDate}
                      onChange={handleNewProductChange}
                      min="1"
                      placeholder="e.g., 30"
                      required
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end">
                  <Button variant="success" type="submit" className="d-flex align-items-center">
                    <BsSave className="me-2" /> Save Product
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </Collapse>

      {/* Existing Products Table */}
      {productEntries.length === 0 ? (
        <Alert variant="info">No products found for this vendor.</Alert>
      ) : (
        <Table striped bordered hover responsive className="shadow-sm">
          <thead className="table-primary">
            <tr>
              <th>#</th>
              <th>Product Name</th>
              <th>Avg Qty</th>
              <th>Qty</th>
              <th>Price (₹)</th>
              <th>MRP (₹)</th>
              <th>Credit Cycle (Days)</th>
              <th>Add Qty</th>
              <th>History</th>
            </tr>
          </thead>
          <tbody>
            {productEntries.map(([productId, product], index) => {
              const addedQty = stockValues[productId] || '';
              const showHistory = historyToggles[productId] || false;
              const historyEntries = product.history
                ? Object.entries(product.history)
                : [];

              return (
                <React.Fragment key={productId}>
                  {/* Main Product Row */}
                  <tr>
                    <td>{index + 1}</td>
                    <td>{product.name}</td>
                    <td>{product.avgQuantity}</td>
                    <td>{product.quantity}</td>
                    <td>{product.productPrice.toFixed(2)}</td>
                    <td>{product.mrpPrice.toFixed(2)}</td>
                    <td>{product.creditCycleDate}</td>
                    {/* Add Quantity Form (inline) */}
                    <td style={{ minWidth: '150px' }}>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={addedQty}
                          onChange={(e) => handleStockChange(productId, e)}
                        />
                        <Button variant="success" onClick={() => handleSaveStock(productId)}>
                          <BsCheckCircle className="me-1" /> Add
                        </Button>
                      </InputGroup>
                    </td>
                    {/* Toggle History Button */}
                    <td>
                      <Button
                        variant="info"
                        onClick={() => handleToggleHistory(productId)}
                        aria-controls={`history-collapse-${productId}`}
                        aria-expanded={showHistory}
                      >
                        {showHistory ? 'Hide' : 'Show'}
                      </Button>
                    </td>
                  </tr>

                  {/* Collapsible History Row */}
                  <tr>
                    <td colSpan={9} style={{ padding: 0, border: 'none' }}>
                      <Collapse in={showHistory}>
                        <div id={`history-collapse-${productId}`}>
                          <Table
                            bordered
                            hover
                            size="sm"
                            className="m-2"
                            style={{ background: '#fff' }}
                          >
                            <thead className="table-secondary">
                              <tr>
                                <th>#</th>
                                <th>Date</th>
                                <th>Added Qty</th>
                                <th>New Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {historyEntries.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="text-center">
                                    No history for this product.
                                  </td>
                                </tr>
                              ) : (
                                historyEntries.map(
                                  ([historyId, record], idx) => (
                                    <tr key={historyId}>
                                      <td>{idx + 1}</td>
                                      <td>
                                        {new Date(record.date).toLocaleString()}
                                      </td>
                                      <td>{record.addedQuantity}</td>
                                      <td>{record.newQuantity}</td>
                                    </tr>
                                  )
                                )
                              )}
                            </tbody>
                          </Table>
                        </div>
                      </Collapse>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );

  // -------------------------------
  // 7. Toast Notifications and Custom Styles
  // -------------------------------
  return (
    <div className="container mt-5 mb-5">
      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          onClose={() => setToast({ ...toast, show: false })}
          show={toast.show}
          bg={toast.variant}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Rest of the component as above */}

      {/* Custom Styles */}
      <style jsx>{`
        /* Custom Color Variables */
        :root {
          --primary-color: #1976D2; /* Blue */
          --secondary-color: #388E3C; /* Green */
          --accent-color: #F57C00; /* Orange */
          --background-color: #F5F5F5; /* Light Gray */
          --text-color: #424242; /* Dark Gray */
        }

        body {
          background-color: var(--background-color);
          color: var(--text-color);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .shadow-sm {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }

        .shadow-sm:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
          transition: box-shadow 0.3s ease-in-out;
        }

        .table-primary th {
          background-color: var(--primary-color);
          color: #fff;
        }

        .table-secondary th {
          background-color: var(--secondary-color);
          color: #fff;
        }

        .btn-primary {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }

        .btn-primary:hover {
          background-color: #1565C0;
          border-color: #0D47A1;
        }

        .btn-success {
          background-color: var(--secondary-color);
          border-color: var(--secondary-color);
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }

        .btn-success:hover {
          background-color: #2E7D32;
          border-color: #1B5E20;
        }

        .btn-info {
          background-color: var(--accent-color);
          border-color: var(--accent-color);
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }

        .btn-info:hover {
          background-color: #EF6C00;
          border-color: #E65100;
        }

        .btn-secondary {
          background-color: #757575;
          border-color: #757575;
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }

        .btn-secondary:hover {
          background-color: #616161;
          border-color: #424242;
        }

        .btn-close {
          background: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          padding: 0;
        }

        .btn-close:hover {
          background: rgba(255, 255, 255, 1);
        }

        /* Form Label Styling */
        .form-label {
          font-weight: 600;
        }

        /* Input Focus Styles */
        .form-control:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 0.2rem rgba(25, 118, 210, 0.25);
        }

        /* Toast Styles */
        .toast-container {
          z-index: 1060; /* Ensure toast appears above other elements */
        }

        /* Responsive Adjustments */
        @media (max-width: 768px) {
          .form-label span.text-danger {
            display: inline-block;
            margin-left: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VendorProductPage;
