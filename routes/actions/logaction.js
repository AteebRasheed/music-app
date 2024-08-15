const ActivityLog = require('../../models/ActivityLogs.model');

/**
 * Log admin activity.
 * 
 * @param {string} username - The username of the admin.
 * @param {string} action - The action performed by the admin.
 * @param {string} [details=''] - Additional details about the action.
 * 
 * @returns {Promise<void>}
 */
const logAdminActivity = async ({ username, action, details = '' }) => {
    try {
        const newLog = new ActivityLog({
            username: String(username), // Ensure it's a string
            action: String(action),     // Ensure it's a string
            details: String(details)
        });

        await newLog.save();
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

module.exports = logAdminActivity;
