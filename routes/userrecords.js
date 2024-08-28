const express = require('express');
const router = express.Router();
const UserRecord = require('../models/UserRecords.model');

// Fetch all user records for a specific user
router.get('/user/records/:userID', async (req, res) => {
    const { userID } = req.params;

    try {
        // Fetch all records for the given userID
        const records = await UserRecord.find({ userID }).sort({ timestamp: -1 });

        if (!records) {
            return res.status(404).json({ message: 'No records found for this user.' });
        }

        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching user records:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Fetch user records by status
router.get('/user/records/:userID/status/:status', async (req, res) => {
    const { userID, status } = req.params;

    try {
        // Fetch records for the given userID and status
        const records = await UserRecord.find({ userID, status });

        if (!records) {
            return res.status(404).json({ message: 'No records found for this status.' });
        }

        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching user records by status:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Fetch user records by date range
router.get('/user/records/:userID/date', async (req, res) => {
    const { userID } = req.params;
    const { startDate, endDate } = req.query;

    try {
        // Ensure startDate and endDate are provided
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required.' });
        }

        // Fetch records for the given userID and date range
        const records = await UserRecord.find({
            userID,
            timestamp: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        if (!records) {
            return res.status(404).json({ message: 'No records found for this date range.' });
        }

        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching user records by date range:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Fetch user records by total amount range
router.get('/user/records/:userID/amount', async (req, res) => {
    const { userID } = req.params;
    const { minAmount, maxAmount } = req.query;

    try {
        // Ensure minAmount and maxAmount are provided
        if (minAmount === undefined || maxAmount === undefined) {
            return res.status(400).json({ message: 'Min amount and max amount are required.' });
        }

        // Fetch records for the given userID and amount range
        const records = await UserRecord.find({
            userID,
            totalAmount: {
                $gte: Number(minAmount),
                $lte: Number(maxAmount)
            }
        });

        if (!records) {
            return res.status(404).json({ message: 'No records found for this amount range.' });
        }

        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching user records by amount range:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
