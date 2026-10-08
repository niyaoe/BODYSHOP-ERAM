import { useEffect, useState } from "react";
import { getDashboard } from "../services/dashboardService";
import "./Dashboard.css";
import FormModal from "../components/FormModal";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [activeSection, setActiveSection] = useState("open");

  const [dashboardData, setDashboardData] = useState(null);
  const [branches, setBranches] = useState([]);

  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const handleCreateRecord = () => {
    setEditingRecord(null);
    setShowFormModal(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setShowFormModal(true);
  };

  const handleModalSuccess = () => {
    fetchDashboard(activeSection, page);
  };
  /*
   * Fetch dashboard
   */
  const fetchDashboard = async (
    section = activeSection,
    currentPage = page,
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = {
        section,
        page: currentPage,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (branch) {
        params.branch = branch;
      }

      if (fromDate) {
        params.fromDate = fromDate;
      }

      if (toDate) {
        params.toDate = toDate;
      }

      const data = await getDashboard(params);

      setDashboardData(data);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Load dashboard when section/page changes
   */
  useEffect(() => {
    fetchDashboard(activeSection, page);
  }, [activeSection, page]);

  /*
   * Load branches for admin
   */
  useEffect(() => {
    const loadBranches = async () => {
      if (user?.role !== "admin") {
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/branches", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();

        setBranches(data.branches || data || []);
      } catch (error) {
        console.error("Failed to load branches:", error);
      }
    };

    loadBranches();
  }, [user?.role]);

  /*
   * Change section
   */
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setPage(1);
  };

  /*
   * Apply filters
   */
  const handleApplyFilters = () => {
    setPage(1);

    fetchDashboard(activeSection, 1);
  };

  /*
   * Clear filters
   */
  const handleClearFilters = () => {
    setSearch("");
    setBranch("");
    setFromDate("");
    setToDate("");
    setPage(1);

    fetchDashboard(activeSection, 1);
  };

  /*
   * Logout
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/";
  };

  /*
   * Pagination
   */
  const totalPages = dashboardData?.pagination?.totalPages || 1;

  const totalRecords = dashboardData?.pagination?.totalRecords || 0;

  const currentPage = dashboardData?.pagination?.page || page;

  return (
    <div className="bs-dashboard-page">
      {/* ================= HEADER ================= */}

      <header className="bs-dashboard-header">
        <div>
          <h1 className="bs-dashboard-title">Body Shop Tracker</h1>

          <p className="bs-dashboard-subtitle">Dashboard</p>
        </div>

        <div className="bs-dashboard-user-area">
          <div className="bs-dashboard-user-info">
            <span className="bs-dashboard-user-name">{user?.name}</span>

            <span className="bs-dashboard-user-role">{user?.role}</span>
          </div>

          <button className="bs-dashboard-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* ================= TABS ================= */}

      <div className="bs-dashboard-tabs">
        <button
          className={`bs-dashboard-tab ${
            activeSection === "legalLoss" ? "bs-dashboard-tab-active" : ""
          }`}
          onClick={() => handleSectionChange("legalLoss")}
        >
          Legal / Loss
        </button>

        <button
          className={`bs-dashboard-tab ${
            activeSection === "billed" ? "bs-dashboard-tab-active" : ""
          }`}
          onClick={() => handleSectionChange("billed")}
        >
          Billed
        </button>

        <button
          className={`bs-dashboard-tab ${
            activeSection === "open" ? "bs-dashboard-tab-active" : ""
          }`}
          onClick={() => handleSectionChange("open")}
        >
          Open
        </button>
      </div>

      {/* ================= CONTENT ================= */}

      <main className="bs-dashboard-content">
        {/* ================= FILTERS ================= */}

        <section className="bs-dashboard-filters">
          <div className="bs-dashboard-filter-field bs-dashboard-search-field">
            <label className="bs-dashboard-filter-label">Search</label>

            <input
              type="text"
              className="bs-dashboard-filter-input"
              placeholder="RO number, customer, registration..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApplyFilters();
                }
              }}
            />
          </div>

          {/* Admin branch filter */}

          {user?.role === "admin" && (
            <div className="bs-dashboard-filter-field">
              <label className="bs-dashboard-filter-label">Branch</label>

              <select
                className="bs-dashboard-filter-input"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="">All Branches</option>

                {branches.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* From date */}

          <div className="bs-dashboard-filter-field">
            <label className="bs-dashboard-filter-label">From Date</label>

            <input
              type="date"
              className="bs-dashboard-filter-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* To date */}

          <div className="bs-dashboard-filter-field">
            <label className="bs-dashboard-filter-label">To Date</label>

            <input
              type="date"
              className="bs-dashboard-filter-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {/* Buttons */}

          <div className="bs-dashboard-filter-actions">
            <button
              className="bs-dashboard-apply-button"
              onClick={handleApplyFilters}
            >
              Apply
            </button>

            <button
              className="bs-dashboard-clear-button"
              onClick={handleClearFilters}
            >
              Clear
            </button>
          </div>
        </section>

        {/* ================= LOADING ================= */}

        {loading && (
          <div className="bs-dashboard-loading">Loading records...</div>
        )}

        {/* ================= ERROR ================= */}

        {error && <div className="bs-dashboard-error">{error}</div>}

        {/* ================= DATA ================= */}

        {!loading && !error && dashboardData && (
          <>
            {/* ================= SUMMARY ================= */}

            <section className="bs-dashboard-summary">
              <div className="bs-dashboard-card">
                <span className="bs-dashboard-card-label">Total Records</span>

                <strong className="bs-dashboard-card-value">
                  {dashboardData.summary?.totalRecords || 0}
                </strong>
              </div>

              <div className="bs-dashboard-card">
                <span className="bs-dashboard-card-label">Labour Estimate</span>

                <strong className="bs-dashboard-card-value">
                  ₹{dashboardData.summary?.totalLabourEstimate || 0}
                </strong>
              </div>

              <div className="bs-dashboard-card">
                <span className="bs-dashboard-card-label">Parts Estimate</span>

                <strong className="bs-dashboard-card-value">
                  ₹{dashboardData.summary?.totalPartsEstimate || 0}
                </strong>
              </div>

              <div className="bs-dashboard-card">
                <span className="bs-dashboard-card-label">Labour Bill</span>

                <strong className="bs-dashboard-card-value">
                  ₹{dashboardData.summary?.totalLabourBill || 0}
                </strong>
              </div>

              <div className="bs-dashboard-card">
                <span className="bs-dashboard-card-label">Parts Bill</span>

                <strong className="bs-dashboard-card-value">
                  ₹{dashboardData.summary?.totalPartsBill || 0}
                </strong>
              </div>
            </section>

            {/* ================= RECORDS ================= */}

            <section className="bs-dashboard-records">
              <div className="bs-dashboard-records-header">
                <div>
                  <h2>Records</h2>

                  <span>{totalRecords} records</span>
                </div>
                <button
                  className="bs-dashboard-create-button"
                  onClick={handleCreateRecord}
                >
                  + Create Record
                </button>
              </div>

              <div className="bs-dashboard-table-wrapper">
                <table className="bs-dashboard-table">
                  <thead>
                    <tr>
                      <th>Sl No</th>
                      <th>RO Number</th>
                      <th>Customer</th>
                      <th>Registration</th>
                      <th>Model</th>
                      <th>Branch</th>
                      <th>Status</th>
                      <th>RO Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboardData.records?.length > 0 ? (
                      dashboardData.records.map((record) => (
                        <tr key={record._id}>
                          <td>{record.slNo}</td>

                          <td>{record.roNumber}</td>

                          <td>{record.customerName}</td>

                          <td>{record.regNo}</td>

                          <td>{record.model}</td>

                          <td>{record.branch?.name || "-"}</td>

                          <td>{record.presentStatus?.name || "-"}</td>

                          <td>
                            {record.roDate
                              ? new Date(record.roDate).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>
                            <button
                              className="bs-dashboard-edit-button"
                              onClick={() => handleEditRecord(record)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="bs-dashboard-empty">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ================= PAGINATION ================= */}

              <div className="bs-dashboard-pagination">
                <button
                  className="bs-dashboard-page-button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  ← Previous
                </button>

                <span className="bs-dashboard-page-number">
                  Page {currentPage} / {totalPages}
                </span>

                <button
                  className="bs-dashboard-page-button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next →
                </button>
              </div>
            </section>
          </>
        )}
      </main>
      <FormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        editRecord={editingRecord}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

export default Dashboard;
