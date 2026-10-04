import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://43.204.130.95:8081/api";

async function apiRequest(path, options = {}, token = "") {
  const headers = {
    ...(options.headers || {}),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  if (!response.ok) {
    let message = text || `Request failed: ${response.status}`;

    try {
      const errorJson = JSON.parse(text);
      message =
        errorJson.message ||
        errorJson.error ||
        `Request failed: ${response.status}`;
    } catch {
      // keep original text
    }

    throw new Error(message);
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("coffeeToken") || ""
  );

  useEffect(() => {
    if (token) {
      localStorage.setItem("coffeeToken", token);
    } else {
      localStorage.removeItem("coffeeToken");
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage token={token} />} />

        <Route
          path="/login"
          element={<LoginPage token={token} setToken={setToken} />}
        />

        <Route
          path="/coffees"
          element={<CoffeePage token={token} />}
        />

        <Route
          path="/orders"
          element={<OrdersPage token={token} />}
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute token={token}>
              <AdminDashboard token={token} setToken={setToken} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({ token, children }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function Header({ token, onLogout }) {
  return (
    <header className="top-nav">
      <Link to="/" className="brand-link">
        Bean & Brew
      </Link>

      <nav className="main-nav small-nav">
        <Link to="/">Home</Link>
        <Link to="/coffees">Coffee</Link>
        <Link to="/orders">Orders</Link>

        {token ? (
          <>
            <Link to="/admin">Admin</Link>

            {onLogout && (
              <button
                type="button"
                className="nav-button"
                onClick={onLogout}
              >
                Logout
              </button>
            )}
          </>
        ) : (
          <Link to="/login">Admin Login</Link>
        )}
      </nav>
    </header>
  );
}

function LandingPage({ token }) {
  return (
    <div className="landing-page">
      <Header token={token} />

      <main className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Fresh coffee. Simple ordering.</p>

          <h1>Welcome to Bean & Brew</h1>

          <p className="subtitle">
            Explore our coffee menu, place your order, and enjoy your
            favorite brew.
          </p>

          <div className="hero-actions">
            <Link to="/coffees" className="primary-btn">
              View Coffee
            </Link>

            <Link to="/orders" className="secondary-btn">
              Place Order
            </Link>
          </div>
        </div>

        <div className="hero-card glass-card">
          <h3>Bean & Brew</h3>

          <p>
            A simple Coffee Shop Management System built with React,
            Spring Boot and PostgreSQL.
          </p>

          <div className="stat-row">
            <span>Frontend</span>
            <strong>React</strong>
          </div>

          <div className="stat-row">
            <span>Backend</span>
            <strong>Spring Boot</strong>
          </div>

          <div className="stat-row">
            <span>Database</span>
            <strong>PostgreSQL</strong>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoginPage({ setToken, token }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "admin",
    password: "admin123",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      navigate("/admin");
    }
  }, [token, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (!result?.token) {
        throw new Error("Login succeeded but token was not returned");
      }

      setToken(result.token);

      navigate("/admin");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell auth-page">
      <Header token={token} />

      <div className="auth-card glass-card">
        <h2>Admin Login</h2>

        <p>Login to manage coffees and orders.</p>

        <form onSubmit={handleSubmit} className="stack-form">
          <input
            type="text"
            value={form.username}
            onChange={(event) =>
              setForm({
                ...form,
                username: event.target.value,
              })
            }
            placeholder="Username"
            required
          />

          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm({
                ...form,
                password: event.target.value,
              })
            }
            placeholder="Password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {message && <div className="info-box">{message}</div>}
      </div>
    </div>
  );
}

function CoffeePage({ token }) {
  const [coffees, setCoffees] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCoffees = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const result = await apiRequest("/coffees", {
        method: "GET",
      });

      setCoffees(result || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoffees();
  }, [loadCoffees]);

  return (
    <div className="page-shell">
      <Header token={token} />

      <section className="page-heading">
        <h1>Coffee Menu</h1>
        <p>Choose your favorite coffee.</p>
      </section>

      {loading && <div className="info-box">Loading coffees...</div>}

      {message && <div className="info-box">{message}</div>}

      <div className="coffee-grid">
        {coffees.map((coffee) => (
          <div className="coffee-card glass-card" key={coffee.id}>
            <div className="coffee-card-header">
              <h3>{coffee.name}</h3>

              <span
                className={
                  coffee.available
                    ? "status available"
                    : "status unavailable"
                }
              >
                {coffee.available ? "Available" : "Unavailable"}
              </span>
            </div>

            <p className="coffee-category">{coffee.category}</p>

            <p className="coffee-description">
              {coffee.description}
            </p>

            <div className="coffee-price">
              ${Number(coffee.price).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {!loading && coffees.length === 0 && (
        <div className="info-box">
          No coffees are currently available.
        </div>
      )}
    </div>
  );
}

function OrdersPage({ token }) {
  const [orders, setOrders] = useState([]);
  const [coffees, setCoffees] = useState([]);

  const [form, setForm] = useState({
    customerName: "",
    coffeeId: "",
    quantity: 1,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [orderData, coffeeData] = await Promise.all([
        apiRequest("/orders", {
          method: "GET",
        }),

        apiRequest("/coffees", {
          method: "GET",
        }),
      ]);

      setOrders(orderData || []);
      setCoffees(coffeeData || []);
    } catch (error) {
      setMessage(error.message);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrder = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: form.customerName,
          coffeeId: Number(form.coffeeId),
          quantity: Number(form.quantity),
        }),
      });

      setMessage("Order created successfully");

      setForm({
        customerName: "",
        coffeeId: "",
        quantity: 1,
      });

      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCoffeeName = (coffeeId) => {
    const coffee = coffees.find(
      (item) => Number(item.id) === Number(coffeeId)
    );

    return coffee ? coffee.name : `Coffee #${coffeeId}`;
  };

  return (
    <div className="page-shell">
      <Header token={token} />

      <section className="page-heading">
        <h1>Orders</h1>
        <p>Place a coffee order and check recent orders.</p>
      </section>

      <div className="two-column-layout">
        <section className="panel glass-card">
          <h2>Place Order</h2>

          <form
            className="stack-form"
            onSubmit={handleCreateOrder}
          >
            <input
              type="text"
              placeholder="Customer name"
              value={form.customerName}
              onChange={(event) =>
                setForm({
                  ...form,
                  customerName: event.target.value,
                })
              }
              required
            />

            <select
              value={form.coffeeId}
              onChange={(event) =>
                setForm({
                  ...form,
                  coffeeId: event.target.value,
                })
              }
              required
            >
              <option value="">Select coffee</option>

              {coffees
                .filter((coffee) => coffee.available)
                .map((coffee) => (
                  <option
                    key={coffee.id}
                    value={coffee.id}
                  >
                    {coffee.name} - $
                    {Number(coffee.price).toFixed(2)}
                  </option>
                ))}
            </select>

            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(event) =>
                setForm({
                  ...form,
                  quantity: event.target.value,
                })
              }
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Place Order"}
            </button>
          </form>
        </section>

        <section className="panel glass-card">
          <h2>Recent Orders</h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Coffee</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customerName}</td>

                    <td>
                      {getCoffeeName(order.coffeeId)}
                    </td>

                    <td>{order.quantity}</td>

                    <td>
                      $
                      {Number(
                        order.totalPrice || 0
                      ).toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={`order-status ${String(
                          order.status
                        ).toLowerCase()}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {message && <div className="info-box">{message}</div>}
    </div>
  );
}

function AdminDashboard({ token, setToken }) {
  const navigate = useNavigate();

  const [coffees, setCoffees] = useState([]);
  const [orders, setOrders] = useState([]);

  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [coffeeForm, setCoffeeForm] = useState({
    name: "",
    category: "CLASSIC",
    price: "",
    available: true,
    description: "",
  });

  const loadAdminData = useCallback(async () => {
    try {
      const [coffeeData, orderData] = await Promise.all([
        apiRequest("/coffees", { method: "GET" }),
        apiRequest("/orders", { method: "GET" }),
      ]);

      setCoffees(coffeeData || []);
      setOrders(orderData || []);
    } catch (error) {
      setMessage(error.message);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const resetCoffeeForm = () => {
    setCoffeeForm({
      name: "",
      category: "CLASSIC",
      price: "",
      available: true,
      description: "",
    });

    setEditingId(null);
  };

  const handleCoffeeSubmit = async (event) => {
    event.preventDefault();

    setMessage("");

    const payload = {
      ...coffeeForm,
      price: Number(coffeeForm.price),
    };

    try {
      if (editingId) {
        await apiRequest(
          `/coffees/${editingId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
          token
        );

        setMessage("Coffee updated successfully");
      } else {
        await apiRequest(
          "/coffees",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
          token
        );

        setMessage("Coffee created successfully");
      }

      resetCoffeeForm();

      await loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleEditCoffee = (coffee) => {
    setEditingId(coffee.id);

    setCoffeeForm({
      name: coffee.name,
      category: coffee.category,
      price: coffee.price,
      available: coffee.available,
      description: coffee.description,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteCoffee = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this coffee?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(
        `/coffees/${id}`,
        {
          method: "DELETE",
        },
        token
      );

      setMessage("Coffee deleted successfully");

      await loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await apiRequest(
        `/orders/${orderId}/status?status=${status}`,
        {
          method: "PUT",
        },
        token
      );

      setMessage(
        `Order ${orderId} updated to ${status}`
      );

      await loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("coffeeToken");
    navigate("/");
  };

  return (
    <div className="page-shell">
      <Header token={token} onLogout={handleLogout} />

      <section className="page-heading">
        <h1>Manager Portal</h1>
        <p>Manage coffee menu items and customer orders.</p>
      </section>

      {message && <div className="info-box">{message}</div>}

      <div className="dashboard-stats">
        <div className="stat-card glass-card">
          <span>Total Coffees</span>
          <strong>{coffees.length}</strong>
        </div>

        <div className="stat-card glass-card">
          <span>Available Coffees</span>

          <strong>
            {
              coffees.filter(
                (coffee) => coffee.available
              ).length
            }
          </strong>
        </div>

        <div className="stat-card glass-card">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
        </div>

        <div className="stat-card glass-card">
          <span>Pending Orders</span>

          <strong>
            {
              orders.filter(
                (order) =>
                  order.status !== "COMPLETED" &&
                  order.status !== "CANCELLED"
              ).length
            }
          </strong>
        </div>
      </div>

      <div className="two-column-layout">
        <section className="panel glass-card">
          <h2>
            {editingId
              ? "Edit Coffee"
              : "Add Coffee"}
          </h2>

          <form
            className="stack-form"
            onSubmit={handleCoffeeSubmit}
          >
            <input
              type="text"
              placeholder="Coffee name"
              value={coffeeForm.name}
              onChange={(event) =>
                setCoffeeForm({
                  ...coffeeForm,
                  name: event.target.value,
                })
              }
              required
            />

            <select
              value={coffeeForm.category}
              onChange={(event) =>
                setCoffeeForm({
                  ...coffeeForm,
                  category: event.target.value,
                })
              }
            >
              <option value="CLASSIC">CLASSIC</option>
              <option value="LATTE">LATTE</option>
              <option value="CAPPUCCINO">
                CAPPUCCINO
              </option>
              <option value="COLD_BREW">
                COLD_BREW
              </option>
              <option value="ESPRESSO">
                ESPRESSO
              </option>
            </select>

            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Price"
              value={coffeeForm.price}
              onChange={(event) =>
                setCoffeeForm({
                  ...coffeeForm,
                  price: event.target.value,
                })
              }
              required
            />

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={coffeeForm.available}
                onChange={(event) =>
                  setCoffeeForm({
                    ...coffeeForm,
                    available: event.target.checked,
                  })
                }
              />

              Available
            </label>

            <textarea
              rows="4"
              placeholder="Description"
              value={coffeeForm.description}
              onChange={(event) =>
                setCoffeeForm({
                  ...coffeeForm,
                  description: event.target.value,
                })
              }
              required
            />

            <div className="button-row">
              <button type="submit">
                {editingId
                  ? "Update Coffee"
                  : "Create Coffee"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetCoffeeForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="panel glass-card">
          <h2>Coffee Management</h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {coffees.map((coffee) => (
                  <tr key={coffee.id}>
                    <td>{coffee.id}</td>
                    <td>{coffee.name}</td>
                    <td>{coffee.category}</td>

                    <td>
                      $
                      {Number(
                        coffee.price
                      ).toFixed(2)}
                    </td>

                    <td>
                      {coffee.available
                        ? "Yes"
                        : "No"}
                    </td>

                    <td className="inline-actions">
                      <button
                        type="button"
                        className="small-btn"
                        onClick={() =>
                          handleEditCoffee(coffee)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="small-btn danger"
                        onClick={() =>
                          handleDeleteCoffee(
                            coffee.id
                          )
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel glass-card admin-orders">
        <h2>Order Management</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Coffee ID</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customerName}</td>
                  <td>{order.coffeeId}</td>
                  <td>{order.quantity}</td>

                  <td>
                    $
                    {Number(
                      order.totalPrice || 0
                    ).toFixed(2)}
                  </td>

                  <td>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        handleStatusUpdate(
                          order.id,
                          event.target.value
                        )
                      }
                    >
                      <option value="PLACED">
                        PLACED
                      </option>

                      <option value="PREPARING">
                        PREPARING
                      </option>

                      <option value="READY">
                        READY
                      </option>

                      <option value="COMPLETED">
                        COMPLETED
                      </option>

                      <option value="CANCELLED">
                        CANCELLED
                      </option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default App;