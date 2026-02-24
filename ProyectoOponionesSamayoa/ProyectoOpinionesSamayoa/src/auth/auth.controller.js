'use strict';

import User from './user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ─── REGISTRO ─────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { name, username, email, password, bio, profilePicture } = req.body;

        // Verificar si ya existe el email o username
        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'El correo o nombre de usuario ya está en uso'
            });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            bio,
            profilePicture
        });

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: userResponse
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al registrar el usuario',
            error: error.message
        });
    }
};

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        // identifier puede ser email o username

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Ingresa tu correo/username y contraseña'
            });
        }

        // Buscar por email o username
        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { username: identifier.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Cuenta desactivada'
            });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Generar JWT
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            data: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

// ─── VER PERFIL PROPIO ─────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.status(200).json({ success: true, data: user });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener perfil', error: error.message });
    }
};

// ─── EDITAR PERFIL ─────────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
    try {
        const { name, username, bio, profilePicture, currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        // Si quiere cambiar contraseña, verificar la actual
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes ingresar tu contraseña actual para cambiarla'
                });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña actual es incorrecta'
                });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Verificar si el nuevo username ya existe (de otro usuario)
        if (username && username.toLowerCase() !== user.username) {
            const taken = await User.findOne({ username: username.toLowerCase() });
            if (taken) {
                return res.status(400).json({ success: false, message: 'El username ya está en uso' });
            }
            user.username = username.toLowerCase();
        }

        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;
        if (profilePicture !== undefined) user.profilePicture = profilePicture;

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: userResponse
        });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al actualizar perfil', error: error.message });
    }
};