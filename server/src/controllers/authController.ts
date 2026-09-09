import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { generateToken, setTokenCookie, clearTokenCookie } from '../utils/token';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const token = generateToken(user.id);
    setTokenCookie(res, token);

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        timezone: user.timezone,
        theme: user.theme,
        notificationSettings: user.notificationSettings,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user.id);
    setTokenCookie(res, token);

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        timezone: user.timezone,
        theme: user.theme,
        notificationSettings: user.notificationSettings,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    clearTokenCookie(res);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        timezone: user.timezone,
        theme: user.theme,
        notificationSettings: user.notificationSettings,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { name, avatar, timezone, theme, notificationSettings } = req.body;

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (timezone) user.timezone = timezone;
    if (theme) user.theme = theme;
    if (notificationSettings) {
      user.notificationSettings = {
        ...user.notificationSettings,
        ...notificationSettings,
      };
    }

    const updatedUser = await user.save();

    res.status(200).json({
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        timezone: updatedUser.timezone,
        theme: updatedUser.theme,
        notificationSettings: updatedUser.notificationSettings,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
