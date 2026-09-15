import { HttpError } from 'http-errors';

export const errorHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.status).json({
      message: error.message,
    });
    return;
  }

  response.status(500).json({
    message: error.message,
  });
};
