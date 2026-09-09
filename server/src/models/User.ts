import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar: string;
  timezone: string;
  theme: 'dark' | 'light' | 'system';
  notificationSettings: {
    taskReminders: boolean;
    dueDateNotifications: boolean;
    overdueNotifications: boolean;
    recurringTaskNotifications: boolean;
    dailySummary: boolean;
    weeklyReport: boolean;
    defaultReminder: string;
    dailySummaryTime: string;
    quietHoursStart: string;
    quietHoursEnd: string;
    notificationSoundEnabled?: boolean;
    notificationVolume?: number;
    alarmMode?: boolean;
    completionSoundEnabled?: boolean;
    selectedReminderSound?: string;
    selectedDeadlineSound?: string;
    selectedOverdueSound?: string;
    selectedDailySummarySound?: string;
    selectedPomodoroSound?: string;
    selectedCompletionSound?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    theme: {
      type: String,
      enum: ['dark', 'light', 'system'],
      default: 'dark',
    },
    notificationSettings: {
      taskReminders: { type: Boolean, default: true },
      dueDateNotifications: { type: Boolean, default: true },
      overdueNotifications: { type: Boolean, default: true },
      recurringTaskNotifications: { type: Boolean, default: true },
      dailySummary: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
      defaultReminder: { type: String, default: '15min' },
      dailySummaryTime: { type: String, default: '08:00' },
      quietHoursStart: { type: String, default: '22:00' },
      quietHoursEnd: { type: String, default: '07:00' },
      notificationSoundEnabled: { type: Boolean, default: true },
      notificationVolume: { type: Number, default: 80, min: 0, max: 100 },
      alarmMode: { type: Boolean, default: false },
      completionSoundEnabled: { type: Boolean, default: true },
      selectedReminderSound: { type: String, default: 'classic-bell' },
      selectedDeadlineSound: { type: String, default: 'digital-beep' },
      selectedOverdueSound: { type: String, default: 'urgent-alarm' },
      selectedDailySummarySound: { type: String, default: 'soft-chime' },
      selectedPomodoroSound: { type: String, default: 'focus-alert' },
      selectedCompletionSound: { type: String, default: 'task-complete' },
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
