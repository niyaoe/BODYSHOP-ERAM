import { useEffect, useState } from "react";
import {
  createFormRecord,
  updateFormRecord,
  getBranches,
  getStatuses,
} from "../services/formService";
import "./FormModal.css";

const initialForm = {
  branch: "",
  yardEntryDate: "",
  roDate: "",
  roNumber: "",
  regNo: "",
  model: "",
  customerName: "",
  contactNo: "",
  serviceAdvisor: "",
  whatsappGroupCreationDate: "",
  nextPmsDate: "",
  shieldEligibility: "",
  rsaEligibility: "",
  insuranceStatus: "",
  insuranceName: "",
  labourEstimate: "",
  partsEstimate: "",
  jobType: "",
  promisedDeliveryDate: "",
  presentStatus: "",
  labourBillAmount: "",
  partsBillAmount: "",
  billDate: "",
};

function FormModal({ isOpen, onClose, editRecord = null, onSuccess }) {
  const user = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState(initialForm);
  const [branches, setBranches] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  const isEditMode = Boolean(editRecord);

  /*
   * Load branches and statuses
   */
  useEffect(() => {
    if (!isOpen) return;

    const loadFormData = async () => {
      try {
        setLoadingData(true);
        setError("");

        const statusData = await getStatuses();

        setStatuses(statusData.statuses || statusData || []);

        // Branches are required only for admin
        if (user?.role === "admin") {
          const branchData = await getBranches();

          setBranches(branchData.branches || branchData || []);
        }
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load form data");
      } finally {
        setLoadingData(false);
      }
    };

    loadFormData();
  }, [isOpen, user?.role]);

  /*
   * Fill form when editing
   */
  useEffect(() => {
    if (!isOpen) return;

    if (editRecord) {
      setForm({
        branch: editRecord.branch?._id || editRecord.branch || "",
        yardEntryDate: formatDateForInput(editRecord.yardEntryDate),
        roDate: formatDateForInput(editRecord.roDate),
        roNumber: editRecord.roNumber || "",
        regNo: editRecord.regNo || "",
        model: editRecord.model || "",
        customerName: editRecord.customerName || "",
        contactNo: editRecord.contactNo || "",
        serviceAdvisor: editRecord.serviceAdvisor || "",
        whatsappGroupCreationDate: formatDateForInput(
          editRecord.whatsappGroupCreationDate,
        ),
        nextPmsDate: formatDateForInput(editRecord.nextPmsDate),
        shieldEligibility: editRecord.shieldEligibility || "",
        rsaEligibility: editRecord.rsaEligibility || "",
        insuranceStatus: editRecord.insuranceStatus || "",
        insuranceName: editRecord.insuranceName || "",
        labourEstimate: editRecord.labourEstimate ?? "",
        partsEstimate: editRecord.partsEstimate ?? "",
        jobType: editRecord.jobType || "",
        promisedDeliveryDate: formatDateForInput(
          editRecord.promisedDeliveryDate,
        ),
        presentStatus:
          editRecord.presentStatus?._id || editRecord.presentStatus || "",
        labourBillAmount: editRecord.labourBillAmount ?? "",
        partsBillAmount: editRecord.partsBillAmount ?? "",
        billDate: formatDateForInput(editRecord.billDate),
      });
    } else {
      setForm(initialForm);
    }
  }, [editRecord, isOpen]);

  const formatDateForInput = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toISOString().split("T")[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const payload = {
        ...form,
        labourEstimate:
          form.labourEstimate === "" ? undefined : Number(form.labourEstimate),

        partsEstimate:
          form.partsEstimate === "" ? undefined : Number(form.partsEstimate),

        labourBillAmount:
          form.labourBillAmount === ""
            ? undefined
            : Number(form.labourBillAmount),

        partsBillAmount:
          form.partsBillAmount === ""
            ? undefined
            : Number(form.partsBillAmount),
      };

      /*
       * User branch is controlled by backend.
       */
      if (user?.role !== "admin") {
        delete payload.branch;
      }

      if (isEditMode) {
        await updateFormRecord(editRecord._id, payload);
      } else {
        await createFormRecord(payload);
      }

      onSuccess?.();

      onClose();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="bs-form-modal-overlay"
      onMouseDown={(e) => {
        if (e.target.classList.contains("bs-form-modal-overlay")) {
          onClose();
        }
      }}
    >
      <div className="bs-form-modal">
        {/* HEADER */}

        <div className="bs-form-modal-header">
          <div>
            <h2 className="bs-form-modal-title">
              {isEditMode ? "Edit Record" : "Create New Record"}
            </h2>

            <p className="bs-form-modal-subtitle">
              {isEditMode
                ? "Update body shop record"
                : "Add a new body shop record"}
            </p>
          </div>

          <button
            type="button"
            className="bs-form-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* ERROR */}

        {error && <div className="bs-form-modal-error">{error}</div>}

        {loadingData ? (
          <div className="bs-form-modal-loading">Loading form...</div>
        ) : (
          <form className="bs-form-modal-form" onSubmit={handleSubmit}>
            {/* BASIC INFORMATION */}

            <div className="bs-form-modal-section">
              <h3 className="bs-form-modal-section-title">Basic Information</h3>

              <div className="bs-form-modal-grid">
                {user?.role === "admin" && (
                  <div className="bs-form-modal-field">
                    <label>Branch *</label>

                    <select
                      name="branch"
                      value={form.branch}
                      onChange={handleChange}
                      // required
                    >
                      <option value="">Select Branch</option>

                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bs-form-modal-field">
                  <label>Yard Entry Date *</label>

                  <input
                    type="date"
                    name="yardEntryDate"
                    value={form.yardEntryDate}
                    onChange={handleChange}
                    // required
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>RO Date *</label>

                  <input
                    type="date"
                    name="roDate"
                    value={form.roDate}
                    onChange={handleChange}
                    // required
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>RO Number *</label>

                  <input
                    type="text"
                    name="roNumber"
                    value={form.roNumber}
                    onChange={handleChange}
                    placeholder="Enter RO number"
                    // required
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>Registration Number *</label>

                  <input
                    type="text"
                    name="regNo"
                    value={form.regNo}
                    onChange={handleChange}
                    placeholder="KL01AB1234"
                    // required
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>Model *</label>

                  <input
                    type="text"
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    placeholder="Vehicle model"
                    // required
                  />
                </div>
              </div>
            </div>

            {/* CUSTOMER */}

            <div className="bs-form-modal-section">
              <h3 className="bs-form-modal-section-title">
                Customer Information
              </h3>

              <div className="bs-form-modal-grid">
                <div className="bs-form-modal-field">
                  <label>Customer Name *</label>

                  <input
                    type="text"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    // required
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>Contact Number *</label>

                  <input
                    type="tel"
                    name="contactNo"
                    value={form.contactNo}
                    onChange={handleChange}
                    maxLength="10"
                    placeholder="10 digit number"
                    // required
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>Service Advisor *</label>

                  <input
                    type="text"
                    name="serviceAdvisor"
                    value={form.serviceAdvisor}
                    onChange={handleChange}
                    // required
                  />
                </div>
              </div>
            </div>

            {/* DATES */}

            <div className="bs-form-modal-section">
              <h3 className="bs-form-modal-section-title">Follow-up & Dates</h3>

              <div className="bs-form-modal-grid">
                <div className="bs-form-modal-field">
                  <label>WhatsApp Group Creation Date</label>

                  <input
                    type="date"
                    name="whatsappGroupCreationDate"
                    value={form.whatsappGroupCreationDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>Next PMS Date</label>

                  <input
                    type="date"
                    name="nextPmsDate"
                    value={form.nextPmsDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>Promised Delivery Date</label>

                  <input
                    type="date"
                    name="promisedDeliveryDate"
                    value={form.promisedDeliveryDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>Bill Date</label>

                  <input
                    type="date"
                    name="billDate"
                    value={form.billDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* ELIGIBILITY */}

            <div className="bs-form-modal-section">
              <h3 className="bs-form-modal-section-title">Eligibility</h3>

              <div className="bs-form-modal-grid">
                <div className="bs-form-modal-field">
                  <label>Shield Eligibility</label>

                  <select
                    name="shieldEligibility"
                    value={form.shieldEligibility}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="bs-form-modal-field">
                  <label>RSA Eligibility</label>

                  <select
                    name="rsaEligibility"
                    value={form.rsaEligibility}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="bs-form-modal-field">
                  <label>Insurance Status</label>

                  <select
                    name="insuranceStatus"
                    value={form.insuranceStatus}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>

                    <option value="In-House">In-House</option>

                    <option value="Out-Side">Out-Side</option>

                    <option value="Cash">Cash</option>

                    <option value="Warranty">Warranty</option>
                  </select>
                </div>

                <div className="bs-form-modal-field">
                  <label>Insurance Name</label>

                  <input
                    type="text"
                    name="insuranceName"
                    value={form.insuranceName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* FINANCIAL */}

            <div className="bs-form-modal-section">
              <h3 className="bs-form-modal-section-title">Estimates & Bills</h3>

              <div className="bs-form-modal-grid">
                <div className="bs-form-modal-field">
                  <label>Labour Estimate</label>

                  <input
                    type="number"
                    min="0"
                    name="labourEstimate"
                    value={form.labourEstimate}
                    onChange={handleChange}
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>Parts Estimate</label>

                  <input
                    type="number"
                    min="0"
                    name="partsEstimate"
                    value={form.partsEstimate}
                    onChange={handleChange}
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>Labour Bill Amount</label>

                  <input
                    type="number"
                    min="0"
                    name="labourBillAmount"
                    value={form.labourBillAmount}
                    onChange={handleChange}
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>Parts Bill Amount</label>

                  <input
                    type="number"
                    min="0"
                    name="partsBillAmount"
                    value={form.partsBillAmount}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* STATUS */}

            <div className="bs-form-modal-section">
              <h3 className="bs-form-modal-section-title">Job Status</h3>

              <div className="bs-form-modal-grid">
                <div className="bs-form-modal-field">
                  <label>Job Type</label>

                  <select
                    name="jobType"
                    value={form.jobType}
                    onChange={handleChange}
                  >
                    <option value="">Select Job Type</option>

                    <option value="M1">M1</option>
                    <option value="M2">M2</option>
                    <option value="M3">M3</option>
                    <option value="M4">M4</option>
                  </select>
                </div>

                <div className="bs-form-modal-field">
                  <label>Present Status *</label>

                  <select
                    name="presentStatus"
                    value={form.presentStatus}
                    onChange={handleChange}
                    // required
                  >
                    <option value="">Select Status</option>

                    {statuses.map((status) => (
                      <option key={status._id} value={status._id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ACTIONS */}

            <div className="bs-form-modal-actions">
              <button
                type="button"
                className="bs-form-modal-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="bs-form-modal-submit"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : isEditMode
                    ? "Update Record"
                    : "Create Record"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default FormModal;
