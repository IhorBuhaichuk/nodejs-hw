import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { isValidObjectId } from 'mongoose';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';
import { createSession, setSessionCookies } from '../services/auth.js';

export const registerUser = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw createHttpError(400, 'Email in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
    });
    const session = await createSession(user._id);

    setSessionCookies(response, session);
    response.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw createHttpError(401, 'Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      throw createHttpError(401, 'Invalid credentials');
    }

    await Session.deleteMany({ userId: user._id });
    const session = await createSession(user._id);

    setSessionCookies(response, session);
    response.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const refreshUserSession = async (request, response, next) => {
  try {
    const { sessionId, refreshToken } = request.cookies;

    if (!sessionId || !refreshToken || !isValidObjectId(sessionId)) {
      throw createHttpError(401, 'Session not found');
    }

    const session = await Session.findOne({
      _id: sessionId,
      refreshToken,
    });

    if (!session) {
      throw createHttpError(401, 'Session not found');
    }

    if (session.refreshTokenValidUntil.getTime() < Date.now()) {
      throw createHttpError(401, 'Session token expired');
    }

    await Session.deleteOne({ _id: session._id });
    const newSession = await createSession(session.userId);

    setSessionCookies(response, newSession);
    response.status(200).json({
      message: 'Session refreshed',
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (request, response, next) => {
  try {
    const { sessionId } = request.cookies;

    if (sessionId && isValidObjectId(sessionId)) {
      await Session.deleteOne({ _id: sessionId });
    }

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    };

    response.clearCookie('sessionId', cookieOptions);
    response.clearCookie('accessToken', cookieOptions);
    response.clearCookie('refreshToken', cookieOptions);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};
