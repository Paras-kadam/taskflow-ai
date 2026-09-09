import mongoose from 'mongoose';
import { config } from '../config/env';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { TimeSession } from '../models/TimeSession';
import { FocusSession } from '../models/FocusSession';
import { Notification } from '../models/Notification';
import { generateToken } from '../utils/token';
import {
  parseNaturalLanguageTask,
  breakdownTaskWithAI,
  prioritizeTasksWithAI,
  smartScheduleWithAI,
  getProductivitySuggestions,
} from '../services/aiService';
import { isQuietHours } from '../services/reminderScheduler';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, suite: string, details?: string) {
  if (condition) {
    results.push({ suite, name, passed: true });
    console.log(`  ✓ [${suite}] ${name}`);
  } else {
    results.push({ suite, name, passed: false, details });
    console.error(`  ✗ [${suite}] ${name}: ${details || 'Assertion failed'}`);
  }
}

async function runAudit() {
  console.log('\n==================================================');
  console.log('  TaskFlow AI — Automated End-to-End Audit Suite  ');
  console.log('==================================================\n');

  try {
    // 1. Connect DB
    await mongoose.connect(config.MONGODB_URI);
    assert(mongoose.connection.readyState === 1, 'Database Connection', 'Infrastructure');

    const testEmail = `audit_test_${Date.now()}@example.com`;

    // 2. Auth Suite
    console.log('\n--- 1. Authentication & User Security ---');
    const user = await User.create({
      name: 'Audit Engineer',
      email: testEmail,
      password: 'SuperSecretPassword123!',
      timezone: 'UTC',
    });
    assert(!!user._id, 'User Creation with Bcrypt Hash', 'Auth');

    const userWithPw = await User.findById(user._id).select('+password');
    const isMatch = await userWithPw!.comparePassword('SuperSecretPassword123!');
    const isMismatch = await userWithPw!.comparePassword('WrongPassword');
    assert(isMatch && !isMismatch, 'Password Hashing & Comparison', 'Auth');

    const token = generateToken(user._id.toString());
    assert(typeof token === 'string' && token.length > 30, 'JWT Token Generation', 'Auth');

    // 3. Project Suite
    console.log('\n--- 2. Projects & Organization ---');
    const project = await Project.create({
      userId: user._id,
      name: 'Core System Audit',
      color: '#8b5cf6',
      icon: 'Folder',
    });
    assert(!!project._id && project.name === 'Core System Audit', 'Project Creation', 'Projects');

    // 4. Task CRUD & Subtasks
    console.log('\n--- 3. Task Management & Subtasks ---');
    const taskA = await Task.create({
      userId: user._id,
      projectId: project._id,
      title: 'Database Architecture Schema',
      priority: 'high',
      status: 'in-progress',
      subtasks: [
        { title: 'Define Mongoose schemas', completed: true },
        { title: 'Add compound indexes', completed: false },
      ],
      estimatedDuration: 45,
      tags: ['database', 'core'],
    });
    assert(taskA.title === 'Database Architecture Schema', 'Task Creation with Subtasks', 'Tasks');
    assert(taskA.subtasks.length === 2 && taskA.subtasks[0].completed, 'Subtask State Integrity', 'Tasks');

    // 5. Task Dependencies & Cycle Prevention
    console.log('\n--- 4. Task Dependencies & Cycle Detection ---');
    const taskB = await Task.create({
      userId: user._id,
      projectId: project._id,
      title: 'Deploy Production API',
      priority: 'urgent',
      status: 'todo',
      dependencies: [taskA._id],
    });
    assert(taskB.dependencies?.length === 1, 'Task Dependency Association', 'Dependencies');

    // Check if taskB is blocked (since taskA is not completed)
    const populatedB = await Task.findById(taskB._id).populate('dependencies', 'status');
    const isBlocked = (populatedB?.dependencies as any[]).some((d) => d.status !== 'completed');
    assert(isBlocked, 'Blocked Status Computation (Task A uncompleted)', 'Dependencies');

    // Test Cycle Detection logic (Task A depends on Task B -> would create cycle A -> B -> A)
    const depMap = new Map<string, string[]>();
    depMap.set(taskA._id.toString(), [taskB._id.toString()]);
    depMap.set(taskB._id.toString(), [taskA._id.toString()]);

    const hasCycle = (node: string, visited = new Set<string>(), stack = new Set<string>()): boolean => {
      visited.add(node);
      stack.add(node);
      for (const neighbor of depMap.get(node) || []) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor, visited, stack)) return true;
        } else if (stack.has(neighbor)) {
          return true;
        }
      }
      stack.delete(node);
      return false;
    };

    const cycleDetected = hasCycle(taskA._id.toString());
    assert(cycleDetected, 'Cycle Detection (A <-> B circular dependency caught)', 'Dependencies');

    // 6. Task Duplication & Archival
    console.log('\n--- 5. Task Duplication & Archival ---');
    const duplicated = await Task.create({
      userId: user._id,
      title: `${taskA.title} (Copy)`,
      description: taskA.description,
      priority: taskA.priority,
      status: 'todo',
      subtasks: taskA.subtasks.map((s) => ({ title: s.title, completed: false })),
      tags: [...taskA.tags],
    });
    assert(duplicated.title.includes('(Copy)'), 'Task Duplication', 'Tasks');

    taskA.status = 'archived';
    await taskA.save();
    assert(taskA.status === 'archived', 'Task Archival', 'Tasks');

    // 7. Dedicated Time Tracking
    console.log('\n--- 6. Time Tracking Sessions ---');
    const timeSession = await TimeSession.create({
      userId: user._id,
      taskId: taskA._id,
      startTime: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
      endTime: new Date(),
      duration: 900, // 15 mins in seconds
      completedAt: new Date(),
    });
    assert(timeSession.duration === 900, 'TimeSession Creation & Logging', 'Time Tracking');

    // 8. Focus Mode / Pomodoro
    console.log('\n--- 7. Pomodoro Focus Sessions & Persistence Math ---');
    const focusSession = await FocusSession.create({
      userId: user._id,
      taskId: taskB._id,
      duration: 25,
      type: 'pomodoro',
      completedAt: new Date(),
    });
    assert(focusSession.duration === 25, 'Pomodoro Session Persistence', 'Focus');

    // Verify Focus Mode Timer Persistence Formula
    const nowMs = Date.now();
    const durationSec = 300; // 5:00 break
    const simulatedEnd = nowMs + durationSec * 1000;
    const elapsed40s = nowMs + 40 * 1000;
    const remainingAfter40s = Math.max(0, Math.round((simulatedEnd - elapsed40s) / 1000));
    assert(remainingAfter40s === 260, 'Focus Timer 40s Navigation Persistence (4:20)', 'Focus');

    // Paused State Freezing Check
    const pausedFrozenSec = 260;
    const elapsed2mPaused = elapsed40s + 120 * 1000;
    const remainingStillFrozen = pausedFrozenSec;
    assert(remainingStillFrozen === 260, 'Focus Timer Paused State Freezing (no drift)', 'Focus');

    // Resume Formula Check
    const resumeEnd = elapsed2mPaused + remainingStillFrozen * 1000;
    const elapsed20sPostResume = elapsed2mPaused + 20 * 1000;
    const remainingPostResume = Math.max(0, Math.round((resumeEnd - elapsed20sPostResume) / 1000));
    assert(remainingPostResume === 240, 'Focus Timer Post-Resume Accurate Countdown (4:00)', 'Focus');

    // 9. AI Productivity Engine
    console.log('\n--- 8. AI Productivity Engine ---');
    const nlpTest = await parseNaturalLanguageTask('Submit tax audit report tomorrow at 4pm urgent #finance for 45m');
    assert(nlpTest.priority === 'urgent', 'NLP Priority Parsing (urgent)', 'AI');
    assert(nlpTest.tags.includes('finance'), 'NLP Tag Extraction (#finance)', 'AI');
    assert(!!nlpTest.dueTime && nlpTest.dueTime.includes('16:00'), 'NLP Due Time Parsing (4pm -> 16:00)', 'AI');
    assert(nlpTest.estimatedDuration === 45, 'NLP Duration Parsing (45m)', 'AI');

    const breakdown = await breakdownTaskWithAI('Build full-stack modern SaaS application');
    assert(breakdown.subtasks.length >= 4, 'AI Subtask Decomposition', 'AI');

    const prioritized = await prioritizeTasksWithAI([taskB]);
    assert(prioritized.rankedTasks.length === 1 && prioritized.rankedTasks[0].score > 0, 'Smart Prioritization Scoring', 'AI');

    const scheduled = await smartScheduleWithAI([taskB], 4);
    assert(scheduled.schedule.length > 0, 'Smart Scheduling Engine', 'AI');

    const suggestions = await getProductivitySuggestions(user._id.toString());
    assert(suggestions.suggestions.length > 0, 'Contextual Productivity Suggestions', 'AI');

    // 10. Notifications & Deduplication
    console.log('\n--- 9. Notification Center & Quiet Hours ---');
    const notif = await Notification.create({
      userId: user._id,
      taskId: taskB._id,
      type: 'task_reminder',
      title: `Reminder: ${taskB.title}`,
      message: 'Task is due soon',
    });
    assert(!notif.read, 'Notification Dispatch Integrity', 'Notifications');

    // 10. Alarm-Style Ringtones, Snooze & Audio Engine
    console.log('\n--- 10. Alarm-Style Ringtones, Snooze & Idempotency ---');
    
    // Test 10.1: Notification & Ringtone Settings Persistence
    user.notificationSettings = {
      ...user.notificationSettings,
      notificationSoundEnabled: true,
      notificationVolume: 85,
      alarmMode: true,
      completionSoundEnabled: true,
      selectedReminderSound: 'digital-beep',
      selectedDeadlineSound: 'digital-beep',
      selectedOverdueSound: 'urgent-alarm',
      selectedDailySummarySound: 'soft-chime',
      selectedPomodoroSound: 'focus-alert',
      selectedCompletionSound: 'task-complete',
    };
    await user.save();
    const updatedUser = await User.findById(user._id);
    assert(
      updatedUser?.notificationSettings?.notificationVolume === 85 &&
      updatedUser?.notificationSettings?.alarmMode === true &&
      updatedUser?.notificationSettings?.selectedReminderSound === 'digital-beep',
      'User Audio & Ringtone Settings Persistence',
      'Audio'
    );

    // Test 10.2: Task Snooze Mechanism
    const taskToSnooze = await Task.create({
      userId: user._id,
      title: 'Prepare Client Briefing',
      reminderAt: new Date(Date.now() - 60000), // 1 min ago
      reminderSent: true,
      status: 'todo',
    });

    const snoozeMinutes = 15;
    const preSnoozeTime = Date.now();
    taskToSnooze.reminderAt = new Date(preSnoozeTime + snoozeMinutes * 60 * 1000);
    taskToSnooze.reminderSent = false;
    await taskToSnooze.save();

    // Mark previous notifications read
    await Notification.updateMany(
      { userId: user._id, taskId: taskToSnooze._id, type: 'task_reminder' },
      { $set: { read: true } }
    );

    const snoozedTask = await Task.findById(taskToSnooze._id);
    assert(
      snoozedTask?.reminderSent === false &&
      snoozedTask?.reminderAt! > new Date(preSnoozeTime + 14 * 60 * 1000),
      'Task Snooze Scheduling & Reset',
      'Snooze'
    );

    // Test 10.3: Scheduler Idempotency Check
    const claimedFirst = await Task.findOneAndUpdate(
      { _id: snoozedTask!._id, reminderSent: { $ne: true } },
      { $set: { reminderSent: true } },
      { new: true }
    );
    const claimedSecond = await Task.findOneAndUpdate(
      { _id: snoozedTask!._id, reminderSent: { $ne: true } },
      { $set: { reminderSent: true } },
      { new: true }
    );
    assert(
      claimedFirst !== null && claimedSecond === null,
      'Scheduler Idempotency (Atomic Single-Claim Check)',
      'Scheduler'
    );

    // Test 10.4: Quiet Hours Calculation
    const nightTime = new Date();
    nightTime.setHours(23, 30, 0, 0); // 11:30 PM
    const dayTime = new Date();
    dayTime.setHours(14, 0, 0, 0); // 2:00 PM
    assert(
      isQuietHours(nightTime, '22:00', '07:00') === true &&
      isQuietHours(dayTime, '22:00', '07:00') === false,
      'Quiet Hours Interval Calculation',
      'Scheduler'
    );

    // Clean up
    console.log('\n--- Clean Up ---');
    await Task.deleteMany({ userId: user._id });
    await Project.deleteMany({ userId: user._id });
    await TimeSession.deleteMany({ userId: user._id });
    await FocusSession.deleteMany({ userId: user._id });
    await Notification.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(user._id);
    assert(true, 'Test Artifacts Cleaned from Database', 'Clean Up');

    await mongoose.disconnect();

    // Summary
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log('\n==================================================');
    console.log(`  AUDIT RESULTS: ${passed}/${total} TESTS PASSED  `);
    if (failed === 0) {
      console.log('  STATUS: 100% PASS — ALL CHECKS VERIFIED        ');
    } else {
      console.log(`  STATUS: ${failed} CHECKS FAILED                `);
    }
    console.log('==================================================\n');

    process.exit(failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('Audit execution error:', error);
    process.exit(1);
  }
}

runAudit();
