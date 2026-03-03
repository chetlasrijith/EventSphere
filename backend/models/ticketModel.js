import mongoose from 'mongoose'

const ticketSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "event", // Assuming you have an Event model
        required: true,
    },
    
    bookingId: {
        type: String,
        required: true,
        unique: true,
    },
    secretCode: {
        type: String,
        required: true,
    },
    qrCodeValue: {
        type: String,
        required: true,
    },
    attendeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attendee", // Assuming you have a User model
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;