const express = require('express');
const router = express.Router();
const AdminUser = require('../models/Admin.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const logAdminActivity = require('../routes/actions/logaction');
const ActivityLog = require('../models/ActivityLogs.model');
const UserRecord = require('../models/UserRecords.model');

// Secret for JWT signing
const JWT_SECRET = process.env.ADMIN_TOKEN_SECRET; // Change this to a secure, environment-specific secret

// Create Admin User
router.post('/create', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if the username or email already exists
        
        const existingUser = await AdminUser.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const newAdminUser = new AdminUser({ username, email, password });
        await newAdminUser.save();

        res.status(201).json({
            message: 'Admin user created successfully',
            user: {
                username: newAdminUser.username,
                email: newAdminUser.email,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Read Admin User (by ID)
router.get('/:id', async (req, res) => {
    try {
        const user = await AdminUser.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Admin user not found' });
        }

        res.status(200).json({
            username: user.username,
            email: user.email,
            // Do not include the password in the response
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Admin User (by ID)
router.patch('/:id', async (req, res) => {
    try {
        const { userEmail, userPhone, userIdentity } = req.body;

        const updates = {};
        if (userPhone) updates.phoneNumber = userPhone;
        if (userEmail) updates.email = userEmail;
        if (userIdentity) updates.identity = userIdentity;

        const user = await AdminUser.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'Admin user not found' });
        }

        res.status(200).json({
            message: 'Admin user updated successfully',
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change Admin User Password
router.patch('/admin/changePassword/:username', async (req, res) => {
    const { username } = req.params;
    const { oldPassword, newPassword } = req.body;

    try {
        // Check if username, old password, and new password are provided
        if (!username || !oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Username, old password, and new password are required.' });
        }

        // Find the admin user by username
        const adminUser = await AdminUser.findOne({ username });
        if (!adminUser) {
            return res.status(404).json({ error: 'Admin user not found.' });
        }

        // Verify the old password
        const isMatch = await bcrypt.compare(oldPassword, adminUser.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Old password is incorrect.' });
        }


        // Update the password
        adminUser.password = newPassword;
        await adminUser.save();

        // Log the password change activity
        await logAdminActivity({
            username,
            action: 'Password Changed',
            details: `Updated admin user password for user ${username}`
        });

        // Send success response
        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'An error occurred while changing the password.' });
    }
});

// Delete Admin User (by ID)
router.delete('/:id', async (req, res) => {
    try {
        const user = await AdminUser.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Admin user not found' });
        }

        res.status(200).json({ message: 'Admin user deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login Admin User
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await AdminUser.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            JWT_SECRET
        );

        res.status(200).json({
            message: 'Login successful',
            user,
            token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change User Password

router.put('/user/changePassword', async (req, res) => {
    const { username, newPassword } = req.body;

    // Validate inputs
    if (!username || !newPassword) {
        return res.status(400).json({ message: 'Username and new password are required' });
    }

    try {
        // Fetch user from the database by username
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password in database
        user.password = newPassword;
        await user.save();

        await logAdminActivity({ username, action: "Password Changed", details: `Updated user Password for user ${username}` });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
});

// change payment password
router.put('/user/paymentPassword', async (req, res) => {
    const { username, paymentPassword } = req.body;

    // Validate inputs
    if (!username || !paymentPassword) {
        return res.status(400).json({ message: 'Username and new password are required' });
    }

    try {
        // Fetch user from the database by username
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password in database
        user.withdrawlPassword = paymentPassword;
        await user.save();
        await logAdminActivity({ username, action: "Payment Password Changed", details: `Updated user Payment Password for user ${username}` });
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
});


// change credit score
router.put('/user/creditScore', async (req, res) => {
    const { username, creditScore } = req.body;

    // Validate inputs
    if (!username || !creditScore) {
        return res.status(400).json({ message: 'Username and credit Score are required' });
    }

    try {
        // Fetch user from the database by username
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password in database
        if (creditScore > 100) {
            user.creditScore = 100;
        } else {
            user.creditScore = creditScore;
        }

        await user.save();
        await logAdminActivity({ username, action: "Credit Score Changed", details: `Updated user Credit Score for user ${username}` });
        res.status(200).json({ message: 'Credit Score updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
});

// reset task
router.put('/user/reset/task', async (req, res) => {
    const { username } = req.body;

    // Validate inputs
    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        // Fetch user from the database by username
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password in database
        user.clicks = 0;
        await user.save();
        await logAdminActivity({ username, action: "Task Reset", details: `Task Reset for user ${username}` });
        res.status(200).json({ message: 'Order Task Reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
});


// disable user
router.put('/user/disable', async (req, res) => {
    const { username } = req.body;

    // Validate inputs
    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        // Fetch user from the database by username
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password in database
        user.status = true;
        await user.save();
        await logAdminActivity({ username, action: "User Disabled", details: `Changed Status to inactive for user ${username}` });
        res.status(200).json({ message: 'User Disabled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
});


// Update card order details
router.put('/user/cardOrder', async (req, res) => {
    const { username, comissionRatio, cardOne, singleCardOne, cardName } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }

    try {
        // Find the user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update fields only if they are provided
        if (comissionRatio !== undefined) user.commission = comissionRatio;
        if (cardOne !== undefined) user.cardItem = cardOne;
        if (singleCardOne !== undefined) user.fixedTask = singleCardOne;
        if (cardName !== undefined ) user.cardName = cardName;

        // Save the updated user
        await user.save();
        await logAdminActivity({ username, action: "Card Order Details", details: `Updated Card Order Details for user ${username}` });
        return res.status(200).json({
            message: 'Card Order Details Updated successfully.',
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});


// user recharge or deduction 
router.put('/user/updateAmount', async (req, res) => {
    const { username, changeAmount, changeType } = req.body;

    // Validate input
    if (!username || changeAmount === undefined || !changeType) {
        return res.status(400).json({ message: 'Username, change value, and option are required.' });
    }

    try {
        // Determine increment or decrement value
        const incrementValue = changeType === 'userrecharge' ? changeAmount : -changeAmount;

        // Find and update the user balance
        const user = await User.findOneAndUpdate(
            { username },
            { $inc: { balance: incrementValue } },
            { new: true } // Return the updated document
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // If balance goes from negative to positive, handle pending records
        if (user.balance > 0 && changeType === 'userrecharge') {
            // Update additional fields if needed
            await User.updateOne(
                { username },
                { $set: { cardOrder: 0, fixedTask: 0 } }
            );

            // Fetch pending records
            const pendingRecords = await UserRecord.find({ userID: user._id, status: 'pending' });

            // Process each pending record
            for (const record of pendingRecords) {
                // Add profit to the user's balance
                user.balance += record.profit;
                user.balance += user.prevBalance;
                user.todayProfit = 0;

                // Update the record status
                await UserRecord.updateOne(
                    { _id: record._id },
                    { $set: { status: 'completed' } }
                );
            }

            // Save the updated user document
            await user.save();
        }

        // Log admin activity
        await logAdminActivity({
            username,
            action: "Payment Updated",
            details: `Payment Updated ${changeType} for user ${username}`
        });

        res.status(200).json({ message: 'User amount updated successfully.', user });
    } catch (error) {
        console.error('Error updating user amount:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});




module.exports = router;
