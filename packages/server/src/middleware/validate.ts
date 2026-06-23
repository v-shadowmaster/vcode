import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export interface RequestSchemas {
  readonly body?: ZodType;
  readonly query?: ZodType;
  readonly params?: ZodType;
}

/**
 * Validates and coerces request input against the given Zod schemas. A failed
 * parse throws a ZodError that the central error handler turns into a 400.
 */
export const validate =
  (schemas: RequestSchemas): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.params) schemas.params.parse(req.params);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) {
        // req.query is a getter-only property in Express 5, so redefine it with
        // the coerced result instead of assigning.
        Object.defineProperty(req, 'query', {
          value: schemas.query.parse(req.query),
          writable: true,
          configurable: true,
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
