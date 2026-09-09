import mongoose from 'mongoose';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { Tag } from '../models/Tag';
import { config } from '../config/env';

export async function seedDatabase() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log(`Connected to MongoDB at ${config.MONGODB_URI}`);

    // Check if demo user exists
    const demoEmail = 'demo@taskflow.ai';
    let user = await User.findOne({ email: demoEmail });

    if (user) {
      console.log(`Demo user already exists: ${demoEmail}`);
    } else {
      user = await User.create({
        name: 'Demo User',
        email: demoEmail,
        password: 'password123',
        timezone: 'UTC',
        theme: 'dark',
        notificationSettings: {
          taskReminders: true,
          dueDateNotifications: true,
          overdueNotifications: true,
          recurringTaskNotifications: true,
          dailySummary: true,
          weeklyReport: true,
          defaultReminder: '15min',
          dailySummaryTime: '08:00',
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
          notificationSoundEnabled: true,
          notificationVolume: 80,
          alarmMode: false,
          completionSoundEnabled: true,
          selectedReminderSound: 'classic-bell',
          selectedDeadlineSound: 'digital-beep',
          selectedOverdueSound: 'urgent-alarm',
          selectedDailySummarySound: 'soft-chime',
          selectedPomodoroSound: 'focus-alert',
          selectedCompletionSound: 'task-complete',
        },
      });
      console.log(`✓ Created demo user: ${demoEmail} / password123`);

      // Create initial projects
      const workProject = await Project.create({
        userId: user._id,
        name: 'Work & SaaS',
        color: '#8b5cf6',
        description: 'Product roadmap and development sprints',
      });

      const personalProject = await Project.create({
        userId: user._id,
        name: 'Personal',
        color: '#10b981',
        description: 'Personal goals, errands, and fitness',
      });

      // Create tags
      const urgentTag = await Tag.create({ userId: user._id, name: 'urgent', color: '#ef4444' });
      const devTag = await Tag.create({ userId: user._id, name: 'dev', color: '#3b82f6' });
      const healthTag = await Tag.create({ userId: user._id, name: 'health', color: '#10b981' });

      // Create sample tasks
      const today = new Date();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await Task.create([
        {
          userId: user._id,
          title: 'Complete DBMS Assignment and verify SQL queries',
          description: 'Review normalization up to BCNF and test queries on PostgreSQL',
          priority: 'high',
          status: 'todo',
          dueDate: today,
          dueTime: '20:00',
          projectId: workProject._id,
          tags: ['dev', 'urgent'],
          subtasks: [
            { title: 'Read BCNF lecture notes', completed: true },
            { title: 'Write query 1-5', completed: false },
            { title: 'Submit PDF to LMS', completed: false },
          ],
        },
        {
          userId: user._id,
          title: 'Morning 25-minute Deep Focus Session',
          description: 'Review system architecture and prioritize backlog',
          priority: 'urgent',
          status: 'todo',
          dueDate: today,
          dueTime: '09:00',
          projectId: workProject._id,
          tags: ['urgent'],
        },
        {
          userId: user._id,
          title: 'Weekly Grocery Shopping & Meal Prep',
          priority: 'medium',
          status: 'todo',
          dueDate: tomorrow,
          projectId: personalProject._id,
          tags: ['health'],
        },
        {
          userId: user._id,
          title: 'Set up TaskFlow AI Production Deployment',
          priority: 'high',
          status: 'completed',
          dueDate: today,
          completedAt: new Date(),
          projectId: workProject._id,
          tags: ['dev'],
        },
      ]);

      console.log('✓ Created initial projects, tags, and sample tasks.');
    }

    // List all users in database
    const allUsers = await User.find({}, 'name email createdAt');
    console.log('\n--- Current Registered Users in MongoDB ---');
    allUsers.forEach((u, i) => {
      console.log(`${i + 1}. Name: ${u.name} | Email: ${u.email}`);
    });
    console.log('-------------------------------------------\n');

    await mongoose.disconnect();
    console.log('Seed completed successfully.');
  } catch (error: any) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}
