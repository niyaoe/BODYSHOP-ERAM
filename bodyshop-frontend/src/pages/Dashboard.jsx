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

  // UI-only state: does not change dashboard data or API behavior.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [summaryVisible, setSummaryVisible] = useState(true);

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

  const fetchDashboard = async (
    section = activeSection,
    currentPage = page,
  ) => {
    try {
      setLoading(true);
      setError("");
      const params = { section, page: currentPage, limit };

      if (search.trim()) params.search = search.trim();
      if (branch) params.branch = branch;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

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

  useEffect(() => {
    fetchDashboard(activeSection, page);
  }, [activeSection, page]);

  useEffect(() => {
    const loadBranches = async () => {
      if (user?.role !== "admin") return;
      try {
        const response = await fetch("http://localhost:5000/api/branches", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await response.json();
        setBranches(data.branches || data || []);
      } catch (error) {
        console.error("Failed to load branches:", error);
      }
    };
    loadBranches();
  }, [user?.role]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setPage(1);
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchDashboard(activeSection, 1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setBranch("");
    setFromDate("");
    setToDate("");
    setPage(1);
    fetchDashboard(activeSection, 1);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const totalPages = dashboardData?.pagination?.totalPages || 1;
  const totalRecords = dashboardData?.pagination?.totalRecords || 0;
  const currentPage = dashboardData?.pagination?.page || page;

  const sections = [
    { id: "open", label: "Open", icon: "◷" },
    { id: "billed", label: "Billed", icon: "✓" },
    { id: "legalLoss", label: "Legal / Loss", icon: "⚖" },
  ];

  return (
    <div
      className={`bs-dashboard-page ${sidebarCollapsed ? "bs-sidebar-collapsed" : ""}`}
    >
      <div className="bs-dashboard-workspace">
        <aside
          className={`bs-dashboard-sidebar ${sidebarCollapsed ? "is-collapsed" : ""}`}
        >
          <div className="bs-dashboard-brand">
            <div className="bs-dashboard-brand-mark">BS</div>
            {!sidebarCollapsed && (
              <div className="bs-dashboard-brand-copy">
                <h1 className="bs-dashboard-title">Body Shop Tracker</h1>
                <p className="bs-dashboard-subtitle">Dashboard</p>
              </div>
            )}
          </div>

          <button
            type="button"
            className="bs-dashboard-sidebar-toggle"
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span>{sidebarCollapsed ? "»" : "«"}</span>
            {!sidebarCollapsed && (
              <span className="bs-dashboard-sidebar-toggle-label">
                Navigation
              </span>
            )}
          </button>

          <div className="bs-dashboard-nav-label">
            {!sidebarCollapsed && "WORKSPACE"}
          </div>
          <nav className="bs-dashboard-tabs" aria-label="Dashboard sections">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                title={sidebarCollapsed ? section.label : undefined}
                aria-label={section.label}
                className={`bs-dashboard-tab ${activeSection === section.id ? "bs-dashboard-tab-active" : ""}`}
                onClick={() => handleSectionChange(section.id)}
              >
                <span className="bs-dashboard-tab-icon" aria-hidden="true">
                  {section.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className="bs-dashboard-tab-label">
                    {section.label}
                  </span>
                )}
                {!sidebarCollapsed && activeSection === section.id && (
                  <span className="bs-dashboard-tab-indicator" />
                )}
              </button>
            ))}
          </nav>

          <div className="bs-dashboard-sidebar-user">
            <div className="bs-dashboard-user-avatar" aria-hidden="true">
              {(user?.name || "U").trim().charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="bs-dashboard-sidebar-user-copy">
                <span className="bs-dashboard-user-name">{user?.name}</span>
                <span className="bs-dashboard-user-role">{user?.role}</span>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                className="bs-dashboard-logout"
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
              >
                ↪
              </button>
            )}
          </div>
        </aside>

        <main className="bs-dashboard-content">
          <div className="bs-dashboard-toolbar">
            <div className="bs-dashboard-toolbar-title">
              <span className="bs-dashboard-eyebrow">RECORD MANAGEMENT</span>
              <h2>
                {
                  sections.find((section) => section.id === activeSection)
                    ?.label
                }{" "}
                Records
              </h2>
              <span className="bs-dashboard-record-count">
                {totalRecords.toLocaleString()} records
              </span>
            </div>
            <div className="bs-dashboard-toolbar-actions">
              <button
                type="button"
                className={`bs-dashboard-utility-button ${filtersVisible ? "is-active" : ""}`}
                onClick={() => setFiltersVisible((value) => !value)}
                aria-expanded={filtersVisible}
              >
                <span aria-hidden="true">☷</span> Filters{" "}
                <span className="bs-dashboard-chevron">
                  {filtersVisible ? "−" : "+"}
                </span>
              </button>
              <button
                type="button"
                className={`bs-dashboard-utility-button ${summaryVisible ? "is-active" : ""}`}
                onClick={() => setSummaryVisible((value) => !value)}
                aria-expanded={summaryVisible}
              >
                <span aria-hidden="true">▦</span> Summary{" "}
                <span className="bs-dashboard-chevron">
                  {summaryVisible ? "−" : "+"}
                </span>
              </button>
              <button
                className="bs-dashboard-create-button"
                onClick={handleCreateRecord}
              >
                <span aria-hidden="true">＋</span> Create Record
              </button>
            </div>
          </div>

          <section
            className={`bs-dashboard-collapsible ${filtersVisible ? "is-open" : ""}`}
            aria-hidden={!filtersVisible}
          >
            <div className="bs-dashboard-collapsible-inner">
              <section className="bs-dashboard-filters">
                <div className="bs-dashboard-filter-field bs-dashboard-search-field">
                  <label className="bs-dashboard-filter-label">
                    Search records
                  </label>
                  <input
                    type="text"
                    className="bs-dashboard-filter-input"
                    placeholder="RO number, customer, registration..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyFilters();
                    }}
                  />
                </div>

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

                <div className="bs-dashboard-filter-field">
                  <label className="bs-dashboard-filter-label">From Date</label>
                  <input
                    type="date"
                    className="bs-dashboard-filter-input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="bs-dashboard-filter-field">
                  <label className="bs-dashboard-filter-label">To Date</label>
                  <input
                    type="date"
                    className="bs-dashboard-filter-input"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="bs-dashboard-filter-actions">
                  <button
                    className="bs-dashboard-apply-button"
                    onClick={handleApplyFilters}
                  >
                    Apply filters
                  </button>
                  <button
                    className="bs-dashboard-clear-button"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </button>
                </div>
              </section>
            </div>
          </section>

          {!loading && !error && dashboardData && (
            <section
              className={`bs-dashboard-collapsible bs-dashboard-summary-collapse ${summaryVisible ? "is-open" : ""}`}
              aria-hidden={!summaryVisible}
            >
              <div className="bs-dashboard-collapsible-inner">
                <section className="bs-dashboard-summary">
                  <div className="bs-dashboard-card">
                    <span className="bs-dashboard-card-label">
                      Total Records
                    </span>
                    <strong className="bs-dashboard-card-value">
                      {dashboardData.summary?.totalRecords || 0}
                    </strong>
                  </div>
                  <div className="bs-dashboard-card">
                    <span className="bs-dashboard-card-label">
                      Labour Estimate
                    </span>
                    <strong className="bs-dashboard-card-value">
                      ₹{dashboardData.summary?.totalLabourEstimate || 0}
                    </strong>
                  </div>
                  <div className="bs-dashboard-card">
                    <span className="bs-dashboard-card-label">
                      Parts Estimate
                    </span>
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
              </div>
            </section>
          )}

          {loading && (
            <div className="bs-dashboard-loading">Loading records...</div>
          )}
          {error && <div className="bs-dashboard-error">{error}</div>}

          {!loading && !error && dashboardData && (
            <section className="bs-dashboard-records">
              <div className="bs-dashboard-table-wrapper">
                <table className="bs-dashboard-table">
                  <thead>
                    <tr>
                      <th>Sl No</th>
                      <th>RO</th>
                      <th>RO Date</th>
                      <th>Customer</th>
                      <th>Registration</th>
                      <th>Model</th>
                      <th>Branch</th>
                      <th>Contact No</th>
                      <th>Insurance Name</th>
                      <th>Insurance Status</th>
                      <th>Service Adviser</th>
                      <th>Job Type</th>
                      <th>Yard Entry Date</th>
                      <th>Next PMS Date</th>
                      <th>Promise Delivery Date</th>
                      <th>WhatsApp Date</th>
                      <th>RSA Eligibility</th>
                      <th>Shield Eligibility</th>
                      <th>Labour Estimate</th>
                      <th>Parts Bill Amount</th>
                      <th>Parts Estimate</th>
                      <th>Parts Bill Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.records?.length > 0 ? (
                      dashboardData.records.map((record) => (
                        <tr key={record._id}>
                          <td>{record.slNo}</td>
                          <td className="bs-dashboard-ro-cell">
                            {record.roNumber}
                          </td>
                          <td>
                            {record.roDate
                              ? new Date(record.roDate).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>{record.customerName}</td>
                          <td>{record.regNo}</td>
                          <td>{record.model}</td>
                          <td>{record.branch?.name || "-"}</td>
                          <td>{record.contactNo || "-"}</td>
                          <td>{record.insuranceName || "-"}</td>
                          <td>{record.insuranceStatus || "-"}</td>
                          <td>{record.serviceAdvisor || "-"}</td>
                          <td>{record.jobType || "-"}</td>
                          <td>
                            {record.yardEntryDate
                              ? new Date(
                                  record.yardEntryDate,
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>
                            {record.nextPmsDate
                              ? new Date(
                                  record.nextPmsDate,
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>
                            {record.promisedDeliveryDate
                              ? new Date(
                                  record.promisedDeliveryDate,
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>
                            {record.whatsappGroupCreationDate
                              ? new Date(
                                  record.whatsappGroupCreationDate,
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>{record.rsaEligibility || "-"}</td>
                          <td>{record.shieldEligibility || "-"}</td>
                          <td>{record.labourEstimate || "-"}</td>
                          <td>{record.partsBillAmount || "-"}</td>
                          <td>{record.partsEstimate || "-"}</td>
                          <td>{record.partsBillAmount || "-"}</td>
                          <td>
                            <span className="bs-dashboard-status-pill">
                              {record.presentStatus?.name || "-"}
                            </span>
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
                        <td colSpan="24" className="bs-dashboard-empty">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bs-dashboard-pagination">
                <span className="bs-dashboard-pagination-info">
                  Page <strong>{currentPage}</strong> of{" "}
                  <strong>{totalPages}</strong>
                </span>
                <div className="bs-dashboard-pagination-controls">
                  <button
                    className="bs-dashboard-page-button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    ← Previous
                  </button>
                  <button
                    className="bs-dashboard-page-button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

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
