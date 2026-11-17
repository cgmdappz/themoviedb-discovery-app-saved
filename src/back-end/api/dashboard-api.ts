import type { Express, Request, Response } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../database/schema';

export type OpenDashboardDatabase = () => DatabaseSync;

export function registerDashboardApi(
  app: Express,
  openDatabase: OpenDashboardDatabase = getDatabase,
): void {
  app.get(
    '/api/dashboard/movies/count',
    (_req: Request, res: Response): void => {
      let database: DatabaseSync | undefined;
      try {
        database = openDatabase();
        const result = database
          .prepare('SELECT COUNT(*) AS count FROM movies')
          .get() as { count: number };
        res.json({ count: result.count });
      } catch (error) {
        console.error('Error fetching movies in database:', error);
        res.status(500).json({
          error: 'Failed to fetch movies in database',
        });
      } finally {
        database?.close();
      }
    },
  );
}
