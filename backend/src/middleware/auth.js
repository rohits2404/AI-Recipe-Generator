import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET Is Not Defined');
        }
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No Authentication Token, Access Denied'
            });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.log('Auth Middleware Error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token Expired, Please Login Again'
            });
        }
        res.status(401).json({
            success: false,
            message: 'Invalid Token'
        });
    }
};
