import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeSession extends Document {
  userId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration: number; // Duration in seconds
  note?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TimeSessionSchema: Schema = new Schema(
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
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    completedAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TimeSessionSchema.index({ userId: 1, taskId: 1, completedAt: -1 });

export const TimeSession = mongoose.model<ITimeSession>('TimeSession', TimeSessionSchema);
