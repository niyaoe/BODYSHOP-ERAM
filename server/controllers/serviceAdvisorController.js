
const ServiceAdvisor = require("../models/ServiceAdvisor");

// Get service advisers
const getServiceAdvisors = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin" &&
      req.query.includeInactive === "true"
        ? {}
        : { isActive: true };

    const serviceAdvisors = await ServiceAdvisor.find(filter)
      .sort({ name: 1 });

    res.status(200).json({
      message: "Service advisers fetched successfully",
      serviceAdvisors,
    });
  } catch (error) {
    console.error("Get service advisers error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create service adviser
const createServiceAdvisor = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Service adviser name is required",
      });
    }

    const existing = await ServiceAdvisor.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });

    if (existing) {
      return res.status(409).json({
        message: "Service adviser already exists",
      });
    }

    const serviceAdvisor = await ServiceAdvisor.create({
      name: name.trim(),
    });

    res.status(201).json({
      message: "Service adviser created successfully",
      serviceAdvisor,
    });
  } catch (error) {
    console.error("Create service adviser error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update service adviser
const updateServiceAdvisor = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const updates = {};

    if (typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }

    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
    }

    const serviceAdvisor = await ServiceAdvisor.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!serviceAdvisor) {
      return res.status(404).json({
        message: "Service adviser not found",
      });
    }

    res.status(200).json({
      message: "Service adviser updated successfully",
      serviceAdvisor,
    });
  } catch (error) {
    console.error("Update service adviser error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Service adviser name already exists",
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getServiceAdvisors,
  createServiceAdvisor,
  updateServiceAdvisor,
};
