import mongoose, { Document, Schema } from 'mongoose';

export interface ISubtask {
  _id?: mongoose.Types.ObjectId;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface IRecurrence {
  type: 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom_days' | 'monthly' | 'yearly';
  interval?: number;
  daysOfWeek?: number[]; // 0 for Sun, 1 for Mon, etc.
  endDate?: Date;
}

export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: 'inbox' | 'todo' | 'in-progress' | 'completed' | 'archived';
  priority: TaskPriority;
  dueDate?: Date;
  dueTime?: string; // HH:mm format
  reminder?: string; // 'none' | 'at_time' | '5min' | '10min' | '15min' | '30min' | '1hour' | '1day'
  reminderAt?: Date;
  reminderSent?: boolean;
  projectId?: mongoose.Types.ObjectId;
  tags: string[];
  subtasks: ISubtask[];
  recurrence?: IRecurrence;
  completedAt?: Date;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  dependencies?: mongoose.Types.ObjectId[];
  order: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubtaskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  { _id: true }
);

const RecurrenceSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['none', 'daily', 'weekdays', 'weekly', 'custom_days', 'monthly', 'yearly'],
      default: 'none',
    },
    interval: {
      type: Number,
      default: 1,
    },
    daysOfWeek: {
      type: [Number], // [1, 3, 5] for Mon, Wed, Fri
      default: [],
    },
    endDate: {
      type: Date,
    },
  },
  { _id: false }
);

const TaskSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['inbox', 'todo', 'in-progress', 'completed', 'archived'],
      default: 'inbox',
      index: true,
    },
    priority: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'urgent'],
      default: 'none',
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    dueTime: {
      type: String,
      default: '',
    },
    reminder: {
      type: String,
      enum: ['none', 'at_time', '5min', '10min', '15min', '30min', '1hour', '1day'],
      default: 'none',
    },
    reminderAt: {
      type: Date,
      index: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    subtasks: {
      type: [SubtaskSchema],
      default: [],
    },
    recurrence: {
      type: RecurrenceSchema,
      default: () => ({ type: 'none', interval: 1, daysOfWeek: [] }),
    },
    completedAt: {
      type: Date,
      default: null,
    },
    estimatedDuration: {
      type: Number,
      default: 0,
    },
    actualDuration: {
      type: Number,
      default: 0,
    },
    dependencies: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal querying
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, projectId: 1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ userId: 1, order: 1 });
TaskSchema.index({ title: 'text', description: 'text' });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
