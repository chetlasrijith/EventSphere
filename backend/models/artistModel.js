import mongoose from "mongoose";

const artistSchema = new mongoose.Schema({
    artistName: {
        type: String,
        required: true,
        trim: true,
    },
    genre: {
        type: String,
        required: true,
        trim: true,
    },
    bio: {
        type: String,
        default: "No bio available",
    },
    image:{
        type: String,
        default:"",
    },
    birthDate: {
        type: Date,
    },
    socialLinks: {
        website: { type: String },
        instagram: { type: String },
        twitter: { type: String },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
},{timestamps:true});

const Artist = mongoose.model("Artist", artistSchema);

export default Artist;
