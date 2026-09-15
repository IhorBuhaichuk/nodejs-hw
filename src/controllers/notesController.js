import createHttpError from 'http-errors';
import { Note } from '../models/note.js';

export const getAllNotes = async (request, response, next) => {
  try {
    const { page, perPage, tag, search } = request.query;
    const filter = {};

    if (tag) {
      filter.tag = tag;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * perPage;
    const [totalNotes, notes] = await Promise.all([
      Note.countDocuments(filter),
      Note.find(filter).skip(skip).limit(perPage),
    ]);
    const totalPages = Math.ceil(totalNotes / perPage);

    response.status(200).json({
      page,
      perPage,
      totalNotes,
      totalPages,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (request, response, next) => {
  try {
    const { noteId } = request.params;
    const note = await Note.findById(noteId);

    if (!note) {
      throw createHttpError(404, 'Note not found');
    }

    response.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

export const createNote = async (request, response, next) => {
  try {
    const note = await Note.create(request.body);
    response.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (request, response, next) => {
  try {
    const { noteId } = request.params;
    const note = await Note.findByIdAndDelete(noteId);

    if (!note) {
      throw createHttpError(404, 'Note not found');
    }

    response.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (request, response, next) => {
  try {
    const { noteId } = request.params;
    const note = await Note.findByIdAndUpdate(noteId, request.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!note) {
      throw createHttpError(404, 'Note not found');
    }

    response.status(200).json(note);
  } catch (error) {
    next(error);
  }
};
