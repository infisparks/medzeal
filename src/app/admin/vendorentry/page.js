"use client";
import React, { useState } from 'react';
import { db } from '../../../lib/firebaseConfig';
import { ref, push, set } from 'firebase/database';

const VendorEntryPage = () => {
  const [vendor, setVendor] = useState({
    name: '',
    number: '',
    address: '',
  });

  const [products, setProducts] = useState([
    {
      name: '',
      avgQuantity: '',
      quantity: '',
      productPrice: '',
      mrpPrice: '',
      creditCycleDate: '',
    },
  ]);

  const [errors, setErrors] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState({
    success: '',
    error: '',
  });

  // Handle changes in vendor details
  const handleVendorChange = (e) => {
    const { name, value } = e.target;
    setVendor({
      ...vendor,
      [name]: value,
    });

    // Clear errors for the field
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Handle changes in product details
  const handleProductChange = (index, e) => {
    const { name, value } = e.target;
    const updatedProducts = products.map((product, i) =>
      i === index ? { ...product, [name]: value } : product
    );
    setProducts(updatedProducts);

    // Clear errors for the field
    setErrors((prev) => {
      const updatedErrors = { ...prev };
      if (updatedErrors[`product-${index}-${name}`]) {
        delete updatedErrors[`product-${index}-${name}`];
      }
      return updatedErrors;
    });
  };

  // Add a new empty product form
  const addProduct = () => {
    setProducts([
      ...products,
      {
        name: '',
        avgQuantity: '',
        quantity: '',
        productPrice: '',
        mrpPrice: '',
        creditCycleDate: '',
      },
    ]);
  };

  // Remove a product form by index
  const removeProduct = (index) => {
    if (products.length === 1) return; // Prevent removing the last product

    setProducts(products.filter((_, i) => i !== index));
  };

  // Validate form fields
  const validateForm = () => {
    let valid = true;
    const newErrors = {};

    // Validate vendor details
    if (!vendor.name.trim()) {
      newErrors.name = 'Vendor name is required.';
      valid = false;
    }
    if (!vendor.number.trim()) {
      newErrors.number = 'Vendor number is required.';
      valid = false;
    } else if (!/^\d{10}$/.test(vendor.number)) {
      newErrors.number = 'Vendor number must be a 10-digit number.';
      valid = false;
    }
    if (!vendor.address.trim()) {
      newErrors.address = 'Vendor address is required.';
      valid = false;
    }

    // Validate each product
    products.forEach((product, index) => {
      if (!product.name.trim()) {
        newErrors[`product-${index}-name`] = 'Product name is required.';
        valid = false;
      }
      if (!product.avgQuantity) {
        newErrors[`product-${index}-avgQuantity`] = 'Average quantity is required.';
        valid = false;
      } else if (parseInt(product.avgQuantity, 10) < 0) {
        newErrors[`product-${index}-avgQuantity`] = 'Average quantity cannot be negative.';
        valid = false;
      }
      if (!product.quantity) {
        newErrors[`product-${index}-quantity`] = 'Quantity is required.';
        valid = false;
      } else if (parseInt(product.quantity, 10) < 0) {
        newErrors[`product-${index}-quantity`] = 'Quantity cannot be negative.';
        valid = false;
      }
      if (!product.productPrice) {
        newErrors[`product-${index}-productPrice`] = 'Product price is required.';
        valid = false;
      } else if (parseFloat(product.productPrice) < 0) {
        newErrors[`product-${index}-productPrice`] = 'Product price cannot be negative.';
        valid = false;
      }
      if (!product.mrpPrice) {
        newErrors[`product-${index}-mrpPrice`] = 'MRP price is required.';
        valid = false;
      } else if (parseFloat(product.mrpPrice) < 0) {
        newErrors[`product-${index}-mrpPrice`] = 'MRP price cannot be negative.';
        valid = false;
      }
      if (!product.creditCycleDate) {
        newErrors[`product-${index}-creditCycleDate`] = 'Credit cycle date is required.';
        valid = false;
      } else if (parseInt(product.creditCycleDate, 10) <= 0) {
        newErrors[`product-${index}-creditCycleDate`] = 'Credit cycle date must be a positive number.';
        valid = false;
      }
    });

    setErrors(newErrors);
    return valid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus({ success: '', error: '' });

    if (!validateForm()) {
      setSubmissionStatus({ error: 'Please fix the errors in the form.', success: '' });
      return;
    }

    // Reference to the 'vendors' node in Firebase
    const vendorsRef = ref(db, 'vendors');

    // Create a new vendor entry with a unique key
    const newVendorRef = push(vendorsRef);
    const newVendorKey = newVendorRef.key;

    // Keep track of each product's key so we can push history later
    const productKeyMap = {};

    // Generate unique keys for each product under the new vendor
    const productsWithKeys = products.reduce((acc, product) => {
      // Generate a unique key for each product
      const newProductKey = push(ref(db, `vendors/${newVendorKey}/products`)).key;
      productKeyMap[newProductKey] = product;

      acc[newProductKey] = {
        name: product.name,
        avgQuantity: parseInt(product.avgQuantity, 10),
        quantity: parseInt(product.quantity, 10),
        productPrice: parseFloat(product.productPrice),
        mrpPrice: parseFloat(product.mrpPrice),
        creditCycleDate: parseInt(product.creditCycleDate, 10),
        // Start with an empty 'history' object in the database
        history: {},
      };
      return acc;
    }, {});

    // Prepare the vendor data object
    const vendorData = {
      name: vendor.name,
      number: vendor.number,
      address: vendor.address,
      products: productsWithKeys,
    };

    try {
      // 1) Create the vendor + products in Firebase
      await set(newVendorRef, vendorData);

      // 2) For each product, if quantity > 0, push an initial history record
      const historyPromises = Object.entries(productKeyMap).map(
        async ([productKey, product]) => {
          const initialQty = parseInt(product.quantity, 10) || 0;
          if (initialQty > 0) {
            const now = new Date().toISOString();
            const historyRef = ref(
              db,
              `vendors/${newVendorKey}/products/${productKey}/history`
            );
            await push(historyRef, {
              date: now,
              addedQuantity: initialQty,
              newQuantity: initialQty,
              payment: "pending"
            });
          }
        }
      );

      await Promise.all(historyPromises);

      setSubmissionStatus({ success: 'Vendor and products added successfully!', error: '' });

      // Reset the form
      setVendor({ name: '', number: '', address: '' });
      setProducts([
        {
          name: '',
          avgQuantity: '',
          quantity: '',
          productPrice: '',
          mrpPrice: '',
          creditCycleDate: '',
        },
      ]);
      setErrors({});
    } catch (error) {
      console.error('Error adding vendor:', error);
      setSubmissionStatus({ error: 'Failed to add vendor. Please try again.', success: '' });
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <h1 className="display-4 text-center mb-4 text-primary">Add New Vendor</h1>
      <form onSubmit={handleSubmit} noValidate>
        {/* Submission Alerts */}
        {submissionStatus.success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            {submissionStatus.success}
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="alert"
              aria-label="Close"
            ></button>
          </div>
        )}
        {submissionStatus.error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {submissionStatus.error}
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="alert"
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Vendor Details */}
        <div className="card mb-4 shadow-custom">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-white">Vendor Details</h5>
            <i className="bi bi-shop fs-4"></i>
          </div>
          <div className="card-body">
            <div className="row g-4">
              {/* Vendor Name */}
              <div className="col-md-4">
                <label htmlFor="vendorName" className="form-label">
                  Vendor Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="vendorName"
                  name="name"
                  value={vendor.name}
                  onChange={handleVendorChange}
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  placeholder="Enter vendor name"
                  required
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              {/* Vendor Number */}
              <div className="col-md-4">
                <label htmlFor="vendorNumber" className="form-label">
                  Vendor Number <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  id="vendorNumber"
                  name="number"
                  value={vendor.number}
                  onChange={handleVendorChange}
                  className={`form-control ${errors.number ? 'is-invalid' : ''}`}
                  placeholder="e.g., 9876543210"
                  pattern="\d{10}"
                  required
                />
                {errors.number && <div className="invalid-feedback">{errors.number}</div>}
                <small className="form-text text-muted">Enter a 10-digit number.</small>
              </div>

              {/* Vendor Address */}
              <div className="col-md-4">
                <label htmlFor="vendorAddress" className="form-label">
                  Vendor Address <span className="text-danger">*</span>
                </label>
                <textarea
                  id="vendorAddress"
                  name="address"
                  value={vendor.address}
                  onChange={handleVendorChange}
                  className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                  placeholder="Enter vendor address"
                  rows="3"
                  required
                ></textarea>
                {errors.address && <div className="invalid-feedback">{errors.address}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="card mb-4 shadow-custom">
          <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-white">Products</h5>
            <button
              type="button"
              className="btn btn-light btn-sm"
              onClick={addProduct}
              title="Add another product"
            >
              <i className="bi bi-plus-circle me-1"></i> Add Product
            </button>
          </div>
          <div className="card-body">
            {products.map((product, index) => (
              <div key={index} className="product-form border rounded p-4 mb-4 position-relative bg-white shadow-sm">
                {products.length > 1 && (
                  <button
                    type="button"
                    className="btn-close position-absolute top-0 end-0 m-3"
                    aria-label="Remove"
                    onClick={() => removeProduct(index)}
                    title="Remove this product"
                  ></button>
                )}
                <div className="row g-4">
                  {/* Product Name */}
                  <div className="col-md-4">
                    <label htmlFor={`productName-${index}`} className="form-label">
                      Product Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id={`productName-${index}`}
                      name="name"
                      value={product.name}
                      onChange={(e) => handleProductChange(index, e)}
                      className={`form-control ${errors[`product-${index}-name`] ? 'is-invalid' : ''}`}
                      placeholder="Enter product name"
                      required
                    />
                    {errors[`product-${index}-name`] && (
                      <div className="invalid-feedback">
                        {errors[`product-${index}-name`]}
                      </div>
                    )}
                  </div>

                  {/* Average Quantity */}
                  <div className="col-md-2">
                    <label htmlFor={`avgQuantity-${index}`} className="form-label">
                      Avg Quantity <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id={`avgQuantity-${index}`}
                      name="avgQuantity"
                      value={product.avgQuantity}
                      onChange={(e) => handleProductChange(index, e)}
                      className={`form-control ${errors[`product-${index}-avgQuantity`] ? 'is-invalid' : ''}`}
                      placeholder="e.g., 50"
                      min="0"
                      required
                    />
                    {errors[`product-${index}-avgQuantity`] && (
                      <div className="invalid-feedback">
                        {errors[`product-${index}-avgQuantity`]}
                      </div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="col-md-2">
                    <label htmlFor={`quantity-${index}`} className="form-label">
                      Quantity <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id={`quantity-${index}`}
                      name="quantity"
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, e)}
                      className={`form-control ${errors[`product-${index}-quantity`] ? 'is-invalid' : ''}`}
                      placeholder="e.g., 100"
                      min="0"
                      required
                    />
                    {errors[`product-${index}-quantity`] && (
                      <div className="invalid-feedback">
                        {errors[`product-${index}-quantity`]}
                      </div>
                    )}
                  </div>

                  {/* Product Price */}
                  <div className="col-md-2">
                    <label htmlFor={`productPrice-${index}`} className="form-label">
                      Product Price (₹) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id={`productPrice-${index}`}
                      name="productPrice"
                      value={product.productPrice}
                      onChange={(e) => handleProductChange(index, e)}
                      className={`form-control ${errors[`product-${index}-productPrice`] ? 'is-invalid' : ''}`}
                      placeholder="e.g., 500"
                      min="0"
                      step="0.01"
                      required
                    />
                    {errors[`product-${index}-productPrice`] && (
                      <div className="invalid-feedback">
                        {errors[`product-${index}-productPrice`]}
                      </div>
                    )}
                  </div>

                  {/* MRP Price */}
                  <div className="col-md-2">
                    <label htmlFor={`mrpPrice-${index}`} className="form-label">
                      MRP Price (₹) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id={`mrpPrice-${index}`}
                      name="mrpPrice"
                      value={product.mrpPrice}
                      onChange={(e) => handleProductChange(index, e)}
                      className={`form-control ${errors[`product-${index}-mrpPrice`] ? 'is-invalid' : ''}`}
                      placeholder="e.g., 550"
                      min="0"
                      step="0.01"
                      required
                    />
                    {errors[`product-${index}-mrpPrice`] && (
                      <div className="invalid-feedback">
                        {errors[`product-${index}-mrpPrice`]}
                      </div>
                    )}
                  </div>

                  {/* Credit Cycle Date */}
                  <div className="col-md-2">
                    <label htmlFor={`creditCycleDate-${index}`} className="form-label">
                      Credit Cycle Date (Days) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id={`creditCycleDate-${index}`}
                      name="creditCycleDate"
                      value={product.creditCycleDate}
                      onChange={(e) => handleProductChange(index, e)}
                      className={`form-control ${errors[`product-${index}-creditCycleDate`] ? 'is-invalid' : ''}`}
                      placeholder="e.g., 30"
                      min="1"
                      required
                    />
                    {errors[`product-${index}-creditCycleDate`] && (
                      <div className="invalid-feedback">
                        {errors[`product-${index}-creditCycleDate`]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="d-grid">
          <button type="submit" className="btn btn-accent bg-black">
            <i className="bi bi-save me-2"></i> Save Vendor
          </button>
        </div>
      </form>

      {/* Optional: Custom Styles */}
      <style jsx>{`
        /* Custom Color Variables */
        :root {
          --primary-color: #4A90E2; /* Calm Blue */
          --secondary-color: #50E3C2; /* Vibrant Teal */
          --accent-color: #F5A623; /* Warm Orange */
          --background-color: #F0F4F8; /* Light Gray-Blue */
          --text-color: #333333; /* Dark Gray */
        }

        body {
          background-color: var(--background-color);
          color: var(--text-color);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .shadow-custom {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .btn-accent {
          background-color: var(--accent-color);
          color: #ffffff;
          border: none;
          transition: background-color 0.3s ease;
        }

        .btn-accent:hover {
          background-color: #e5941d;
        }

        .card-header {
          border-bottom: none;
          border-radius: 8px 8px 0 0;
        }

        .card-body {
          background-color: #ffffff;
        }

        .product-form {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .product-form:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        /* Adjusting the close button */
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

        /* Responsive Adjustments */
        @media (max-width: 768px) {
          .form-label span.text-danger {
            display: inline-block;
            margin-left: 0.25rem;
          }
        }

        /* Input Focus Styles */
        .form-control:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 0.2rem rgba(74, 144, 226, 0.25);
        }

        /* Alert Icon Styling */
        .alert i {
          font-size: 1.2rem;
        }
      `}</style>

      {/* Bootstrap Icons CDN */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
      />
    </div>
  );
};

export default VendorEntryPage;
