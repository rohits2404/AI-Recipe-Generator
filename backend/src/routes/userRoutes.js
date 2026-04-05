import express from "express";
import { protect } from "../middleware/auth.js";
import { changePassword, deleteAccount, getProfile, updatePreferences, updateProfile } from "../controllers/userController.js";

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/prefrences', updatePreferences);
router.put('/change-password', changePassword);
router.delete('/account', deleteAccount);

export default router;
