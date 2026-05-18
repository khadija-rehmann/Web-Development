const jwt = require('jsonwebtoken');

// This middleware checks if the request has a valid JWT token
// It is used to protect API routes that require login
// The token must be sent in the header like: Authorization: Bearer <token>
function verifyToken(req, res, next) {

    // Step 1: Get the Authorization header from the request
    const authHeader = req.headers['authorization'];

    // Step 2: If no header exists, reject the request
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    // Step 3: The header looks like "Bearer <token>"
    // Split it by space and take the second part (the actual token)
    const token = authHeader.split(' ')[1];

    // Step 4: If token part is missing after splitting, reject
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Token is missing.'
        });
    }

    // Step 5: Verify the token using our secret key
    try {
        // jwt.verify checks if token is valid and not expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Step 6: Attach the decoded user info to req object
        // Now any route after this can use req.user
        req.user = decoded;

        // Step 7: Move on to the actual route
        next();

    } catch (error) {
        // Token is invalid or expired
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token. Please login again.'
        });
    }
}

module.exports = verifyToken;
