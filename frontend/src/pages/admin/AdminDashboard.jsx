import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

import {
  faBoxOpen,
  faCartShopping,
  faUsers,
  faIndianRupeeSign,
  faArrowTrendUp,
  faArrowTrendDown,
  faEllipsisVertical,
} from "@fortawesome/free-solid-svg-icons";

import BACKEND_URL from "../../config/api";
import AdminLayout from "../../components/admin/AdminLayout";

function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [salesMetric, setSalesMetric] = useState("revenue");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Please log in as an admin.");
        }

        const headers = {
          Authorization: token,
        };

        const [ordersResponse, productsResponse, usersResponse] =
          await Promise.all([
            fetch(`${BACKEND_URL}/orders/admin/all`, { headers }),
            fetch(`${BACKEND_URL}/products/admin/all?limit=1`, { headers }),
            fetch(`${BACKEND_URL}/users/admin/all?limit=1`, { headers }),
          ]);

        const [ordersData, productsData, usersData] = await Promise.all([
          ordersResponse.json(),
          productsResponse.json(),
          usersResponse.json(),
        ]);

        if (!ordersResponse.ok) {
          throw new Error(ordersData.message || "Failed to fetch orders.");
        }

        if (!productsResponse.ok) {
          throw new Error(productsData.message || "Failed to fetch products.");
        }

        if (!usersResponse.ok) {
          throw new Error(usersData.message || "Failed to fetch users.");
        }

        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
        setTotalProducts(
          productsData.stats?.total ?? productsData.totalProducts ?? 0,
        );
        setTotalUsers(usersData.pagination?.totalUsers ?? 0);
      } catch (err) {
        setError(err.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const formatOrderId = (id) =>
    id ? `#${String(id).slice(-8).toUpperCase()}` : "N/A";

  const formatStatus = (status = "pending") =>
    status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());

  const getStatusClass = (status = "") => {
    const normalized = status.toLowerCase();

    if (["delivered", "returned"].includes(normalized)) return "success";
    if (["cancelled", "return_rejected"].includes(normalized)) return "danger";
    if (["shipped", "confirmed"].includes(normalized)) return "primary";
    if (
      ["pending", "processing", "return_requested", "return_approved"].includes(
        normalized,
      )
    ) {
      return "warning";
    }

    return "secondary";
  };

  const stats = useMemo(() => {
    const revenue = orders.reduce((total, order) => {
      // Cancelled orders are excluded from revenue.
      if (
        ["cancelled", "return_rejected", "returned"].includes(order.orderStatus)
      ) {
        return total;
      }

      return total + (Number(order.totalAmount) || 0);
    }, 0);

    return [
      {
        title: "Total Revenue",
        value: formatCurrency(revenue),
        change: "Live data",
        icon: faIndianRupeeSign,
        type: "success",
      },
      {
        title: "Total Orders",
        value: orders.length.toLocaleString("en-IN"),
        change: "All orders",
        icon: faCartShopping,
        type: "primary",
      },
      {
        title: "Total Products",
        value: totalProducts.toLocaleString("en-IN"),
        change: "All products",
        icon: faBoxOpen,
        type: "warning",
      },
      {
        title: "Total Users",
        value: totalUsers.toLocaleString("en-IN"),
        change: "All users",
        icon: faUsers,
        type: "info",
      },
    ];
  }, [orders, totalProducts, totalUsers]);

  // Daily Sales Overview uses real orders from the existing API.
  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - index));

      return {
        date,
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        label: date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        revenue: 0,
        orders: 0,
        products: 0,
        profit: 0,
        profitMissingOrders: 0,
      };
    });

    const excludedStatuses = ["cancelled", "return_rejected", "returned"];

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      if (Number.isNaN(orderDate.getTime())) return;
      orderDate.setHours(0, 0, 0, 0);

      const key = `${orderDate.getFullYear()}-${orderDate.getMonth()}-${orderDate.getDate()}`;
      const bucket = buckets.find((item) => item.key === key);
      if (!bucket || excludedStatuses.includes(order.orderStatus)) return;

      bucket.orders += 1;
      bucket.revenue += Number(order.totalAmount) || 0;
      bucket.products += (order.items || []).reduce(
        (total, item) => total + (Number(item.quantity) || 0),
        0,
      );

      const items = Array.isArray(order.items) ? order.items : [];
      const hasCompleteCostSnapshots =
        items.length > 0 &&
        items.every(
          (item) =>
            item.costPriceSnapshot !== null &&
            item.costPriceSnapshot !== undefined &&
            Number.isFinite(Number(item.costPriceSnapshot)) &&
            Number(item.costPriceSnapshot) >= 0,
        );

      if (!hasCompleteCostSnapshots) {
        bucket.profitMissingOrders += 1;
        return;
      }

      const itemRevenue = items.reduce(
        (total, item) =>
          total + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0,
      );
      const costOfGoods = items.reduce(
        (total, item) =>
          total + Number(item.costPriceSnapshot) * (Number(item.quantity) || 0),
        0,
      );
      const couponDiscount = Number(order.couponDiscount) || 0;

      // Gross profit after product and coupon discounts, before operating expenses.
      bucket.profit += itemRevenue - costOfGoods - couponDiscount;
    });

    return buckets;
  }, [orders]);

  const metricConfig = {
    revenue: {
      label: "Revenue",
      color: "#0d6efd",
      format: (value) => formatCurrency(value),
    },
    orders: {
      label: "Orders",
      color: "#198754",
      format: (value) => Math.round(value).toLocaleString("en-IN"),
    },
    products: {
      label: "Products Sold",
      color: "#fd7e14",
      format: (value) => Math.round(value).toLocaleString("en-IN"),
    },
    profit: {
      label: "Gross Profit",
      color: "#6f42c1",
      format: (value) => formatCurrency(value),
    },
  };

  const activeMetric = metricConfig[salesMetric] || metricConfig.revenue;
  const chartValues = chartData.map((item) => item[salesMetric] || 0);
  const chartMaxValue = Math.max(...chartValues, 1);
  const chartAxisValues = [
    chartMaxValue,
    chartMaxValue * 0.75,
    chartMaxValue * 0.5,
    chartMaxValue * 0.25,
    0,
  ];
  const chartPoints = chartValues
    .map((value, index) => {
      const x = (index / (chartData.length - 1)) * 1000;
      const y = 12 + (1 - value / chartMaxValue) * 218;
      return `${x},${y}`;
    })
    .join(" ");

  const quickOverview = useMemo(() => {
    const now = new Date();

    const todaysOrders = orders.filter((order) => {
      const date = new Date(order.createdAt);

      return (
        !Number.isNaN(date.getTime()) &&
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });

    const productsSold = orders.reduce((total, order) => {
      if (
        ["cancelled", "return_rejected", "returned"].includes(order.orderStatus)
      ) {
        return total;
      }

      return (
        total +
        (order.items || []).reduce(
          (itemTotal, item) => itemTotal + (Number(item.quantity) || 0),
          0,
        )
      );
    }, 0);

    const refundRequests = orders.filter((order) =>
      ["return_requested", "return_approved"].includes(order.orderStatus),
    ).length;

    return [
      {
        title: "Today's Orders",
        value: todaysOrders.length,
        icon: faCartShopping,
        color: "text-primary",
      },
      {
        title: "New Customers",
        value: "—",
        icon: faUsers,
        color: "text-info",
      },
      {
        title: "Products Sold",
        value: productsSold,
        icon: faBoxOpen,
        color: "text-warning",
      },
      {
        title: "Refund Requests",
        value: refundRequests,
        icon: faArrowTrendDown,
        color: "text-danger",
      },
    ];
  }, [orders]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4),
    [orders],
  );

  const topProducts = useMemo(() => {
    const productSales = new Map();

    orders.forEach((order) => {
      if (
        ["cancelled", "return_rejected", "returned"].includes(order.orderStatus)
      ) {
        return;
      }

      (order.items || []).forEach((item) => {
        const productId = item.product?._id || item.product || item.name;

        if (!productId) return;

        const existing = productSales.get(String(productId)) || {
          name: item.name || item.product?.name || "Product",
          sold: 0,
          revenue: 0,
          image: item.image || item.product?.images?.[0] || "",
        };

        existing.sold += Number(item.quantity) || 0;
        existing.revenue +=
          (Number(item.price) || 0) * (Number(item.quantity) || 0);

        productSales.set(String(productId), existing);
      });
    });

    return [...productSales.values()]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 3);
  }, [orders]);

  return (
    <AdminLayout>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="row g-3 g-lg-4 mb-4">
        {stats.map((stat) => (
          <div className="col-12 col-sm-6 col-xl-3" key={stat.title}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div
                    className={`bg-${stat.type} bg-opacity-10 text-${stat.type} rounded-3 d-flex align-items-center justify-content-center`}
                    style={{ width: "45px", height: "45px" }}
                  >
                    <FontAwesomeIcon icon={stat.icon} />
                  </div>
                  <FontAwesomeIcon
                    icon={faEllipsisVertical}
                    className="text-muted"
                  />
                </div>

                <p className="text-muted mb-1">{stat.title}</p>
                <h3 className="fw-bold mb-2">{loading ? "—" : stat.value}</h3>

                <div className="small text-success">
                  <FontAwesomeIcon icon={faArrowTrendUp} className="me-1" />
                  <strong>{stat.change}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 g-lg-4 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-3 mb-4">
                <div>
                  <h5 className="fw-bold mb-1">Sales Overview</h5>
                  <p className="text-muted small mb-0">
                    Daily performance · Last 30 days
                  </p>
                </div>

                <select
                  className="form-select form-select-sm w-auto"
                  value={salesMetric}
                  onChange={(event) => setSalesMetric(event.target.value)}
                  aria-label="Select Sales Overview metric"
                >
                  <option value="revenue">Revenue (₹)</option>
                  <option value="orders">Total Orders</option>
                  <option value="products">Products Sold</option>
                  <option value="profit">Gross Profit (₹)</option>
                </select>
              </div>

              <div className="d-flex w-100">
                <div
                  className="d-flex flex-column justify-content-between text-secondary small flex-shrink-0 pe-2"
                  style={{
                    width: "clamp(48px, 12%, 72px)",
                    height: "clamp(210px, 34vw, 260px)",
                    fontSize: "clamp(9px, 1.2vw, 12px)",
                  }}
                >
                  {chartAxisValues.map((value, index) => (
                    <span key={index}>{activeMetric.format(value)}</span>
                  ))}
                </div>

                <div className="flex-grow-1 min-w-0">
                  <div
                    className="position-relative border-start border-bottom"
                    style={{ height: "clamp(210px, 34vw, 260px)" }}
                  >
                    <svg
                      viewBox="0 0 1000 250"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label={`${activeMetric.label} over the last 30 days`}
                      className="w-100 h-100 position-absolute top-0 start-0"
                    >
                      {[12, 66.5, 121, 175.5, 230].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={y}
                          x2="1000"
                          y2={y}
                          stroke="#e9ecef"
                          strokeWidth="1"
                          strokeDasharray="4 5"
                        />
                      ))}

                      <polyline
                        points={chartPoints}
                        fill="none"
                        stroke={activeMetric.color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />

                      {chartValues.map((value, index) => {
                        const x = (index / (chartValues.length - 1)) * 1000;
                        const y = 12 + (1 - value / chartMaxValue) * 218;

                        return (
                          <circle
                            key={`${chartData[index].key}-point`}
                            cx={x}
                            cy={y}
                            r="3.5"
                            fill={activeMetric.color}
                          >
                            <title>
                              {chartData[index].label}:{" "}
                              {activeMetric.format(value)}
                            </title>
                          </circle>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="d-flex justify-content-between text-secondary mt-2 small">
                    {chartData
                      .filter((_, index) => index % 5 === 0 || index === 29)
                      .map((item) => (
                        <span key={item.key} className="text-nowrap">
                          {item.label}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {salesMetric === "revenue" && (
                <p className="small text-muted mt-3 mb-0">
                  Revenue is summed from order totals. Cancelled,
                  rejected-return and returned orders are excluded.
                </p>
              )}
              {salesMetric === "orders" && (
                <p className="small text-muted mt-3 mb-0">
                  Counts non-cancelled orders by their creation date.
                </p>
              )}
              {salesMetric === "products" && (
                <p className="small text-muted mt-3 mb-0">
                  Counts item quantities in non-cancelled orders.
                </p>
              )}
              {salesMetric === "profit" && (
                <>
                  <p className="small text-muted mt-3 mb-0">
                    Gross profit = item selling totals − item cost snapshots −
                    coupon discounts. This excludes operating expenses and fees.
                  </p>
                  {chartData.reduce(
                    (total, item) => total + item.profitMissingOrders,
                    0,
                  ) > 0 && (
                    <div className="alert alert-warning py-2 px-3 mt-3 mb-0 small">
                      Some orders are excluded because their cost-price
                      snapshots are missing. Update product costs for new
                      orders; historical costs must be entered from reliable
                      records to calculate their profit.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="mb-4">
                <h5 className="fw-bold mb-1">Quick Overview</h5>
                <p className="text-muted small mb-0">Today's performance</p>
              </div>

              <div className="d-flex flex-column gap-3">
                {quickOverview.map((item) => (
                  <div
                    key={item.title}
                    className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3"
                  >
                    <div>
                      <span className="text-muted small d-block">
                        {item.title}
                      </span>
                      <strong className="fs-5">
                        {loading ? "—" : item.value}
                      </strong>
                    </div>
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`${item.color} fs-5`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 g-lg-4">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 p-3 p-lg-4">
                <div>
                  <h5 className="fw-bold mb-1">Recent Orders</h5>
                  <p className="text-muted small mb-0">
                    Latest customer orders
                  </p>
                </div>

                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => navigate("/admin/orders")}
                >
                  View All
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-3">Order</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {!loading && recentOrders.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          No orders found.
                        </td>
                      </tr>
                    )}

                    {recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-3">
                          <strong className="small">
                            {formatOrderId(order._id)}
                          </strong>
                        </td>

                        <td className="small">
                          {order.user?.username || "Customer"}
                        </td>

                        <td className="small">
                          {order.items?.[0]?.name || "—"}
                          {order.items?.length > 1 &&
                            ` +${order.items.length - 1} more`}
                        </td>

                        <td>
                          <strong className="small">
                            {formatCurrency(order.totalAmount)}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`badge bg-${getStatusClass(order.orderStatus)}-subtle text-${getStatusClass(order.orderStatus)}`}
                          >
                            {formatStatus(order.orderStatus)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="mb-4">
                <h5 className="fw-bold mb-1">Top Products</h5>
                <p className="text-muted small mb-0">Best selling products</p>
              </div>

              <div className="d-flex flex-column gap-3">
                {!loading && topProducts.length === 0 && (
                  <p className="text-muted small mb-0">
                    No product sales found yet.
                  </p>
                )}

                {topProducts.map((product, index) => (
                  <div
                    className="d-flex align-items-center gap-2"
                    key={product.name}
                  >
                    <span className="badge bg-light text-dark border">
                      {index + 1}
                    </span>

                    <img
                      src={
                        product.image ||
                        "https://placehold.co/100x100?text=Product"
                      }
                      alt={product.name}
                      className="rounded-3 object-fit-cover"
                      style={{ width: "55px", height: "55px" }}
                    />

                    <div className="flex-grow-1">
                      <h6 className="mb-1">{product.name}</h6>
                      <small className="text-muted">
                        {product.sold.toLocaleString("en-IN")} sold
                      </small>
                    </div>

                    <strong className="small">
                      {formatCurrency(product.revenue)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
