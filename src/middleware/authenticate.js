import createHttpError from 'http-errors';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';

export const authenticate = async (request, _response, next) => {
  try {
    const { accessToken } = request.cookies;

    if (!accessToken) {
      throw createHttpError(401, 'Missing access token');
    }

    const session = await Session.findOne({ accessToken });

    if (!session) {
      throw createHttpError(401, 'Session not found');
    }

    if (session.accessTokenValidUntil.getTime() < Date.now()) {
      throw createHttpError(401, 'Access token expired');
    }

    const user = await User.findById(session.userId);

    if (!user) {
      throw createHttpError(401);
    }

    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
