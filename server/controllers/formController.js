const FormRecord = require("../models/FormRecord");
const Branch = require("../models/Branch");
const Status = require("../models/Status");
const mongoose = require("mongoose");

// Create form record
const createFormRecord = async (req, res) => {
  try {
    const {
      branch,
      yardEntryDate,
      roDate,
      roNumber,
      regNo,
      model,
      customerName,
      contactNo,
      serviceAdvisor,
      whatsappGroupCreationDate,
      nextPmsDate,
      shieldEligibility,
      rsaEligibility,
      insuranceStatus,
      insuranceName,
      labourEstimate,
      partsEstimate,
      jobType,
      promisedDeliveryDate,
      presentStatus,
      labourBillAmount,
      partsBillAmount,
      billDate,
    } = req.body;

    // ----------------------------------
    // Basic validation
    // ----------------------------------

    // if (
    //   !yardEntryDate ||
    //   !roDate ||
    //   !roNumber ||
    //   !regNo ||
    //   !model ||
    //   !customerName ||
    //   !contactNo ||
    //   !serviceAdvisor ||
    //   !presentStatus
    // ) {
    //   return res.status(400).json({
    //     message:
    //       "Yard entry date, RO date, RO number, registration number, model, customer name, contact number and service advisor are required",
    //   });
    // }

    // ----------------------------------
    // Determine branch
    // ----------------------------------

    let assignedBranch;

    if (req.user.role === "admin") {
      // Admin can select branch
      if (!branch) {
        return res.status(400).json({
          message: "Branch is required for admin",
        });
      }

      assignedBranch = branch;
    } else {
      // User MUST use their assigned branch
      if (!req.user.branch) {
        return res.status(400).json({
          message: "User does not have an assigned branch",
        });
      }

      assignedBranch = req.user.branch._id;
    }

    // ----------------------------------
    // Check branch
    // ----------------------------------

    const existingBranch = await Branch.findById(assignedBranch);

    if (!existingBranch) {
      return res.status(404).json({
        message: "Branch not found",
      });
    }

    if (!existingBranch.isActive) {
      return res.status(400).json({
        message: "Selected branch is inactive",
      });
    }

    // ----------------------------------
    // Generate Sl No
    // ----------------------------------

    const lastRecord = await FormRecord.findOne()
      .sort({ slNo: -1 })
      .select("slNo");

    const slNo = lastRecord ? lastRecord.slNo + 1 : 1;

    if (!mongoose.Types.ObjectId.isValid(presentStatus)) {
      return res.status(400).json({
        message: "Invalid present status ID",
      });
    }

    const status = await Status.findOne({
      _id: presentStatus,
      isActive: true,
    });

    if (!status) {
      return res.status(400).json({
        message: "Invalid or inactive present status",
      });
    }

    // ----------------------------------
    // Create record
    // ----------------------------------

    const record = await FormRecord.create({
      slNo,

      branch: assignedBranch,

      createdBy: req.user._id,

      yardEntryDate,
      roDate,
      roNumber,
      regNo: regNo.toUpperCase(),
      model,
      customerName,
      contactNo,
      serviceAdvisor,

      whatsappGroupCreationDate,
      nextPmsDate,

      shieldEligibility,
      rsaEligibility,

      insuranceStatus,
      insuranceName,

      labourEstimate,
      partsEstimate,

      jobType,

      promisedDeliveryDate,

      presentStatus: status._id,

      labourBillAmount,
      partsBillAmount,

      billDate,
    });

    // ----------------------------------
    // Return populated record
    // ----------------------------------

    const createdRecord = await FormRecord.findById(record._id)
      .populate("branch", "name code")
      .populate("createdBy", "name email role")
      .populate("presentStatus", "name section");

    res.status(201).json({
      message: "Form record created successfully",
      record: createdRecord,
    });
  } catch (error) {
    console.error("Create form record error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get form records
const getFormRecords = async (req, res) => {
  try {
    const { branch, search, page = 1, limit = 20 } = req.query;

    const filter = {};

    // ----------------------------------
    // Branch access control
    // ----------------------------------

    if (req.user.role === "admin") {
      // Admin can filter by branch
      if (branch) {
        filter.branch = branch;
      }
    } else {
      // User can ONLY see assigned branch
      if (!req.user.branch) {
        return res.status(400).json({
          message: "User does not have an assigned branch",
        });
      }

      filter.branch = req.user.branch._id;
    }

    // ----------------------------------
    // Search
    // ----------------------------------

    if (search?.trim()) {
      filter.$or = [
        {
          roNumber: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          regNo: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          customerName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          contactNo: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // ----------------------------------
    // Pagination
    // ----------------------------------

    const currentPage = Math.max(Number(page), 1);
    const pageLimit = Math.max(Number(limit), 1);

    const skip = (currentPage - 1) * pageLimit;

    const totalRecords = await FormRecord.countDocuments(filter);

    const records = await FormRecord.find(filter)
      .populate("branch", "name code")
      .populate("createdBy", "name email role")
      .populate("presentStatus", "name section")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const totalPages = Math.ceil(totalRecords / pageLimit);

    res.status(200).json({
      message: "Form records fetched successfully",

      records,

      pagination: {
        currentPage,
        limit: pageLimit,
        totalRecords,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get form records error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Update form record
const updateFormRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      branch,
      yardEntryDate,
      roDate,
      roNumber,
      regNo,
      model,
      customerName,
      contactNo,
      serviceAdvisor,
      whatsappGroupCreationDate,
      nextPmsDate,
      shieldEligibility,
      rsaEligibility,
      insuranceStatus,
      insuranceName,
      labourEstimate,
      partsEstimate,
      jobType,
      promisedDeliveryDate,
      presentStatus,
      labourBillAmount,
      partsBillAmount,
      billDate,
    } = req.body;

    // ----------------------------------
    // Find record
    // ----------------------------------

    const record = await FormRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        message: "Form record not found",
      });
    }

    // ----------------------------------
    // Branch access control
    // ----------------------------------

    if (req.user.role === "user") {
      // User can edit ONLY their assigned branch
      if (!req.user.branch) {
        return res.status(400).json({
          message: "User does not have an assigned branch",
        });
      }

      if (record.branch.toString() !== req.user.branch._id.toString()) {
        return res.status(403).json({
          message: "You cannot edit records from another branch",
        });
      }
    }

    // ----------------------------------
    // Admin can change branch
    // ----------------------------------

    if (req.user.role === "admin" && branch) {
      const existingBranch = await Branch.findById(branch);

      if (!existingBranch) {
        return res.status(404).json({
          message: "Branch not found",
        });
      }

      if (!existingBranch.isActive) {
        return res.status(400).json({
          message: "Selected branch is inactive",
        });
      }

      record.branch = branch;
    }

    // ----------------------------------
    // Update fields
    // ----------------------------------

    if (yardEntryDate !== undefined) {
      record.yardEntryDate = yardEntryDate;
    }

    if (roDate !== undefined) {
      record.roDate = roDate;
    }

    if (roNumber !== undefined) {
      record.roNumber = roNumber;
    }

    if (regNo !== undefined) {
      record.regNo = regNo.toUpperCase();
    }

    if (model !== undefined) {
      record.model = model;
    }

    if (customerName !== undefined) {
      record.customerName = customerName;
    }

    if (contactNo !== undefined) {
      record.contactNo = contactNo;
    }

    if (serviceAdvisor !== undefined) {
      record.serviceAdvisor = serviceAdvisor;
    }

    if (whatsappGroupCreationDate !== undefined) {
      record.whatsappGroupCreationDate = whatsappGroupCreationDate;
    }

    if (nextPmsDate !== undefined) {
      record.nextPmsDate = nextPmsDate;
    }

    if (shieldEligibility !== undefined) {
      record.shieldEligibility = shieldEligibility;
    }

    if (rsaEligibility !== undefined) {
      record.rsaEligibility = rsaEligibility;
    }

    if (insuranceStatus !== undefined) {
      record.insuranceStatus = insuranceStatus;
    }

    if (insuranceName !== undefined) {
      record.insuranceName = insuranceName;
    }

    if (labourEstimate !== undefined) {
      record.labourEstimate = labourEstimate;
    }

    if (partsEstimate !== undefined) {
      record.partsEstimate = partsEstimate;
    }

    if (jobType !== undefined) {
      record.jobType = jobType;
    }

    if (promisedDeliveryDate !== undefined) {
      record.promisedDeliveryDate = promisedDeliveryDate;
    }

    if (presentStatus !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(presentStatus)) {
        return res.status(400).json({
          message: "Invalid present status ID",
        });
      }

      const status = await Status.findOne({
        _id: presentStatus,
        isActive: true,
      });

      if (!status) {
        return res.status(400).json({
          message: "Invalid or inactive present status",
        });
      }

      record.presentStatus = status._id;
    }
    if (labourBillAmount !== undefined) {
      record.labourBillAmount = labourBillAmount;
    }

    if (partsBillAmount !== undefined) {
      record.partsBillAmount = partsBillAmount;
    }

    if (billDate !== undefined) {
      record.billDate = billDate;
    }

    await record.save();

    // ----------------------------------
    // Return updated record
    // ----------------------------------

    const updatedRecord = await FormRecord.findById(record._id)
      .populate("branch", "name code")
      .populate("createdBy", "name email role")
      .populate("presentStatus", "name section");

    res.status(200).json({
      message: "Form record updated successfully",
      record: updatedRecord,
    });
  } catch (error) {
    console.error("Update form record error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createFormRecord,
  getFormRecords,
  updateFormRecord,
};
