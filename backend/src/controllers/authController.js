import User from '../models/User.js';
import UserPreferences from '../models/UserPrefrences.js';
import jwt from 'jsonwebtoken';

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// Register new User

export const register = async (req, res, next) => {
    try {
        const {email , password , name} = req.body;
        const emailNormalized = email.toLowerCase().trim();
        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Please Provide Email, Password and Name'
            });
        }
        // Check if user exists 
        const existingUser = await User.findByEmail(emailNormalized);
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: 'User Already Exist With This Email'
            });
        }
        // Create User
        const user = await User.create({email: emailNormalized, password, name});
        await UserPreferences.upsert(user.id , {
            dietary_restrictions: [],
            allergies: [],
            preferred_cuisines: [],
            default_servings: 4,
            measurement_unit: 'metric'
        });
        const token = generateToken(user);
        res.status(201).json({
            success: true,
            message: 'User Registered Successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            }
        });
    }
    catch (error) {
        next(error);
    }
}

// Login User

export const login = async (req , res , next) => {
    try{
        const {email , password} = req.body;
        // Validation
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: 'Please Provide Email And Password'
            });
        }
        // Check if user exists
        const user = await User.findByEmail(email);
        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Invalid Credentials'
            });
        }
        // Check if password is correct
        const isPasswordValid = await User.verifyPassword(
            password,
            user.password_hash
        );
        if(!isPasswordValid){
            return res.status(401).json({
                success: false,
                message: 'Invalid Credentials'
            });
        }
        const token = generateToken(user);
        res.status(200).json({
            success: true,
            message: 'User Logged In Successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            }
        });
    }
    catch(error){
        next(error);
    }
}

export const getCurrentUser = async (req , res , next) => {
    try{
        const user = await User.findById(req.user.id);
        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User Not Found'
            });
        }
        res.status(200).json({
            success: true,
            data: { user }
        })

    }
    catch(error){
        next(error); 
    }
}

export const requestPasswordReset = async (req , res , next) => {
    try{
        const {email} = req.body;
        if(!email){
            return res.status(400).json({
                success: false,
                message: 'Please Provide Email'
            });
        }
        const user = await User.findByEmail(email);
        // Not checking if user exist or not for security reasons 
        res.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent'
        });
    }
    catch(error){
        next(error)
    }
}
