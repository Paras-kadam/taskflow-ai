import { Request, Response, NextFunction } from 'express';
import { Tag } from '../models/Tag';
import { Task } from '../models/Task';

export const getTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const tags = await Tag.find({ userId }).sort({ name: 1 });

    // Task count per tag
    const tasks = await Task.find({ userId }, 'tags');
    const tagCountMap: Record<string, number> = {};
    tasks.forEach((t) => {
      t.tags?.forEach((tagName) => {
        tagCountMap[tagName] = (tagCountMap[tagName] || 0) + 1;
      });
    });

    const enrichedTags = tags.map((tag) => ({
      ...tag.toObject(),
      taskCount: tagCountMap[tag.name] || 0,
    }));

    res.status(200).json({ tags: enrichedTags });
  } catch (error) {
    next(error);
  }
};

export const createTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { name, color } = req.body;
    const cleanName = name.trim().replace(/^#/, '');

    let tag = await Tag.findOne({ userId, name: cleanName });
    if (tag) {
      res.status(200).json({ tag });
      return;
    }

    tag = await Tag.create({
      userId,
      name: cleanName,
      color: color || '#8b5cf6',
    });

    res.status(201).json({ tag });
  } catch (error) {
    next(error);
  }
};

export const deleteTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const tag = await Tag.findOneAndDelete({ _id: req.params.id, userId });

    if (!tag) {
      res.status(404).json({ message: 'Tag not found' });
      return;
    }

    // Remove tag from user's tasks
    await Task.updateMany({ userId }, { $pull: { tags: tag.name } });

    res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (error) {
    next(error);
  }
};
