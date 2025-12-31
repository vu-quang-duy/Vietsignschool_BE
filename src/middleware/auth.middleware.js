const jwt = require('jsonwebtoken');

function authRequired(req, res, next){
    try{
        const auth = req.headers.authorization || "";
        const [type, token] = auth.split(" ");

        if (type !== "Bearer" || !token){
            return res.status(401).json({message: "Authorization token required"});
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();

    }
    catch(err){
        return res.status(401).json({ message: "Invalid Token or expired! "})
    }
}


module.exports = {authRequired}