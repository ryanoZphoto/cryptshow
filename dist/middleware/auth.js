"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
class AuthMiddleware {
    constructor(authService) {
        this.authService = authService;
        this.requestMap = new Map();
    }
    async authenticate(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = parts[1];
        const decoded = await this.authService.verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = decoded;
        next();
    }
    async requireAdmin(req, res, next) {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    }
    rateLimit(maxRequests, timeWindow) {
        return (req, res, next) => {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const now = Date.now();
            // Get existing requests for this IP
            const userRequests = this.requestMap.get(ip) || [];
            // Filter out old requests
            const recentRequests = userRequests.filter(time => now - time < timeWindow);
            if (recentRequests.length >= maxRequests) {
                const oldestRequest = Math.min(...recentRequests);
                const retryAfter = Math.ceil((timeWindow - (now - oldestRequest)) / 1000);
                return res.status(429).json({
                    error: 'Too many requests',
                    retryAfter
                });
            }
            // Add current request
            recentRequests.push(now);
            this.requestMap.set(ip, recentRequests);
            next();
        };
    }
    validateInput(schema) {
        return (req, res, next) => {
            const { error } = schema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    error: 'Invalid input',
                    details: error.details.map((detail) => detail.message)
                });
            }
            next();
        };
    }
}
exports.AuthMiddleware = AuthMiddleware;
