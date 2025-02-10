"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebaseConfig";
import { ref, get, push, set, update } from "firebase/database";
import {
  Spinner,
  Alert,
  Button,
  Form,
  Card,
  ListGroup,
} from "react-bootstrap";
import Link from "next/link";

/**
 * Sells products from a single unified product list (all vendors combined).
 * Does NOT show vendor names — only product names.
 * Deducts sold quantity from the original vendor’s inventory.
 */
const SellPage = () => {
  // Customer details
  const [customer, setCustomer] = useState({ name: "", number: "" });

  // List of all products from all vendors
  const [allProducts, setAllProducts] = useState([]);

  // Products being sold in this transaction
  const [saleProducts, setSaleProducts] = useState([
    {
      productId: "",
      quantity: 1,
      productName: "",
      mrpPrice: 0,
      vendorId: "", // hidden from user, but needed for inventory updates
    },
  ]);

  // Discount
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  // Loading / Error states
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Form Errors
  const [errors, setErrors] = useState({});

  // Submission status feedback
  const [submissionStatus, setSubmissionStatus] = useState({
    success: "",
    error: "",
  });

  // Users data for autocomplete
  const [users, setUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestionsRef = useRef(null);

  //--------------------------------------------------
  // 1. Fetch all products from all vendors (once)
  //--------------------------------------------------
  useEffect(() => {
    const vendorsRef = ref(db, "vendors");

    get(vendorsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const vendorsData = snapshot.val();
          const productsArray = [];

          // Gather all products from all vendors
          Object.entries(vendorsData).forEach(([vendorId, vendorObj]) => {
            if (vendorObj.products) {
              Object.entries(vendorObj.products).forEach(
                ([productId, productObj]) => {
                  productsArray.push({
                    vendorId, // needed for inventory updates
                    productId,
                    name: productObj.name,
                    mrpPrice: productObj.mrpPrice,
                    quantityAvailable: productObj.quantity,
                  });
                }
              );
            }
          });

          setAllProducts(productsArray);
        } else {
          setAllProducts([]); // no vendors or products
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching vendors:", error);
        setFetchError("Failed to load products. Please try again later.");
        setLoading(false);
      });
  }, []);

  //--------------------------------------------------
  // 2. Fetch unique users for autocomplete (once)
  //--------------------------------------------------
  useEffect(() => {
    const appointmentsRef = ref(db, "appointments/test");

    get(appointmentsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const appointmentsData = snapshot.val();
          const usersMap = {};

          // Extract unique phone numbers and associated names
          Object.values(appointmentsData).forEach((appointment) => {
            const phone = appointment.phone;
            const name = appointment.name;
            if (phone && !usersMap[phone]) {
              usersMap[phone] = name;
            }
          });

          const usersArray = Object.entries(usersMap).map(([phone, name]) => ({
            phone,
            name,
          }));
          setUsers(usersArray);
        } else {
          setUsers([]); // no users found
        }
      })
      .catch((error) => {
        console.error("Error fetching users for autocomplete:", error);
      });
  }, []);

  //--------------------------------------------------
  // 3. Handle input changes
  //--------------------------------------------------
  // a) Customer details
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // clear any existing errors

    if (name === "number") {
      if (value.length >= 3) {
        const matchingUsers = users.filter((user) =>
          user.phone.startsWith(value)
        );
        setSuggestions(matchingUsers);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      if (value.length === 0) {
        setCustomer((prev) => ({ ...prev, name: "" }));
      }
    }
  };

  // b) Sale product changes
  const handleSaleProductChange = (index, e) => {
    const { name, value } = e.target;
    const updatedSaleProducts = [...saleProducts];
    updatedSaleProducts[index][name] = value;

    // If user picks a new productId, fill in productName + MRP from allProducts
    if (name === "productId") {
      const foundProduct = allProducts.find((p) => p.productId === value);
      if (foundProduct) {
        updatedSaleProducts[index].productName = foundProduct.name;
        updatedSaleProducts[index].mrpPrice = foundProduct.mrpPrice;
        updatedSaleProducts[index].vendorId = foundProduct.vendorId;
      } else {
        // Reset if not found
        updatedSaleProducts[index].productName = "";
        updatedSaleProducts[index].mrpPrice = 0;
        updatedSaleProducts[index].vendorId = "";
      }
    }

    setSaleProducts(updatedSaleProducts);
    setErrors((prev) => ({
      ...prev,
      [`saleProduct-${index}-${name}`]: "",
    }));
  };

  //--------------------------------------------------
  // 4. Add/Remove sale items
  //--------------------------------------------------
  const addSaleProduct = () => {
    setSaleProducts((prev) => [
      ...prev,
      {
        productId: "",
        quantity: 1,
        productName: "",
        mrpPrice: 0,
        vendorId: "",
      },
    ]);
  };

  const removeSaleProduct = (index) => {
    // Keep at least one product row
    if (saleProducts.length === 1) return;
    setSaleProducts((prev) => prev.filter((_, i) => i !== index));
  };

  //--------------------------------------------------
  // 5. Helper Functions for Calculations
  //--------------------------------------------------
  // Calculate total amount before discount
  const calculateTotalAmount = () => {
    return saleProducts.reduce((acc, { quantity, mrpPrice }) => {
      const qty = parseInt(quantity, 10) || 0;
      const price = parseFloat(mrpPrice) || 0;
      return acc + qty * price;
    }, 0);
  };

  // Calculate discount amount
  const calculateDiscount = () => {
    const total = calculateTotalAmount();
    return (total * discountPercentage) / 100;
  };

  // Update final amount whenever total or discount changes
  useEffect(() => {
    const total = calculateTotalAmount();
    const discount = calculateDiscount();
    setFinalAmount(total - discount);
  }, [saleProducts, discountPercentage]);

  //--------------------------------------------------
  // 6. Validate form
  //--------------------------------------------------
  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    // Customer name & number
    if (!customer.name.trim()) {
      newErrors.name = "Customer name is required.";
      isValid = false;
    }
    if (!customer.number.trim()) {
      newErrors.number = "Customer number is required.";
      isValid = false;
    } else if (!/^\d{10}$/.test(customer.number)) {
      newErrors.number = "Customer number must be 10 digits.";
      isValid = false;
    }

    // Discount Percentage
    if (discountPercentage < 0 || discountPercentage > 100) {
      newErrors.discountPercentage = "Discount must be between 0 and 100.";
      isValid = false;
    }

    // Each sale product
    saleProducts.forEach((item, index) => {
      if (!item.productId) {
        newErrors[`saleProduct-${index}-productId`] = "Please select a product.";
        isValid = false;
      }
      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1) {
        newErrors[`saleProduct-${index}-quantity`] = "Quantity must be at least 1.";
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  //--------------------------------------------------
  // 7. Submit & process sale
  //--------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus({ success: "", error: "" });

    if (!validateForm()) {
      setSubmissionStatus({
        error: "Please fix the errors in the form.",
        success: "",
      });
      return;
    }

    try {
      // Calculate totals
      const totalAmount = calculateTotalAmount();
      const discountAmount = calculateDiscount();
      const finalSaleAmount = finalAmount;

      // Create a new sale entry
      const saleRef = push(ref(db, "sales"));
      const saleId = saleRef.key; // unique ID for this sale

      const saleData = {
        customerName: customer.name,
        customerNumber: customer.number,
        date: new Date().toISOString(),
        products: {},
        discountPercentage,
        discountAmount,
        finalAmount: finalSaleAmount,
      };

      // We'll gather updates for vendor product quantities & histories
      const updates = {};

      // Loop through each sale product
      for (let i = 0; i < saleProducts.length; i++) {
        const { productId, vendorId, productName, mrpPrice } = saleProducts[i];
        const qty = parseInt(saleProducts[i].quantity, 10);

        // Find the product in our allProducts array to check current stock
        const matching = allProducts.find(
          (p) => p.productId === productId && p.vendorId === vendorId
        );
        if (!matching) {
          throw new Error(`Selected product not found: ${productName}`);
        }
        if (matching.quantityAvailable < qty) {
          throw new Error(
            `Insufficient stock for "${matching.name}". Available: ${matching.quantityAvailable}, requested: ${qty}`
          );
        }

        // Deduct quantity from the vendor's product
        const remaining = matching.quantityAvailable - qty;
        updates[`vendors/${vendorId}/products/${productId}/quantity`] =
          remaining;

        // Record the product in saleData
        saleData.products[`productSale-${i}`] = {
          productId,
          productName,
          quantity: qty,
          mrpPrice: mrpPrice,
          totalPrice: qty * mrpPrice,
          vendorId,
        };

        // Add a history record for this product
        const historyKey = push(
          ref(db, `vendors/${vendorId}/products/${productId}/history`)
        ).key;
        updates[
          `vendors/${vendorId}/products/${productId}/sellhistory/${historyKey}`
        ] = {
          date: new Date().toISOString(),
          soldQuantity: qty,
          remainingQuantity: remaining,
          saleId,
        };
      }

      // Final: commit the sale and the updates in one go
      updates[`sales/${saleId}`] = saleData;
      await update(ref(db), updates);

      //--------------------------------------------
      // Update local state to reflect new quantities
      //--------------------------------------------
      const updatedAllProducts = allProducts.map((product) => {
        // Check if this product was sold in the current transaction
        const matchedSaleItem = saleProducts.find(
          (sp) =>
            sp.productId === product.productId &&
            sp.vendorId === product.vendorId
        );
        if (matchedSaleItem) {
          const soldQty = parseInt(matchedSaleItem.quantity, 10);
          return {
            ...product,
            quantityAvailable: product.quantityAvailable - soldQty,
          };
        }
        return product;
      });
      setAllProducts(updatedAllProducts);

      setSubmissionStatus({
        success: "Sale processed successfully!",
        error: "",
      });

      // Reset the form
      setCustomer({ name: "", number: "" });
      setSaleProducts([
        {
          productId: "",
          quantity: 1,
          productName: "",
          mrpPrice: 0,
          vendorId: "",
        },
      ]);
      setDiscountPercentage(0);
      setFinalAmount(0);
      setErrors({});
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error("Error processing sale:", error);
      setSubmissionStatus({
        error: error.message || "Failed to process sale.",
        success: "",
      });
    }
  };

  //--------------------------------------------------
  // 8. Handle suggestion selection
  //--------------------------------------------------
  const handleSuggestionClick = (user) => {
    setCustomer({ name: user.name, number: user.phone });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //--------------------------------------------------
  // 9. Render
  //--------------------------------------------------
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Loading products...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mt-5">
        <Alert variant="danger">{fetchError}</Alert>
        <Link href="/" passHref>
          <Button variant="secondary">Back Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      <h1 className="display-4 text-center mb-4">Sell Products (All Products Listed)</h1>
      <form onSubmit={handleSubmit} noValidate>
        {/* Status Alerts */}
        {submissionStatus.success && (
          <Alert
            variant="success"
            onClose={() =>
              setSubmissionStatus({ success: "", error: "" })
            }
            dismissible
          >
            {submissionStatus.success}
          </Alert>
        )}
        {submissionStatus.error && (
          <Alert
            variant="danger"
            onClose={() =>
              setSubmissionStatus({ success: "", error: "" })
            }
            dismissible
          >
            {submissionStatus.error}
          </Alert>
        )}

        {/* Customer Details */}
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h5 className="text-white">Customer Details</h5>
          </Card.Header>
          <Card.Body>
            <div className="row g-3">
              {/* Name */}
              <div className="col-md-6">
                <Form.Label>
                  Customer Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={customer.name}
                  onChange={handleCustomerChange}
                  isInvalid={!!errors.name}
                  placeholder="Enter customer name"
                  disabled={!!users.find((u) => u.phone === customer.number)}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </div>

              {/* Number */}
              <div className="col-md-6" ref={suggestionsRef}>
                <Form.Label>
                  Customer Number <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="tel"
                  name="number"
                  value={customer.number}
                  onChange={handleCustomerChange}
                  isInvalid={!!errors.number}
                  placeholder="10-digit number"
                  autoComplete="off"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.number}
                </Form.Control.Feedback>
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <ListGroup className="position-absolute w-100 z-index-3">
                    {suggestions.map((user, index) => (
                      <ListGroup.Item
                        key={index}
                        action
                        onClick={() => handleSuggestionClick(user)}
                      >
                        {user.phone} - {user.name}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Sale Products */}
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-white">Products to Sell</h5>
            <Button variant="light" size="sm" onClick={addSaleProduct}>
              <i className="bi bi-plus-circle me-1"></i> Add Product
            </Button>
          </Card.Header>
          <Card.Body>
            {saleProducts.map((item, index) => (
              <div
                key={index}
                className="border rounded p-3 mb-4 position-relative bg-light"
              >
                {/* Remove button */}
                {saleProducts.length > 1 && (
                  <button
                    type="button"
                    className="btn-close position-absolute top-0 end-0 m-3"
                    aria-label="Remove"
                    onClick={() => removeSaleProduct(index)}
                  />
                )}

                <div className="row g-3">
                  {/* Product Selection */}
                  <div className="col-md-8">
                    <Form.Label>
                      Product <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      name="productId"
                      value={item.productId}
                      onChange={(e) => handleSaleProductChange(index, e)}
                      isInvalid={!!errors[`saleProduct-${index}-productId`]}
                    >
                      <option value="">Select a product</option>
                      {allProducts.map((p) => (
                        <option
                          key={p.productId + p.vendorId}
                          value={p.productId}
                        >
                          {p.name} (Available: {p.quantityAvailable})
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors[`saleProduct-${index}-productId`]}
                    </Form.Control.Feedback>
                  </div>

                  {/* Quantity */}
                  <div className="col-md-4">
                    <Form.Label>
                      Quantity <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="quantity"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleSaleProductChange(index, e)}
                      isInvalid={!!errors[`saleProduct-${index}-quantity`]}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors[`saleProduct-${index}-quantity`]}
                    </Form.Control.Feedback>
                  </div>

                  {/* MRP (Read-Only) */}
                  <div className="col-md-4">
                    <Form.Label>MRP (₹)</Form.Label>
                    <Form.Control type="number" value={item.mrpPrice} readOnly />
                  </div>

                  {/* Product Name (Optional Display) */}
                  {item.productName && (
                    <div className="col-12">
                      <strong>Selected Product:</strong> {item.productName}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>

        {/* Discount Percentage */}
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-warning text-white">
            <h5 className="text-white">Discount</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3" controlId="discountPercentage">
              <Form.Label>Discount Percentage (%)</Form.Label>
              <Form.Control
                type="number"
                name="discountPercentage"
                value={discountPercentage}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setDiscountPercentage(value);
                  setErrors((prev) => ({ ...prev, discountPercentage: "" }));
                }}
                placeholder="Enter discount percentage"
                min="0"
                max="100"
                isInvalid={!!errors.discountPercentage}
              />
              <Form.Control.Feedback type="invalid">
                {errors.discountPercentage}
              </Form.Control.Feedback>
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Totals Summary */}
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-info text-white">
            <h5 className="text-white">Summary</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Total Amount:</strong> ₹{calculateTotalAmount().toFixed(2)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Discount ({discountPercentage}%):</strong> ₹{calculateDiscount().toFixed(2)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Final Amount:</strong> ₹{finalAmount.toFixed(2)}
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>

        {/* Submit Button */}
        <div className="d-grid">
          <Button type="submit" variant="success" size="lg">
            <i className="bi bi-cart-check me-2"></i> Process Sale
          </Button>
        </div>
      </form>

      {/* Optional Styles */}
      <style jsx>{`
        .btn-close {
          background: transparent;
          border: none;
        }
        .btn-close:hover {
          background: rgba(0, 0, 0, 0.1);
        }
        .bg-light {
          background-color: #f8f9fa !important;
        }
        .z-index-3 {
          z-index: 3;
        }
      `}</style>

      {/* Bootstrap Icons (optional) */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
      />
    </div>
  );
};

export default SellPage;
