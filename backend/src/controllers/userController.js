import User from '../models/User.js';
import UserPreferences from '../models/UserPrefrences.js'

export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User Not Found' });
        }
        const preferences = await UserPreferences.findByUserId(req.user.id);
        res.json({ success: true, data: { user, preferences } });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const { name, email } = req.body;
        const emailNormalized = email?.toLowerCase().trim();
        if (!name && !email) {
            return res.status(400).json({ success: false, message: 'Please Provide Name Or Email To Update' });
        }
        const user = await User.updateUser(req.user.id, { name, email: emailNormalized });
        res.json({ success: true, message: 'Profile Updated Successfully', data: { user } });
    } catch (error) {
        next(error);
    }
};

export const updatePreferences = async (req, res, next) => {
    try {
        const preferences = await UserPreferences.upsert(req.user.id, req.body);
        res.json({ success: true, message: 'Preferences Updated Successfully', data: { preferences } });
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please Provide Current And New Password' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password Must Be At Least 6 Characters Long' });
        }

        // ✅ Use findByIdWithPassword to get password_hash — findById excludes it for security
        const user = await User.findByIdWithPassword(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User Not Found' });
        }

        const isValid = await User.verifyPassword(currentPassword, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Current Password Is Incorrect' });
        }

        await User.updatePassword(req.user.id, newPassword);
        res.json({ success: true, message: 'Password Changed Successfully' });
    } catch (error) {
        next(error);
    }
};

export const deleteAccount = async (req, res, next) => {
    try {
        await UserPreferences.deleteById(req.user.id);
        await User.deleteById(req.user.id);
        res.json({ success: true, message: 'Account Deleted Successfully' });
    } catch (error) {
        next(error);
    }
};
