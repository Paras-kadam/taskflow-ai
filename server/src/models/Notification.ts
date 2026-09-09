import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type:
    | 'task_reminder'
    | 'task_due_soon'
    | 'task_overdue'
    | 'recurring_task'
    | 'task_completed'
    | 'daily_summary'
    | 'weekly_report'
    | 'system';
  title: string;
  message: string;
  read: boolean;
  taskId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'task_reminder',
        'task_due_soon',
        'task_overdue',
        'recurring_task',
        'task_completed',
        'daily_summary',
        'weekly_report',
        'system',
      ],
      default: 'system',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
