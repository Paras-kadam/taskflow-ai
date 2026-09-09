import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    icon: {
      type: String,
      default: 'folder',
    },
    color: {
      type: String,
      default: '#8b5cf6', // Violet
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ userId: 1, name: 1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
