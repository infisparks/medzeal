"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, push, set, get } from "firebase/database";
import { useRouter } from "next/navigation";
import { app } from '@/lib/firebaseConfig';
import Header from "@/components/Header/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import Popup from "@/components/Popup";

export default function ProductSell() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getDatabase(app);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sale, setSale] = useState({
    buyerName: "",
    buyerPhone: "",
    products: [{ product: "", customProductName: "", price: "", quantity: "" }],
    saleDate: getCurrentDate(),
    saleTime: getCurrentTime(),
  });
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // Utility function to get current date in YYYY-MM-DD format
  function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Utility function to get current time in HH:MM format
  function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setIsLoggedIn(true);
        fetchProducts();
        fetchSales();
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  const fetchProducts = async () => {
    try {
      const productsRef = ref(db, 'products');
      const snapshot = await get(productsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setProducts(productList);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchSales = async () => {
    try {
      const salesRef = ref(db, 'productsell');
      const snapshot = await get(salesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const today = getCurrentDate();
        const salesList = Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .filter(sale => sale.saleDate === today);
        setSales(salesList);
      } else {
        setSales([]);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  };

  const handleBuyerChange = (e) => {
    const { name, value } = e.target;
    setSale((prevSale) => ({
      ...prevSale,
      [name]: value,
    }));
  };

  const handleProductChange = (index, e) => {
    const { name, value } = e.target;
    const newProducts = [...sale.products];
    newProducts[index][name] = value;

    if (name === "product") {
      if (value === "Other") {
        newProducts[index]["customProductName"] = "";
        newProducts[index]["price"] = "";
      } else {
        const selectedProduct = products.find((prod) => prod.name === value);
        if (selectedProduct) {
          newProducts[index]["price"] = selectedProduct.price.toFixed(2);
        }
      }
    }

    setSale((prevSale) => ({
      ...prevSale,
      products: newProducts,
    }));
  };

  const addProductField = () => {
    setSale((prevSale) => ({
      ...prevSale,
      products: [
        ...prevSale.products,
        { product: "", customProductName: "", price: "", quantity: "" },
      ],
    }));
  };

  const removeProductField = (index) => {
    const newProducts = [...sale.products];
    newProducts.splice(index, 1);
    setSale((prevSale) => ({
      ...prevSale,
      products: newProducts,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      sale.buyerName.trim() === "" ||
      sale.buyerPhone.trim() === "" ||
      sale.products.some(
        (p) =>
          (p.product === "" && p.customProductName.trim() === "") ||
          p.quantity.trim() === "" ||
          p.price.trim() === ""
      )
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const saleData = {
        buyerName: sale.buyerName,
        buyerPhone: sale.buyerPhone,
        products: sale.products.map((p) => ({
          product: p.product === "Other" ? p.customProductName : p.product,
          price: parseFloat(p.price),
          quantity: parseInt(p.quantity),
          totalPrice: parseFloat(p.price) * parseInt(p.quantity),
        })),
        saleDate: sale.saleDate,
        saleTime: sale.saleTime,
        createdAt: new Date().toISOString(),
      };
      const totalPrice = saleData.products.reduce(
        (acc, curr) => acc + curr.totalPrice,
        0
      );
      saleData.totalPrice = totalPrice;

      const productsellRef = ref(db, 'productsell');
      const newSaleRef = push(productsellRef);
      await set(newSaleRef, saleData);

      setPopupMessage(`Sale added successfully.`);
      setShowPopup(true);
      setInvoiceData(saleData);
      setShowInvoice(true);
      setSale({
        buyerName: "",
        buyerPhone: "",
        products: [{ product: "", customProductName: "", price: "", quantity: "" }],
        saleDate: getCurrentDate(),
        saleTime: getCurrentTime(),
      });
      fetchSales();
    } catch (error) {
      console.error("Error adding sale:", error);
      alert("Failed to add sale. Please try again.");
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <>
      <Header />
      <Breadcrumbs title="Manage Product Sales" menuText="Product Sales" />

      <section className="manage-productsell single-page">
        <div className="container">
          <div className="row justify-content-center">
            {/* Add Sale Form */}
            <div className="col-lg-8 col-md-10 col-12">
              <div className="card shadow-sm p-4 mb-4">
                <div className="card-body">
                  <h3 className="card-title text-center mb-4">Add a New Sale</h3>
                  <p className="text-center mb-4">Enter the sale details to add it to the database.</p>

                  <form className="form" onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="buyerName" className="form-label">Buyer Name</label>
                      <input
                        id="buyerName"
                        name="buyerName"
                        type="text"
                        className="form-control"
                        placeholder="Enter buyer name"
                        value={sale.buyerName}
                        onChange={handleBuyerChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="buyerPhone" className="form-label">Buyer Phone</label>
                      <input
                        id="buyerPhone"
                        name="buyerPhone"
                        type="text"
                        className="form-control"
                        placeholder="Enter buyer phone number"
                        value={sale.buyerPhone}
                        onChange={handleBuyerChange}
                        required
                      />
                    </div>

                    {sale.products.map((p, index) => (
                      <div key={index} className="product-item mb-4">
                        <h5>Product {index + 1}</h5>
                        <div className="mb-3">
                          <label htmlFor={`product-${index}`} className="form-label">Product</label>
                          <select
                            id={`product-${index}`}
                            name="product"
                            className="form-select"
                            value={p.product}
                            onChange={(e) => handleProductChange(index, e)}
                            required
                          >
                            <option value="">Select Product</option>
                            {products.map((prod) => (
                              <option key={prod.id} value={prod.name}>
                                {prod.name}
                              </option>
                            ))}
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {p.product === "Other" && (
                          <div className="mb-3">
                            <label htmlFor={`customProductName-${index}`} className="form-label">Custom Product Name</label>
                            <input
                              id={`customProductName-${index}`}
                              name="customProductName"
                              type="text"
                              className="form-control"
                              placeholder="Enter product name"
                              value={p.customProductName}
                              onChange={(e) => handleProductChange(index, e)}
                              required
                            />
                          </div>
                        )}

                        <div className="mb-3">
                          <label htmlFor={`price-${index}`} className="form-label">Price</label>
                          <input
                            id={`price-${index}`}
                            name="price"
                            type="number"
                            className="form-control"
                            step="0.01"
                            placeholder="Enter price"
                            value={p.price}
                            onChange={(e) => handleProductChange(index, e)}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label htmlFor={`quantity-${index}`} className="form-label">Quantity</label>
                          <input
                            id={`quantity-${index}`}
                            name="quantity"
                            type="number"
                            className="form-control"
                            placeholder="Enter quantity"
                            value={p.quantity}
                            onChange={(e) => handleProductChange(index, e)}
                            min="1"
                            required
                          />
                        </div>

                        {sale.products.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger mb-3"
                            onClick={() => removeProductField(index)}
                          >
                            Remove Product
                          </button>
                        )}
                        <hr />
                      </div>
                    ))}

                    <button
                      type="button"
                      className="btn btn-secondary mb-4"
                      onClick={addProductField}
                    >
                      Add Another Product
                    </button>

                    <div className="mb-3">
                      <label htmlFor="saleDate" className="form-label">Sale Date</label>
                      <input
                        id="saleDate"
                        name="saleDate"
                        type="date"
                        className="form-control"
                        value={sale.saleDate}
                        onChange={(e) => setSale({ ...sale, saleDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="saleTime" className="form-label">Sale Time</label>
                      <input
                        id="saleTime"
                        name="saleTime"
                        type="time"
                        className="form-control"
                        value={sale.saleTime}
                        onChange={(e) => setSale({ ...sale, saleTime: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-4 text-center">
                      <button type="submit" className="btn btn-primary w-100">
                        Add Sale
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Sales List */}
              <div className="card shadow-sm p-4">
                <div className="card-body">
                  <h3 className="card-title text-center mb-4">Today Sales</h3>
                  {sales.length === 0 ? (
                    <p className="text-center">No sales available for today.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Buyer Name</th>
                            <th>Phone</th>
                            <th>Products</th>
                            <th>Total Price</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sales.map((s, index) => (
                            <tr key={s.id}>
                              <td>{index + 1}</td>
                              <td>{s.buyerName}</td>
                              <td>{s.buyerPhone}</td>
                              <td>
                                {s.products.map((p, idx) => (
                                  <div key={idx}>
                                    {p.product} - Qty: {p.quantity}, Price: {p.totalPrice.toFixed(2)}
                                  </div>
                                ))}
                              </td>
                              <td>{s.totalPrice.toFixed(2)}</td>
                              <td>{s.saleDate}</td>
                              <td>{s.saleTime}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    setInvoiceData(s);
                                    setShowInvoice(true);
                                  }}
                                >
                                  Print Invoice
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Modal */}
              {showInvoice && invoiceData && (
                <div className="modal show d-block invoice-modal" tabIndex="-1">
                  <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Invoice</h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setShowInvoice(false)}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <div id="invoice">
                          <div className="invoice-header text-center mb-4">
                            <h2>Company Name</h2>
                            <p>Company Address</p>
                            <p>Contact: 1234567890 | Email: info@company.com</p>
                            <hr />
                          </div>
                          <div className="row mb-4">
                            <div className="col-6">
                              <p><strong>Buyer Name:</strong> {invoiceData.buyerName}</p>
                              <p><strong>Buyer Phone:</strong> {invoiceData.buyerPhone}</p>
                            </div>
                            <div className="col-6 text-end">
                              <p><strong>Date:</strong> {invoiceData.saleDate}</p>
                              <p><strong>Time:</strong> {invoiceData.saleTime}</p>
                            </div>
                          </div>
                          <table className="table table-bordered">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price per Unit</th>
                                <th>Total Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoiceData.products.map((p, idx) => (
                                <tr key={idx}>
                                  <td>{idx + 1}</td>
                                  <td>{p.product}</td>
                                  <td>{p.quantity}</td>
                                  <td>{p.price.toFixed(2)}</td>
                                  <td>{p.totalPrice.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <h4 className="text-end">Grand Total: {invoiceData.totalPrice.toFixed(2)}</h4>
                          <div className="invoice-footer text-center mt-5">
                            <p>Thank you for your purchase!</p>
                            <p>Visit Again</p>
                          </div>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setShowInvoice(false)}
                        >
                          Close
                        </button>
                        <button type="button" className="btn btn-primary" onClick={printInvoice}>
                          Print Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {showPopup && (
        <Popup message={popupMessage} onClose={closePopup} />
      )}

      {/* Add Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-modal, .invoice-modal * {
            visibility: visible;
          }
          .invoice-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
