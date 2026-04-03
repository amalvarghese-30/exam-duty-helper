const Allocation = require("../models/Allocation");

exports.getFairnessSummary = async (req, res) => {
    try {
        const allocations = await Allocation.find();

        const teacherLoads = {};

        allocations.forEach(a => {
            teacherLoads[a.teacherId] =
                (teacherLoads[a.teacherId] || 0) + 1;
        });

        const loads = Object.values(teacherLoads);

        const maxLoad = Math.max(...loads);
        const minLoad = Math.min(...loads);

        const avgLoad =
            loads.reduce((a, b) => a + b, 0) / loads.length;

        res.json({
            totalTeachers: loads.length,
            maxLoad,
            minLoad,
            avgLoad,
            fairnessScore: (minLoad / maxLoad).toFixed(2)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getDistribution = async (req, res) => {
    try {
        const allocations = await Allocation.find();

        const teacherLoads = {};

        allocations.forEach(a => {
            teacherLoads[a.teacherId] =
                (teacherLoads[a.teacherId] || 0) + 1;
        });

        res.json(teacherLoads);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getHistory = async (req, res) => {
    res.json({
        message: "Fairness history feature coming soon"
    });
};