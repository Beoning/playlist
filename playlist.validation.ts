import { body } from 'express-validator';

export const playlistTitleValidationSchema = body('title')
    .trim()
    .matches('^[a-zA-Z0-9\'!#$%&*+=?^_`{|}"~.-»№;%:?*,()<>-\\s]{1,64}$')
    .withMessage('Title is not valid')
    .isLength({ min: 1 })
    .withMessage('Must be 1 characters or more')
    .isLength({ max: 64 })
    .withMessage('Must be 64 characters or less');

export const playlistDescriptionValidationSchema = body('description')
    .trim()
    .matches('^[a-zA-Z0-9\'!#$%&*+=?^_`{|}"~.-»№;%:?*,()<>-\\s]{0,255}$')
    .withMessage('Description is not valid')
    .isLength({ max: 255 })
    .withMessage('Must be 255 characters or less')
    .optional();
