'use strict';

import mongoose from 'mongoose';

const postSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        maxLength: [150, 'El título no puede exceder 150 caracteres']
    },
    category: {
        type: String,
        required: [true, 'La categoría es requerida'],
        trim: true,
        maxLength: [50, 'La categoría no puede exceder 50 caracteres']
    },
    content: {
        type: String,
        required: [true, 'El contenido es requerido'],
        trim: true,
        maxLength: [5000, 'El contenido no puede exceder 5000 caracteres']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Repost: referencia a la publicación original
    isRepost: {
        type: Boolean,
        default: false
    },
    originalPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ createdAt: -1 });

export default mongoose.model('Post', postSchema);