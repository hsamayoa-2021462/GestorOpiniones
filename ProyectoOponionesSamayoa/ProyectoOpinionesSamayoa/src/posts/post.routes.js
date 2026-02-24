'use strict';

import { Router } from 'express';
import {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    repost
} from './post.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de posts requieren autenticación
router.get('/', verifyToken, getPosts);
router.get('/:id', verifyToken, getPostById);
router.post('/', verifyToken, createPost);
router.put('/:id', verifyToken, updatePost);
router.delete('/:id', verifyToken, deletePost);
router.post('/:id/repost', verifyToken, repost);   // POST /posts/:id/repost

export default router;