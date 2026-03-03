import jwt from 'jsonwebtoken'

import adminSchema from '../models/adminModel.js'

const adminProtectRoute = async (req,res,next) =>{
    try{
        const token = req.cookies?.jwt;
        if(!token){
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(decoded.role!='Admin'&&decoded.role!='SuperAdmin'){
            return res.status(401).json({ Unauthorized: "it is an unauthorized access" });
        }
        const admin =await adminSchema.findById(decoded.userId);
        if(!admin){
            return res.status(401).json({ Unauthorized: "it is an unauthorized access" });
        }
        if(admin.status!='approved'){
            return res.status(401).json({ Unauthorized: "it is an unauthorized access" });
        }
        req.user=admin;
        next();

    }catch(err){
        console.log(`Error occured at admin protect route`);
        return res.status(500).json({err:`- Error occured at admin protect route`})
    }
}
export default adminProtectRoute;