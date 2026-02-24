'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './db.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import {
  errorHandler,
  notFound,
} from '../middlewares/server-genericError-handler.js';

// Rutas
import authRoutes from '../src/auth/auth.routes.js';
import postRoutes from '../src/posts/post.routes.js';
import commentRoutes from '../src/comments/comment.routes.js';

const BASE_PATH = '/api/v1';

// ─── MIDDLEWARES ───────────────────────────────────────────────────────────────
const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
};

// ─── RUTAS ─────────────────────────────────────────────────────────────────────
const routes = (app) => {
    app.use(`${BASE_PATH}/auth`, authRoutes);
    app.use(`${BASE_PATH}/posts`, postRoutes);

    // Comentarios anidados: /api/v1/posts/:postId/comments
    app.use(`${BASE_PATH}/posts/:postId/comments`, commentRoutes);

    app.get(`${BASE_PATH}/health`, (req, res) => {
        res.status(200).json({
            success: true,
            status: 'Healthy',
            timestamp: new Date().toISOString(),
            service: 'Proyecto GestionOpiniones Service'
        });
    });

    app.use(notFound);
};

// ─── INIT SERVER ───────────────────────────────────────────────────────────────
export const initServer = async () => {
    const app = express();
    const PORT = process.env.PORT || 3005;
    app.set('trust proxy', 1);

    try {
        await dbConnection();

        middlewares(app);
        routes(app);

        app.use(errorHandler);

        app.listen(PORT, () => {
            console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📋 Health check: http://localhost:${PORT}${BASE_PATH}/health`);
            console.log(`\n🔧 Endpoints disponibles:`);
            console.log(`   - Auth:      ${BASE_PATH}/auth`);
            console.log(`   - Posts:     ${BASE_PATH}/posts`);
            console.log(`   - Comments:  ${BASE_PATH}/posts/:postId/comments\n`);
        });

    } catch (err) {
        console.error(`❌ Error iniciando servidor: ${err.message}`);
        process.exit(1);
    }
};