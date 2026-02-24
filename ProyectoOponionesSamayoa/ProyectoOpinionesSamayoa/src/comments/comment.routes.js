'use strict';

import { Router } from 'express';
import {
    getCommentsByPost,
    createComment,
    updateComment,
    deleteComment,
    repostComment
} from './comment.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

// Rutas anidadas bajo /posts/:postId/comments
router.get('/', verifyToken, getCommentsByPost);
router.post('/', verifyToken, createComment);

// Rutas de comentario individual (por commentId)
router.put('/:commentId', verifyToken, updateComment);
router.delete('/:commentId', verifyToken, deleteComment);
router.post('/:commentId/repost', verifyToken, repostComment);   // POST /posts/:postId/comments/:commentId/repost

export default router;