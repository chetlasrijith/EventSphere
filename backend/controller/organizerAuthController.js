import organizer from '../models/organizerModel.js';
import bcrypt from 'bcrypt';
import generateTokenAndSetCookie from '../lib/utils/generateToken.js';

export const organizerSignup = async (req, res) => {
    try {
        const {
            username, password, email, mobileNumber, address
        } = req.body;
        const { street, city, state, postalCode, country } = address;

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password length should be more than 6 characters' });
        }
        const existingUser = await organizer.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        const existingEmail = await organizer.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: "Email already exists" });
        }
        if(!mobileNumber){
            return res.status(400).json({ error:"Mobile number must be provided" });
        }
        if(!street){
            return res.status(404).json({message:"event street should be provided"});
        }
        if(!city){
            return res.status(404).json({message:"event  city should be provided"});
        }
        if(!postalCode){
            return res.status(404).json({message:"event postal code should be provided"});
        }
        if(!state){
            return res.status(404).json({message:"event state should  be provided"});
        }
        if(!country){
            return res.status(404).json({message:"event country should be provided"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newOrganizer = new organizer({
            username,
            email,
            password: hashPassword,
            mobileNumber,
            address
        });

        await newOrganizer.save();
        generateTokenAndSetCookie(newOrganizer._id,"Organizer", res);

        return res.status(200).json({
            success: "User created successfully",
        });
    } catch (err) {
        return res.status(500).json({ error: `Error occurred - ${err.message}` });
    }
};

export const organizerLogin=async (req, res) => {
    try{
        const {username, password} = req.body;
        console.log(username);
        if(!username||!password){
            return res.status(400).json({error:"Enter the username and password"})
        }
        const user = await organizer.findOne({username});
        if(!user){
            return res.status(400).json({error:"Enter the valid username"});
        }
        let isPasswordCorrect = await bcrypt.compare(password, user?.password);
        if(!isPasswordCorrect){
            return res.status(400).json({error:"password incorrect"});
        }
        generateTokenAndSetCookie(user._id,"Organizer",res);
        return res.status(200).json({
            _id:user._id,
            username: user.username,
            email: user.email,
        })
    }
    catch(err){
        console.error(`Error has occued in Organizerlogin`);
        return res.status(500).json({error:`Internal error has occured - ${err.message}`});
    }

}
export const organizerLogout=(req, res) => {
    try{
        res.cookie('jwt',"",{maxAge:0});
        return res.status(200).json({success:"successfully loggedout"});
    }catch(err){
        console.error(`Internal error has occured - OrganizerLogout`);
        res.status(500).json({error:`Internal error has occured - ${err.message}`});
    }
}