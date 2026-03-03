import express from 'express';
import bcrypt from 'bcrypt';

import adminModel from '../models/adminModel';

import generateTokenAndSetCookie from '../lib/utils/generateToken';
import whiteListSchema from '../models/whiteListSchema';

export const adminSignup = async (req, res) => {

    try{
        const {username, email, password,mobileNumber} = req.body;
        if(!username){
            return res.status(400).json({message:`Enter your name please`});
        }
        if(!email){
            return res.status(400).json({message:"Enter your email please"});
        }
        if(!password){
            return res.status(400).json({message:"Enter your password please"}); 
        }
        if(!mobileNumber){
            return res.status(400).json({message:"Enter your mobile number please"});
        }
        const salt =await bcrypt.genSalt(10);
        const hashPassword =await bcrypt.hash(password, salt);

        const admin =new adminModel({
            username,
            email,
            password:hashPassword,
            mobileNumber
        })
        admin.save();
        return res.status(200).json({admin});
    }catch(err){
        console.log(`Error has occured at admin signup page`);
        res.status(500).json({error:`Internal error - ${err.message}`});
    }
}
export const adminLogin  = async (req,res)=>{

    const {username,password,role} = req.body;
    if(!username){
        return res.status(400).json({message:"please provide the username"});
    }
    if(!password){
        return res.status(400).json({message:"please provide the password"});
    }
    if(!role){
        return res.status(400).json({provide:`Please provide the role of the person properly`});
    }
    const admin = await adminModel
  .findOne({ username: username })
    if(!admin){
        return res.status(404).json({message:`Admin with the username ${username} not found`});
    }
    if(role=="SuperAdmin"){
        const isSuperAdmin = await whiteListSchema.findOne({email:admin.email});
        if(!isSuperAdmin){ 
            return res.status(401).json({unauatharized:"You are unautharized for superAdmin"});
        }
    }
    const compare =await bcrypt.compare(password,admin?.password);
    if(!compare){
        return res.status(404).json({message:"Password mismacthed"});
    }
    generateTokenAndSetCookie(admin._id,role,res);
    const adminData = admin.toObject();
    delete adminData.password;
    return res.status(200).json(adminData);
}

export const adminLogout = async (req, res) => {

    try{

        res.cookie('jwt','',{maxAge:0});
        return res.status(200).json({logout:`You are successfully logged out`});
    }catch(err){
        console.log(`Error has occured at adminLogout page`);
        return res.status(500).json({err:`Internal error has occured`});
    }
}