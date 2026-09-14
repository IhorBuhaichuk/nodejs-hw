import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import pinoHttp from 'pino-http';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(pinoHttp());

app.get('/notes', (_request, response) => {
  response.status(200).json({
    message: 'Retrieved all notes',
  });
});

app.get('/notes/:noteId', (request, response) => {
  const { noteId } = request.params;

  response.status(200).json({
    message: `Retrieved note with ID: ${noteId}`,
  });
});

app.get('/test-error', () => {
  throw new Error('Simulated server error');
});

app.use((_request, response) => {
  response.status(404).json({
    message: 'Route not found',
  });
});

app.use((error, _request, response, _next) => {
  response.status(500).json({
    message: error.message,
  });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
