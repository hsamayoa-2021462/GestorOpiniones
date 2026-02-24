'use strict';

import mongoose from 'mongoose';

const commentSchema = mongoose.Schema({
    content: {
        type: String,
        required: [true, 'El contenido del comentario es requerido'],
        trim: true,
        maxLength: [1000, 'El comentario no puede exceder 1000 caracteres']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    // Repost de comentario: referencia al comentario original
    isRepost: {
        type: Boolean,
        default: false
    },
    originalComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

commentSchema.index({ post: 1 });
commentSchema.index({ author: 1 });

export default mongoose.model('Comment', commentSchema);