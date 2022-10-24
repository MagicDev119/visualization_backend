const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    birthday: {
        type: Date
    },
    gender: {
        type: String,
        enum: ["Male", "Female"]
    },
    race: {
        type: String,
        enum: ['American Indian or Alaska Native', 'Asian', 'Black or African American', 'Hispanic or Latino', 'Native Hawaiian or Other Pacific Islander', 'White']
    }
}, {
    timestamps: true
})
module.exports = mongoose.model('user', UserSchema)