import { Request, Response, NextFunction } from 'express';
import { Project } from '../models/Project';
import { Task } from '../models/Task';

export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const projects = await Project.find({ userId }).sort({ createdAt: -1 });

    // Calculate task counts per project
    const projectStats = await Task.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$projectId',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap: Record<string, { totalTasks: number; completedTasks: number }> = {};
    projectStats.forEach((stat) => {
      if (stat._id) {
        statsMap[stat._id.toString()] = {
          totalTasks: stat.totalTasks,
          completedTasks: stat.completedTasks,
        };
      }
    });

    const enrichedProjects = projects.map((p) => {
      const stats = statsMap[p._id.toString()] || { totalTasks: 0, completedTasks: 0 };
      const progress = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
      return {
        ...p.toObject(),
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        remainingTasks: stats.totalTasks - stats.completedTasks,
        progress,
      };
    });

    res.status(200).json({ projects: enrichedProjects });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const project = await Project.findOne({ _id: req.params.id, userId });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const tasks = await Task.find({ projectId: project._id, userId }).sort({ order: 1, createdAt: -1 });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Priority distribution
    const priorityDistribution = {
      urgent: tasks.filter((t) => t.priority === 'urgent').length,
      high: tasks.filter((t) => t.priority === 'high').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      low: tasks.filter((t) => t.priority === 'low').length,
      none: tasks.filter((t) => t.priority === 'none').length,
    };

    res.status(200).json({
      project: {
        ...project.toObject(),
        totalTasks,
        completedTasks,
        remainingTasks: totalTasks - completedTasks,
        progress,
        priorityDistribution,
      },
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { name, description, icon, color } = req.body;

    const project = await Project.create({
      userId,
      name,
      description,
      icon,
      color,
    });

    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { name, description, icon, color, status } = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { name, description, icon, color, status } },
      { new: true, runValidators: true }
    );

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    res.status(200).json({ project });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Unassign tasks from this project
    await Task.updateMany({ projectId: req.params.id, userId }, { $set: { projectId: null } });

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};
