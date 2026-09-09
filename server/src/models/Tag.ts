import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      maxlength: 50,
    },
    color: {
      type: String,
      default: '#64748b', // Slate
    },
  },
  {
    timestamps: true,
  }
);

TagSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Tag = mongoose.model<ITag>('Tag', TagSchema);
