// Simple authentication middleware
export const requireAuth = (req, res, next) => {
    console.log("Auth check - Session:", req.session);
    console.log("Auth check - IsAuthenticated:", req.session?.isAuthenticated);
    console.log("Auth check - Session ID:", req.sessionID);
    
    if (req.session && req.session.isAuthenticated) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized. Please login." });
    }
};
