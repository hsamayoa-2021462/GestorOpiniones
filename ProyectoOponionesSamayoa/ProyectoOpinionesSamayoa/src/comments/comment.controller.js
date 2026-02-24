'use strict';

import Comment from './comment.model.js';
import Post from '../posts/post.model.js';

// ─── OBTENER COMENTARIOS DE UNA PUBLICACIÓN ────────────────────────────────────
export const getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Verificar que la publicación exista
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
        }

        const comments = await Comment.find({ post: postId })
            .populate('author', 'name username profilePicture')
            .populate({
                path: 'originalComment',
                populate: { path: 'author', select: 'name username profilePicture' }
            })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Comment.countDocuments({ post: postId });

        res.status(200).json({
            success: true,
            data: comments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener comentarios', error: error.message });
    }
};

// ─── CREAR COMENTARIO ──────────────────────────────────────────────────────────
export const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;

        // Verificar que la publicación exista
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
        }

        const comment = new Comment({
            content,
            author: req.user.id,
            post: postId
        });

        await comment.save();
        await comment.populate('author', 'name username profilePicture');

        res.status(201).json({
            success: true,
            message: 'Comentario creado exitosamente',
            data: comment
        });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al crear el comentario', error: error.message });
    }
};

// ─── EDITAR COMENTARIO ─────────────────────────────────────────────────────────
export const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
        }

        // Solo el autor puede editar
        if (comment.author.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para editar este comentario' });
        }

        if (comment.isRepost) {
            return res.status(400).json({ success: false, message: 'No se puede editar un repost de comentario' });
        }

        comment.content = content;
        await comment.save();
        await comment.populate('author', 'name username profilePicture');

        res.status(200).json({
            success: true,
            message: 'Comentario actualizado exitosamente',
            data: comment
        });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al actualizar el comentario', error: error.message });
    }
};

// ─── ELIMINAR COMENTARIO ───────────────────────────────────────────────────────
export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
        }

        // Solo el autor puede eliminar
        if (comment.author.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este comentario' });
        }

        await Comment.findByIdAndDelete(commentId);

        res.status(200).json({ success: true, message: 'Comentario eliminado exitosamente' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar el comentario', error: error.message });
    }
};

// ─── REPOST DE COMENTARIO ──────────────────────────────────────────────────────
export const repostComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const originalComment = await Comment.findById(commentId);
        if (!originalComment) {
            return res.status(404).json({ success: false, message: 'Comentario original no encontrado' });
        }

        // Si el original ya es un repost, apuntar al comentario raíz
        const targetId = originalComment.isRepost ? originalComment.originalComment : originalComment._id;

        const newComment = new Comment({
            content: originalComment.content,
            author: req.user.id,
            post: originalComment.post,
            isRepost: true,
            originalComment: targetId
        });

        await newComment.save();
        await newComment.populate('author', 'name username profilePicture');
        await newComment.populate({
            path: 'originalComment',
            populate: { path: 'author', select: 'name username profilePicture' }
        });

        res.status(201).json({
            success: true,
            message: 'Comentario reposteado exitosamente',
            data: newComment
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al repostear el comentario', error: error.message });
    }
};