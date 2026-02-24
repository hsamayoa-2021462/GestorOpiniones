'use strict';

import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        maxLength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    username: {
        type: String,
        required: [true, 'El nombre de usuario es requerido'],
        unique: true,
        trim: true,
        lowercase: true,
        maxLength: [50, 'El username no puede exceder 50 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El correo es requerido'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Correo no válido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida']
    },
    profilePicture: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        maxLength: [250, 'La bio no puede exceder 250 caracteres'],
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

export default mongoose.model('User', userSchema);