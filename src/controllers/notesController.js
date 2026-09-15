import createHttpError from 'http-errors';
import { Note } from '../models/note.js';

export const getAllNotes = async (_request, response, next) => {
  try {
    const notes = await Note.find();
    response.status(200).json(notes);
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
      new: true,
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
