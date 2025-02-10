"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { ref, onValue, update } from "firebase/database";
import {
  Spinner,
  Alert,
  Table,
  Button,
  Container,
  Row,
  Col,
  Form,
  InputGroup,
  Toast,
  ToastContainer,
  Pagination,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import dayjs from "dayjs";
import { CheckCircleFill, XCircleFill, Search, X } from "react-bootstrap-icons";

/**
 * CreditCyclePage
 *
 * Displays pending payment entries based on product's credit cycle.
 * Allows marking payments as done without using pop-up confirmations.
 * Includes a search functionality to filter pending payments.
 * Enhanced UI/UX for a more professional look.
 */
const CreditCyclePage = () => {
  // State variables
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // State for search query
  const [searchQuery, setSearchQuery] = useState("");

  // State for toast notifications
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "", // 'success' or 'danger'
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch data on component mount
  useEffect(() => {
    const vendorsRef = ref(db, "vendors");

    const unsubscribe = onValue(
      vendorsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const paymentsList = [];

          // Iterate through vendors
          Object.entries(data).forEach(([vendorId, vendorData]) => {
            const { name: vendorName } = vendorData;

            // Iterate through products
            if (vendorData.products) {
              Object.entries(vendorData.products).forEach(
                ([productId, productData]) => {
                  const { name: productName, creditCycleDate, history, productPrice } = productData;

                  // Iterate through history
                  if (history) {
                    Object.entries(history).forEach(([historyId, historyEntry]) => {
                      const { addedQuantity, date, payment } = historyEntry;

                      if (payment === "pending") {
                        // Calculate days left
                        const addedDate = dayjs(date);
                        const creditCycleDays = creditCycleDate;
                        const dueDate = addedDate.add(creditCycleDays, "day");
                        const today = dayjs();
                        const daysLeft = dueDate.diff(today, "day");

                        // Calculate total amount using productPrice
                        const totalAmount = addedQuantity * productPrice;

                        paymentsList.push({
                          vendorId,
                          vendorName,
                          productId,
                          productName,
                          historyId,
                          addedQuantity,
                          addedDate: addedDate.format("YYYY-MM-DD"),
                          creditCycleDays,
                          dueDate: dueDate.format("YYYY-MM-DD"),
                          daysLeft: daysLeft >= 0 ? daysLeft : 0,
                          productPrice,      // Include productPrice
                          totalAmount,       // Include totalAmount
                        });
                      }
                    });
                  }
                }
              );
            }
          });

          setPendingPayments(paymentsList);
        } else {
          setPendingPayments([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching data:", error);
        setFetchError("Failed to load data. Please try again later.");
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Handle marking payment as done
  const handleMarkAsDone = async (payment) => {
    const { vendorId, productId, historyId } = payment;

    const paymentPath = `vendors/${vendorId}/products/${productId}/history/${historyId}/payment`;
    const paymentRef = ref(db, paymentPath);

    try {
      await update(paymentRef, { payment: "done" });

      // Remove the payment from the pending list
      setPendingPayments((prev) =>
        prev.filter(
          (p) =>
            !(
              p.vendorId === vendorId &&
              p.productId === productId &&
              p.historyId === historyId
            )
        )
      );

      // Show success toast
      setToast({
        show: true,
        message: "Payment marked as done!",
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      // Show error toast
      setToast({
        show: true,
        message: "Failed to update payment.",
        variant: "danger",
      });
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Filter pending payments based on search query
  const filteredPayments = pendingPayments.filter((payment) => {
    const query = searchQuery.toLowerCase();
    return (
      payment.vendorName.toLowerCase().includes(query) ||
      payment.productName.toLowerCase().includes(query)
    );
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // Generate pagination items
  const paginationItems = [];
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <Pagination.Item
        key={number}
        active={number === currentPage}
        onClick={() => setCurrentPage(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

  // Render loading state
  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Loading pending payments...</span>
      </Container>
    );
  }

  // Render error state
  if (fetchError) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{fetchError}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5 mb-5">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 text-center">Credit Cycle Management</h1>
          <p className="text-center text-muted">
            Monitor pending payments and manage credit cycles efficiently.
          </p>
        </Col>
      </Row>

      {/* Search Bar */}
      <Row className="mb-3">
        <Col md={{ span: 6, offset: 3 }}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search by Vendor or Product Name..."
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="Search Pending Payments"
            />
            <InputGroup.Text>
              <Search />
            </InputGroup.Text>
            {searchQuery && (
              <InputGroup.Text onClick={handleClearSearch} style={{ cursor: "pointer" }}>
                <X />
              </InputGroup.Text>
            )}
          </InputGroup>
        </Col>
      </Row>

      {/* Pending Payments Table */}
      {filteredPayments.length === 0 ? (
        <Alert variant={searchQuery ? "warning" : "success"} className="text-center">
          {searchQuery
            ? "No matching pending payments found."
            : "No pending payments at the moment. All payments are up to date!"}
        </Alert>
      ) : (
        <Table
          striped
          bordered
          hover
          responsive
          className="shadow-sm"
          style={{ backgroundColor: "#ffffff" }}
        >
          <thead className="table-primary">
            <tr>
              <th>#</th>
              <th>
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 250, hide: 400 }}
                  overlay={<Tooltip id="vendor-name-tooltip">Vendor Name</Tooltip>}
                >
                  <span>Vendor Name</span>
                </OverlayTrigger>
              </th>
              <th>
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 250, hide: 400 }}
                  overlay={<Tooltip id="product-name-tooltip">Product Name</Tooltip>}
                >
                  <span>Product Name</span>
                </OverlayTrigger>
              </th>
              <th>Quantity</th>
              <th>Added Date</th>
              <th>Credit Cycle (Days)</th>
              <th>Due Date</th>
              <th>Days Left</th>
              {/* New Column Header for Total Amount */}
              <th>Total Amount ($)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentPayments.map((payment, index) => (
              <tr key={`${payment.vendorId}-${payment.productId}-${payment.historyId}`}>
                <td>{indexOfFirstItem + index + 1}</td>
                <td>{payment.vendorName}</td>
                <td>{payment.productName}</td>
                <td>{payment.addedQuantity}</td>
                <td>{payment.addedDate}</td>
                <td>{payment.creditCycleDays}</td>
                <td>{payment.dueDate}</td>
                <td>
                  {payment.daysLeft > 0 ? (
                    <span className="text-success">
                      {payment.daysLeft} day(s)
                    </span>
                  ) : (
                    <span className="text-danger">Overdue</span>
                  )}
                </td>
                {/* New Column Data for Total Amount */}
                <td>₹{payment.totalAmount.toFixed(2)}</td>
                <td>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleMarkAsDone(payment)}
                    disabled={false}
                  >
                    <CheckCircleFill className="me-1" />
                    Done
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Row className="justify-content-center">
          <Pagination>
            <Pagination.Prev
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            />
            {paginationItems}
            <Pagination.Next
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </Row>
      )}

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          onClose={() => setToast({ ...toast, show: false })}
          show={toast.show}
          delay={3000}
          autohide
          bg={toast.variant}
        >
          <Toast.Header>
            {toast.variant === "success" ? (
              <CheckCircleFill className="me-2" />
            ) : (
              <XCircleFill className="me-2" />
            )}
            <strong className="me-auto">
              {toast.variant === "success" ? "Success" : "Error"}
            </strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default CreditCyclePage;
