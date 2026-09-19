import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import bcrypt from 'bcrypt';
import handlebars from 'handlebars';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';

const RESET_EMAIL_SUCCESS_MESSAGE = 'Password reset email sent successfully';
const RESET_EMAIL_TEMPLATE_PATH = resolve(
  'src/templates/reset-password-email.html',
);

const clearSessionCookies = (response) => {
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  };

  response.clearCookie('sessionId', cookieOptions);
  response.clearCookie('accessToken', cookieOptions);
  response.clearCookie('refreshToken', cookieOptions);
};

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
      await Session.deleteOne({ _id: session._id });
      clearSessionCookies(response);
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

    clearSessionCookies(response);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const requestResetEmail = async (request, response, next) => {
  try {
    const { email } = request.body;
    const user = await User.findOne({ email });

    if (!user) {
      response.status(200).json({
        message: RESET_EMAIL_SUCCESS_MESSAGE,
      });
      return;
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '15m',
      },
    );
    const templateSource = await readFile(RESET_EMAIL_TEMPLATE_PATH, 'utf8');
    const template = handlebars.compile(templateSource);
    const frontendDomain = process.env.FRONTEND_DOMAIN.replace(/\/$/, '');
    const resetLink = `${frontendDomain}/reset-password?token=${encodeURIComponent(token)}`;
    const html = template({
      name: user.username,
      resetLink,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        html,
      });
    } catch {
      throw createHttpError(
        500,
        'Failed to send the email, please try again later.',
      );
    }

    response.status(200).json({
      message: RESET_EMAIL_SUCCESS_MESSAGE,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (request, response, next) => {
  try {
    const { token, password } = request.body;
    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw createHttpError(401, 'Invalid or expired token');
    }

    if (typeof payload !== 'object' || !payload.sub || !payload.email) {
      throw createHttpError(401, 'Invalid or expired token');
    }

    const user = isValidObjectId(payload.sub)
      ? await User.findOne({
          _id: payload.sub,
          email: payload.email,
        })
      : null;

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    response.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
