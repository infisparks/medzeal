"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, push, set, remove, update, get } from "firebase/database";
import { useRouter } from "next/navigation";
import { app } from '@/lib/firebaseConfig';
import Header from "@/components/Header/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import Popup from "@/components/Popup";

export default function ManageProducts() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getDatabase(app);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [product, setProduct] = useState({
    name: "",
    price: "",
  });
  const [products, setProducts] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [editProduct, setEditProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setIsLoggedIn(true);
        fetchProducts();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (product.name.trim() === "" || product.price.trim() === "") {
      alert("Please enter both product name and price.");
      return;
    }

    try {
      const productsRef = ref(db, 'products');
      const newProductRef = push(productsRef);
      await set(newProductRef, {
        name: product.name,
        price: parseFloat(product.price),
        createdAt: new Date().toISOString(),
      });
      setPopupMessage(`Product "${product.name}" added successfully.`);
      setShowPopup(true);
      setProduct({ name: "", price: "" });
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const productRef = ref(db, `products/${id}`);
        await remove(productRef);
        setPopupMessage("Product deleted successfully.");
        setShowPopup(true);
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setEditName(product.name);
    setEditPrice(product.price);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (editName.trim() === "" || editPrice === "") {
      alert("Please enter both product name and price.");
      return;
    }

    try {
      const productRef = ref(db, `products/${editProduct.id}`);
      await update(productRef, {
        name: editName,
        price: parseFloat(editPrice),
      });
      setPopupMessage(`Product "${editName}" updated successfully.`);
      setShowPopup(true);
      setEditProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product. Please try again.");
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      <Header />
      <Breadcrumbs title="Manage Products" menuText="Products" />

      <section className="manage-products single-page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10 col-12">
              <div className="card shadow-sm p-4 mb-4">
                <div className="card-body">
                  <h3 className="card-title text-center mb-4">Add a New Product</h3>
                  <p className="text-center mb-4">Enter the product name and price to add it to the database.</p>

                  <form className="form" onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Product Name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        className="form-control"
                        placeholder="Enter product name"
                        value={product.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="price" className="form-label">Price </label>
                      <input
                        id="price"
                        name="price"
                        type="number"
                        className="form-control"
                        step="0.01"
                        placeholder="Enter product price"
                        value={product.price}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-4 text-center">
                      <button type="submit" className="btn btn-primary w-100">
                        Add Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card shadow-sm p-4">
                <div className="card-body">
                  <h3 className="card-title text-center mb-4">Product List</h3>
                  {products.length === 0 ? (
                    <p className="text-center">No products available.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Product Name</th>
                            <th>Price </th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((prod, index) => (
                            <tr key={prod.id}>
                              <td>{index + 1}</td>
                              <td>{prod.name}</td>
                              <td>{prod.price.toFixed(2)}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-warning me-2"
                                  onClick={() => handleEdit(prod)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(prod.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Edit Product Form */}
                  {editProduct && (
                    <div className="mt-5">
                      <h4>Edit Product</h4>
                      <form onSubmit={handleUpdate}>
                        <div className="mb-3">
                          <label htmlFor="editName" className="form-label">Product Name</label>
                          <input
                            id="editName"
                            type="text"
                            className="form-control"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="editPrice" className="form-label">Price</label>
                          <input
                            id="editPrice"
                            type="number"
                            className="form-control"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            required
                          />
                        </div>
                        <button type="submit" className="btn btn-primary">Update Product</button>
                        <button
                          type="button"
                          className="btn btn-secondary ms-2"
                          onClick={() => setEditProduct(null)}
                        >
                          Cancel
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showPopup && (
        <Popup message={popupMessage} onClose={closePopup} />
      )}
    </>
  );
}
