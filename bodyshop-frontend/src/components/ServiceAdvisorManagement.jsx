
import { useEffect, useState } from "react";
import api from "../api/axios";
import "./ServiceAdvisorManagement.css";

const EMPTY_FORM = {
  name: "",
  sortOrder: 0,
};

function ServiceAdvisorManagement() {
  const [advisors, setAdvisors] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAdvisors = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/service-advisors");
      setAdvisors(response.data.serviceAdvisors || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load service advisers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = (advisor) => {
    setEditingId(advisor._id);
    setForm({
      name: advisor.name || "",
      sortOrder: advisor.sortOrder ?? 0,
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Service adviser name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingId) {
        await api.put(`/service-advisors/${editingId}`, payload);
        setSuccess("Service adviser updated successfully.");
      } else {
        await api.post("/service-advisors", payload);
        setSuccess("Service adviser created successfully.");
      }

      resetForm();
      await fetchAdvisors();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save service adviser."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (advisor) => {
    const confirmed = window.confirm(
      `Deactivate ${advisor.name}? Existing records will remain unchanged.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/service-advisors/${advisor._id}`);
      setSuccess(`${advisor.name} deactivated successfully.`);
      await fetchAdvisors();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to deactivate service adviser."
      );
    }
  };

  return (
    <div className="bs-advisor-management">
      <div className="bs-advisor-heading">
        <div>
          <h3>Service Adviser Management</h3>
          <p>Manage service advisers available in the tracker.</p>
        </div>

        <button
          type="button"
          className="bs-advisor-refresh"
          onClick={fetchAdvisors}
          disabled={loading}
          title="Refresh service advisers"
        >
          ↻
        </button>
      </div>

      {error && (
        <div
          className="bs-advisor-alert bs-advisor-alert-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="bs-advisor-alert bs-advisor-alert-success"
          role="status"
        >
          {success}
        </div>
      )}

      <section className="bs-advisor-form-section">
        <div className="bs-advisor-section-title">
          <div>
            <h4>{editingId ? "Edit service adviser" : "Add service adviser"}</h4>
            <p>
              {editingId
                ? "Update the selected service adviser."
                : "Add a service adviser to the available list."}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="bs-advisor-cancel"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel edit
            </button>
          )}
        </div>

        <form className="bs-advisor-form" onSubmit={handleSubmit}>
          <label>
            Service adviser name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Rahul"
              required
            />
          </label>

          <label>
            Sort order
            <input
              type="number"
              name="sortOrder"
              value={form.sortOrder}
              onChange={handleChange}
            />
          </label>

          <div className="bs-advisor-form-actions">
            <button
              type="submit"
              className="bs-advisor-save"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Add adviser"}
            </button>

            {editingId && (
              <button
                type="button"
                className="bs-advisor-cancel"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bs-advisor-list-section">
        <div className="bs-advisor-list-heading">
          <div>
            <h4>Service advisers</h4>
            <p>{advisors.length} active advisers</p>
          </div>
        </div>

        <div className="bs-advisor-table-wrap">
          {loading ? (
            <p className="bs-advisor-empty">Loading service advisers...</p>
          ) : advisors.length === 0 ? (
            <p className="bs-advisor-empty">No service advisers found.</p>
          ) : (
            <table className="bs-advisor-table">
              <thead>
                <tr>
                  <th>Service adviser</th>
                  <th>Sort order</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {advisors.map((advisor) => (
                  <tr key={advisor._id}>
                    <td><strong>{advisor.name}</strong></td>
                    <td>{advisor.sortOrder ?? 0}</td>
                    <td>
                      <div className="bs-advisor-actions">
                        <button
                          type="button"
                          className="bs-advisor-edit"
                          onClick={() => handleEdit(advisor)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="bs-advisor-deactivate"
                          onClick={() => handleDeactivate(advisor)}
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

export default ServiceAdvisorManagement;
