import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const updateUserAvatar = async (request, response, next) => {
  try {
    if (!request.file) {
      throw createHttpError(400, 'No file');
    }

    const result = await saveFileToCloudinary(
      request.file.buffer,
      request.user._id,
    );

    const user = await User.findByIdAndUpdate(
      request.user._id,
      {
        avatar: result.secure_url,
      },
      {
        returnDocument: 'after',
      },
    );

    response.status(200).json({
      url: user.avatar,
    });
  } catch (error) {
    next(error);
  }
};
