'use strict';

import Post from './post.model.js';

// ─── OBTENER TODAS LAS PUBLICACIONES ──────────────────────────────────────────
export const getPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10, category } = req.query;

        const filter = {};
        if (category) filter.category = category;

        const posts = await Post.find(filter)
            .populate('author', 'name username profilePicture')
            .populate({
                path: 'originalPost',
                populate: { path: 'author', select: 'name username profilePicture' }
            })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Post.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: posts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener publicaciones', error: error.message });
    }
};

// ─── OBTENER PUBLICACIÓN POR ID ────────────────────────────────────────────────
export const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'name username profilePicture')
            .populate({
                path: 'originalPost',
                populate: { path: 'author', select: 'name username profilePicture' }
            });

        if (!post) {
            return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
        }

        res.status(200).json({ success: true, data: post });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener la publicación', error: error.message });
    }
};

// ─── CREAR PUBLICACIÓN ─────────────────────────────────────────────────────────
export const createPost = async (req, res) => {
    try {
        const { title, category, content } = req.body;

        const post = new Post({
            title,
            category,
            content,
            author: req.user.id
        });

        await post.save();
        await post.populate('author', 'name username profilePicture');

        res.status(201).json({
            success: true,
            message: 'Publicación creada exitosamente',
            data: post
        });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al crear la publicación', error: error.message });
    }
};

// ─── EDITAR PUBLICACIÓN ────────────────────────────────────────────────────────
export const updatePost = async (req, res) => {
    try {
        const { title, category, content } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
        }

        // Solo el autor puede editar
        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para editar esta publicación' });
        }

        // No permitir editar reposts
        if (post.isRepost) {
            return res.status(400).json({ success: false, message: 'No se puede editar un repost' });
        }

        if (title) post.title = title;
        if (category) post.category = category;
        if (content) post.content = content;

        await post.save();
        await post.populate('author', 'name username profilePicture');

        res.status(200).json({
            success: true,
            message: 'Publicación actualizada exitosamente',
            data: post
        });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al actualizar la publicación', error: error.message });
    }
};

// ─── ELIMINAR PUBLICACIÓN ──────────────────────────────────────────────────────
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
        }

        // Solo el autor puede eliminar
        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar esta publicación' });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Publicación eliminada exitosamente' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar la publicación', error: error.message });
    }
};

// ─── REPOST DE PUBLICACIÓN ─────────────────────────────────────────────────────
export const repost = async (req, res) => {
    try {
        const originalPost = await Post.findById(req.params.id);

        if (!originalPost) {
            return res.status(404).json({ success: false, message: 'Publicación original no encontrada' });
        }

        // Verificar que no se esté reposteando un repost (opcional, compartir el original)
        const targetId = originalPost.isRepost ? originalPost.originalPost : originalPost._id;

        const newPost = new Post({
            title: originalPost.title,
            category: originalPost.category,
            content: originalPost.content,
            author: req.user.id,
            isRepost: true,
            originalPost: targetId
        });

        await newPost.save();
        await newPost.populate('author', 'name username profilePicture');
        await newPost.populate({
            path: 'originalPost',
            populate: { path: 'author', select: 'name username profilePicture' }
        });

        res.status(201).json({
            success: true,
            message: 'Publicación reposteada exitosamente',
            data: newPost
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al repostear', error: error.message });
    }
};