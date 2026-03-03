import Attendee from "../models/attendeeModel.js";
import bcrypt from "bcrypt";
import generateToken from "../lib/utils/generateToken.js";

export const attendeeSignup=async (req,res)=>{
    try {
        const { username, email, password, mobileNumber} = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, msg: "All input fields are required" });
        }
        const salt=await bcrypt.genSalt(10);
        const hashPassword=await bcrypt.hash(password,salt);
        const user = new Attendee({
            username,
            email,
            password:hashPassword,
            mobileNumber
        });
        await user.save();
        generateToken(user._id,"Attendee",res);
        return res.status(200).json({
            success:'Attendee created successfully',
        });
    } catch (err) {
        console.log("Error in server:", err);
        res.status(500).json({ success: false, msg: "Server error during signup" , error: err.message});
    }
}

export const attendeeLogin=async (req,res)=>{
    try{
        const { username, password } = req.body;
        if(!username||!password){
            return res.status(400).json({error:"Enter the username and password"})
        }
        let user=await Attendee.findOne({username:username});
        if(!user)
        {
            return res.status(401).json({ success: false, msg: "Invalid credentials" });
        }
        else{
            let validPassword=await bcrypt.compare(password,user?.password);
            if(!validPassword)
            {
                return res.status(401).json({ success: false, msg: "Invalid password" });
            }
            else
            {
                generateToken(user._id,"Attendee",res);
                return res.status(200).json({
                    _id:user._id,
                    username: user.username
                })
            }
        }
    }
    catch(err)
    {
        console.error(`Internal error has occured - attendeeLogin`);
        res.status(500).json({error:`Internal error has occured - ${err.message}`});
    }
}

export const attendeeLogout=async(req,res)=>{
    try{
        res.cookie("jwt","",{maxAge:0});
        return res.status(200).json({success:"successfully loggedout"});
    }
    catch(err){
        console.error(`Internal error has occured - attendeeLogout`);
        res.status(500).json({error:`Internal error has occured - ${err.message}`}); 
    }
}