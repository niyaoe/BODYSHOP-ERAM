const User = require("../models/User");
const Branch = require("../models/Branch");
const FormRecord = require("../models/FormRecord");
const Status = require("../models/Status");

const getDashboard = async (req, res) => {
  try {
    const {
      branch,
      section,
      fromDate,
      toDate,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // ----------------------------------
    // Branch access control
    // ----------------------------------

    if (req.user.role === "admin") {
      if (branch) {
        filter.branch = branch;
      }
    } else {
      if (!req.user.branch) {
        return res.status(400).json({
          message: "User does not have an assigned branch",
        });
      }

      filter.branch = req.user.branch._id;
    }

    // ----------------------------------
    // Date filter
    // ----------------------------------

    if (fromDate || toDate) {
      filter.roDate = {};

      if (fromDate) {
        filter.roDate.$gte = new Date(`${fromDate}T00:00:00.000Z`);
      }

      if (toDate) {
        filter.roDate.$lte = new Date(`${toDate}T23:59:59.999Z`);
      }
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
        {
          model: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // ----------------------------------
    // Status section filter
    // ----------------------------------

    if (section) {
      const allowedSections = ["legalLoss", "billed", "open"];

      if (!allowedSections.includes(section)) {
        return res.status(400).json({
          message: "Invalid dashboard section",
        });
      }

      const statuses = await Status.find({
        section,
        isActive: true,
      }).select("_id");

      const statusIds = statuses.map((status) => status._id);

      filter.presentStatus = {
        $in: statusIds,
      };
    }

    // ----------------------------------
    // Pagination
    // ----------------------------------

    const currentPage = Math.max(Number(page), 1);
    const pageLimit = Math.max(Number(limit), 1);

    const skip = (currentPage - 1) * pageLimit;

    // ----------------------------------
    // Total records
    // ----------------------------------

    const totalRecords = await FormRecord.countDocuments(filter);

    // ----------------------------------
    // Records
    // ----------------------------------

    const records = await FormRecord.find(filter)
      .populate("branch", "name code")
      .populate("createdBy", "name email role")
      .populate("presentStatus", "name section")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const totalPages = Math.ceil(totalRecords / pageLimit);

    // ----------------------------------
    // Statistics
    // ----------------------------------

    const statistics = await FormRecord.aggregate([
      {
        $match: filter,
      },

      {
        $group: {
          _id: null,

          totalRecords: {
            $sum: 1,
          },

          totalLabourEstimate: {
            $sum: {
              $ifNull: ["$labourEstimate", 0],
            },
          },

          totalPartsEstimate: {
            $sum: {
              $ifNull: ["$partsEstimate", 0],
            },
          },

          totalLabourBill: {
            $sum: {
              $ifNull: ["$labourBillAmount", 0],
            },
          },

          totalPartsBill: {
            $sum: {
              $ifNull: ["$partsBillAmount", 0],
            },
          },
        },
      },
    ]);

    const summary = statistics[0] || {
      totalRecords: 0,
      totalLabourEstimate: 0,
      totalPartsEstimate: 0,
      totalLabourBill: 0,
      totalPartsBill: 0,
    };

    // ----------------------------------
    // Job Type statistics
    // ----------------------------------

    const jobTypeStats = await FormRecord.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$jobType",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    // ----------------------------------
    // Insurance statistics
    // ----------------------------------

    const insuranceStats = await FormRecord.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$insuranceStatus",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    // ----------------------------------
    // Shield statistics
    // ----------------------------------

    const shieldStats = await FormRecord.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$shieldEligibility",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // ----------------------------------
    // RSA statistics
    // ----------------------------------

    const rsaStats = await FormRecord.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$rsaEligibility",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // ----------------------------------
    // Branch statistics
    // Admin only
    // ----------------------------------

    let branchStats = [];

    if (req.user.role === "admin") {
      branchStats = await FormRecord.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$branch",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $lookup: {
            from: "branches",
            localField: "_id",
            foreignField: "_id",
            as: "branch",
          },
        },
        {
          $unwind: "$branch",
        },
        {
          $project: {
            _id: 0,
            branchId: "$branch._id",
            branchName: "$branch.name",
            branchCode: "$branch.code",
            count: 1,
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]);
    }

    // ----------------------------------
    // Admin statistics
    // ----------------------------------

    let adminStats = {};

    if (req.user.role === "admin") {
      adminStats = {
        totalUsers: await User.countDocuments({
          role: "user",
          isActive: true,
        }),

        totalBranches: await Branch.countDocuments({
          isActive: true,
        }),
      };
    }

    // ----------------------------------
    // Response
    // ----------------------------------

    res.status(200).json({
      message: "Dashboard data fetched successfully",

      summary: {
        totalRecords: summary.totalRecords,
        totalLabourEstimate: summary.totalLabourEstimate,
        totalPartsEstimate: summary.totalPartsEstimate,
        totalLabourBill: summary.totalLabourBill,
        totalPartsBill: summary.totalPartsBill,
        ...adminStats,
      },

      statistics: {
        jobType: jobTypeStats,
        insurance: insuranceStats,
        shield: shieldStats,
        rsa: rsaStats,
        branches: branchStats,
      },

      records,

      pagination: {
        currentPage,
        limit: pageLimit,
        totalRecords,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getDashboard,
};
