import mongoose, { Document, Schema } from 'mongoose';

export interface IFocusSession extends Document {
  userId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  duration: number; // in minutes
  type: 'pomodoro' | 'short_break' | 'long_break';
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FocusSessionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ['pomodoro', 'short_break', 'long_break'],
      default: 'pomodoro',
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

FocusSessionSchema.index({ userId: 1, completedAt: -1 });

export const FocusSession = mongoose.model<IFocusSession>('FocusSession', FocusSessionSchema);
