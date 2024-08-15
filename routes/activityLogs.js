const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLogs.model');

// GET /api/logs - Fetch all activity logs
router.get('/logs', async (req, res) => {
    try {
        // Fetch logs from the database
        const logs = await ActivityLog.find();
        res.status(200).json(logs);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

module.exports = router;
