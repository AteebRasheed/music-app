const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User.model'); // Assuming the User model is in the models directory
const Counter = require('../models/Counter.model');
const router = express.Router();
const Withdrawal = require('../models/Withdraw.model');
const RechargeRequest = require('../models/RechargeRequest.model');
const UserRecord = require('../models/UserRecords.model');

// Helper function to send responses
const sendResponse = (res, status, success, data, message) => {
    res.status(status).json({ success, data, message });
};

const getNextSequenceValue = async (sequenceName) => {
    const sequence = await Counter.findByIdAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { new: true }
    );
    return sequence.sequence_value;
};

const generateRandomCode = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, phone, password, pass, code } = req.body;
        // console.log(req.body)

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return sendResponse(res, 400, false, null, 'Username or email already in use');
        }

        const randomCode = await generateRandomCode(6);
        const sequenceId = await getNextSequenceValue('userId');

        const user = new User({
            username,
            email,
            phoneNumber: phone,
            password,
            withdrawlPassword: pass,
            parentId: code,
            code: randomCode,
            sequenceId
        });
        await user.save();
        sendResponse(res, 201, true, { id: user._id }, 'User registered successfully');
    } catch (error) {
        sendResponse(res, 500, false, null, 'Internal server error');
    }
});

// Get all users
router.get('/all', async (req, res) => {
    try {
        const users = await User.find();
        sendResponse(res, 200, true, users, 'Users retrieved successfully');
    } catch (error) {
        sendResponse(res, 500, false, null, 'Internal server error');
    }
});


// Get a single user by ID
router.get('/user/:id', async (req, res) => {
    try {
        // Fetch the user by ID from the database
        const user = await User.findById(req.params.id);

        // If no user is found, return a 404 error
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return the user details
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update a user
router.put('/:id', async (req, res) => {
    const userId = req.params.id;
    const updates = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update fields
        for (const key in updates) {
            if (updates[key] !== undefined && updates[key] !== null && updates[key] !== '') {
                user[key] = key === 'password' ? await bcrypt.hash(updates[key], 10) : updates[key];
            }
        }

        await user.save();
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete a user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return sendResponse(res, 404, false, null, 'User not found');
        }

        sendResponse(res, 200, true, null, 'User deleted successfully');
    } catch (error) {
        sendResponse(res, 500, false, null, 'Internal server error');
    }
});

// User login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return sendResponse(res, 400, false, null, 'Invalid username or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendResponse(res, 400, false, null, 'Invalid username or password');
        }
        const createToken = (user) => {
            return jwt.sign({ username }, process.env.USER_TOKEN_SECRET);
        };
        // You can add JWT token generation here
        sendResponse(res, 200, true, { user: user, token: createToken }, 'Login successful');
    } catch (error) {
        sendResponse(res, 500, false, null, 'Internal server error');
    }
});

// Change password
router.post('/changePassword', async (req, res) => {
    try {
        const { username, oldPassword, newPassword } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return sendResponse(res, 404, false, null, 'User not found');
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return sendResponse(res, 400, false, null, 'Old password is incorrect');
        }

        user.password = newPassword;
        await user.save();

        sendResponse(res, 200, true, null, 'Password changed successfully');
    } catch (error) {
        sendResponse(res, 500, false, null, 'Internal server error');
    }
});

router.patch('/changeWithdrawalPassword', async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Compare the old withdrawal password
        if (oldPassword != user.withdrawlPassword) {
            return res.status(400).json({ error: 'Incorrect old withdrawal password' });
        }


        // Update the user's withdrawal password
        user.withdrawlPassword = newPassword;
        await user.save();

        res.status(200).json({ message: 'Withdrawal password changed successfully' });
    } catch (error) {
        console.error('Error changing withdrawal password:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


router.patch('/incrementClicks/:id', async (req, res) => {

    const { songName, totalAmount, profit } = req.body
    // console.log(songName, totalAmount, profit)
    try {
        // Fetch the user by ID
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Ensure clicks do not exceed assigned tasks
        if (user.clicks >= user.assignedTasks) {
            return res.status(400).json({ error: 'Clicks cannot exceed assigned tasks' });
        }

        // Increment the click count
        user.clicks += 1;

        // Handle fixed tasks and adjust amount if necessary
        if (user.clicks >= user.fixedTask && user.fixedTask > 0) {
            user.prevBalance = user.balance;
            user.balance -= user.cardItem; // Subtract card Item value from balance
        }



        // Check if balance is negative
        if (user.balance < 0) {
            // Save the record in UserRecord schema
            await UserRecord.create({
                songName: songName || 'Unknown',
                totalAmount: totalAmount || 0,
                profit: profit || 0,
                timestamp: new Date(),
                userID: user._id,
                status: 'pending' // Default status or update as needed
            });
        } else {
            // Add commission to the balance if not negative
            await UserRecord.create({
                songName: songName || 'Unknown',
                totalAmount: totalAmount || 0,
                profit: profit || 0,
                timestamp: new Date(),
                userID: user._id,
                status: 'completed' // Default status or update as needed
            });
            user.todayProfit = (user.todayProfit || 0) + profit;
            user.totalProfit = (user.totalProfit || 0) + profit;
            user.balance += profit;
        }

        // Save the updated user document
        await user.save();

        // Send response
        res.status(200).json({
            message: 'Successful Order Grabbing',
            clicks: user.clicks,
            balance: user.balance,
            todayProfit: user.todayProfit,
            totalProfit: user.totalProfit
        });
    } catch (error) {
        console.error('Error incrementing clicks:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


const generateTransactionId = () => {
    const length = 16;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let transactionId = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        transactionId += characters[randomIndex];
    }
    return `CO${transactionId}`;
};

// Handle withdrawal request
router.post('/withdrawalRequest', async (req, res) => {
    const { userId, withdrawalPassword, requestedAmount } = req.body;
    if (!userId || !withdrawalPassword || !requestedAmount) {
        return res.status(400).json({ error: 'User ID, withdrawal password, and requested amount are required' });
    }

    try {
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check withdrawal password
        if (withdrawalPassword !== user.withdrawlPassword) {
            return res.status(400).json({ error: 'Incorrect withdrawal password' });
        }

        // Check if the requested amount is valid
        if (requestedAmount <= 0) {
            return res.status(400).json({ error: 'Requested amount must be greater than 0' });
        }
        if (requestedAmount > user.balance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Calculate handling fee (example: 2% of requested amount)
        const handlingFee = requestedAmount * 0.02;

        // Create withdrawal request
        const withdrawal = new Withdrawal({
            transactionId: generateTransactionId(),
            userId: user._id,
            username: user.username,
            phoneNumber: user.phoneNumber,
            requestedAmount,
            balance: user.balance,
            network: user.network,
            wallet: user.wallet,
            handlingFee,
            processingTime: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from request time
        });

        await withdrawal.save();


        user.balance = user.balance - requestedAmount;
        await user.save();
        res.status(201).json({ message: 'Withdrawal request created successfully', withdrawal });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/withdrawalRequest/status/update/:id', async (req, res) => {
    const { id } = req.params;
    const { newStatus } = req.body;
    // console.log(req.body, 'status')
    // Validate the status field
    if (!newStatus || !['Pending', 'Approved', 'Rejected'].includes(newStatus)) {
        return res.status(400).json({ error: 'Invalid status value' });
    }

    try {
        // Find and update the withdrawal request
        const request = await Withdrawal.findByIdAndUpdate(
            id,
            { status: newStatus }
        );

        if (newStatus === "Rejected") {
            const user = await User.findById(request.userId);
            user.balance += request.requestedAmount;
            await user.save();
        }
        if (!request) {
            return res.status(404).json({ error: 'Withdrawal request not found' });
        }

        // Respond with the updated request
        res.status(200).json({
            message: 'Withdrawal request status updated successfully',
            request
        });
    } catch (error) {
        console.error('Error updating withdrawal request status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


router.get('/withdrawalRequests/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch withdrawal requests for the specified user
        const requests = await Withdrawal.find({ userId })
            .sort({ requestTime: -1 }); // Sort by request time descending

        res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/withdrawalRequests', async (req, res) => {
    try {

        // Fetch withdrawal requests for the specified user
        const requests = await Withdrawal.find()
            .sort({ requestTime: -1 }); // Sort by request time descending

        res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


// Create Recharge Request API
router.post('/rechargeRequest', async (req, res) => {
    try {
        const { amount, userId, username, phoneNumber } = req.body;

        // Validate the amount
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Generate a transaction ID
        const transactionId = generateTransactionId();

        // Get current time
        const requestTime = new Date();

        // Set processing time to 1 hour later
        const processingTime = new Date(requestTime.getTime() + 60 * 60 * 1000);

        // Create the recharge request
        const rechargeRequest = new RechargeRequest({
            transactionId,
            userId,
            username,
            phoneNumber,
            transactionAmount: amount,
            requestTime,
            processingTime
        });

        // Save the recharge request
        await rechargeRequest.save();

        // Respond with success message
        res.status(201).json({
            message: 'Recharge request created successfully',
            transactionId,
            requestTime,
            processingTime
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/rechargeRequests', async (req, res) => {
    try {

        // Fetch withdrawal requests for the specified user
        const requests = await RechargeRequest.find()
            .sort({ requestTime: -1 }); // Sort by request time descending

        res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/withdrawlinformation/:id', async (req, res) => {
    const { id } = req.params;
    const { network, wallet } = req.body;

    try {
        // Find the user by ID and update the network and wallet
        const user = await User.findByIdAndUpdate(
            id,
            { network, wallet },
            { new: true} // Return the updated document
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;