import { DatabaseSync } from 'node:sqlite';
import type {
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../database/schema', async (importOriginal) => {
  const schema = await importOriginal<typeof import('../database/schema')>();
  return {
    ...schema,
    getDatabase: vi.fn(),
  };
});

import { getDatabase, initializeSchema } from '../database/schema';
import { registerDashboardApi } from './dashboard-api';

const databases: Array<{
  database: DatabaseSync;
  close: ReturnType<typeof vi.spyOn>;
}> = [];

afterEach(() => {
  for (const { database, close } of databases.splice(0)) {
    close.mockRestore();
    database.close();
  }
  vi.restoreAllMocks();
});

function createDatabase(initialize = true): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  if (initialize) initializeSchema(database);
  const close = vi.spyOn(database, 'close').mockImplementation(() => {});
  databases.push({ database, close });
  return database;
}

function captureHandler(openDatabase?: () => DatabaseSync): RequestHandler {
  let handler: RequestHandler | undefined;
  const app = {
    get: (path: string, routeHandler: RequestHandler) => {
      expect(path).toBe('/api/dashboard/movies/count');
      handler = routeHandler;
    },
  } as unknown as Express;

  if (openDatabase) {
    registerDashboardApi(app, openDatabase);
  } else {
    registerDashboardApi(app);
  }
  if (!handler) throw new Error('Dashboard movies route was not registered');
  return handler;
}

function createResponse(): Response & {
  json: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
} {
  const response = {
    json: vi.fn(),
    status: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response as unknown as Response & typeof response;
}

function invokeRoute(handler: RequestHandler, response: Response): void {
  handler({} as Request, response, vi.fn() as NextFunction);
}

describe('GET /api/dashboard/movies/count', () => {
  it('uses the default database connection when no factory is provided', () => {
    const database = createDatabase();
    vi.mocked(getDatabase).mockReturnValueOnce(database);
    const handler = captureHandler();
    const response = createResponse();

    invokeRoute(handler, response);

    expect(getDatabase).toHaveBeenCalledOnce();
    expect(response.json).toHaveBeenCalledWith({ count: 0 });
    expect(databases[0]?.close).toHaveBeenCalledOnce();
  });

  it('returns zero for an initialized database with no movies and closes it', () => {
    const database = createDatabase();
    const handler = captureHandler(() => database);
    const response = createResponse();

    invokeRoute(handler, response);

    expect(response.json).toHaveBeenCalledWith({ count: 0 });
    expect(
      database.prepare('SELECT COUNT(*) AS count FROM movies').get(),
    ).toEqual({ count: 0 });
    expect(databases[0]?.close).toHaveBeenCalledOnce();
  });

  it('returns the number of stored movies and closes the database', () => {
    const database = createDatabase();
    database
      .prepare(`
        INSERT INTO movies (
          id, title, original_title, original_language, overview, collected_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(1, 'Film one', 'Film one', 'en', '', '2026-11-17');
    database
      .prepare(`
        INSERT INTO movies (
          id, title, original_title, original_language, overview, collected_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(2, 'Film two', 'Film two', 'fr', '', '2026-11-17');
    const handler = captureHandler(() => database);
    const response = createResponse();

    invokeRoute(handler, response);

    expect(response.json).toHaveBeenCalledWith({ count: 2 });
    expect(databases[0]?.close).toHaveBeenCalledOnce();
  });

  it('logs database errors and returns HTTP 500 while closing an opened connection', () => {
    const database = createDatabase(false);
    const handler = captureHandler(() => database);
    const response = createResponse();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    invokeRoute(handler, response);

    expect(error).toHaveBeenCalledOnce();
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Failed to fetch movies in database',
    });
    expect(databases[0]?.close).toHaveBeenCalledOnce();
  });

  it('returns HTTP 500 when opening the database fails', () => {
    const openError = new Error('Database unavailable');
    const handler = captureHandler(() => {
      throw openError;
    });
    const response = createResponse();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    invokeRoute(handler, response);

    expect(error).toHaveBeenCalledWith(
      'Error fetching movies in database:',
      openError,
    );
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Failed to fetch movies in database',
    });
  });
});
