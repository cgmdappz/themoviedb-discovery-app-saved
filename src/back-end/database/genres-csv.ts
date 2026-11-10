import { parse } from 'csv-parse/sync';
import type { Genre } from '../types/Genre.ts';

export function parseGenresCsv(contents: string): Genre[] {
  let records: string[][];
  try {
    records = parse(contents, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
    }) as string[][];
  } catch (error) {
    throw new Error('Invalid genres CSV: malformed CSV syntax.', {
      cause: error,
    });
  }

  const [header, ...rows] = records;
  if (!header || header.length !== 2) {
    throw new Error(
      'Invalid genres CSV: expected exactly the id and name columns.',
    );
  }

  const normalizedHeader = header.map((column) => column.toLowerCase());
  if (
    normalizedHeader.length !== 2 ||
    normalizedHeader[0] === normalizedHeader[1] ||
    !normalizedHeader.includes('id') ||
    !normalizedHeader.includes('name')
  ) {
    throw new Error(
      'Invalid genres CSV: expected exactly the id and name columns.',
    );
  }

  const idIndex = normalizedHeader.indexOf('id');
  const nameIndex = normalizedHeader.indexOf('name');

  return rows.map((row, index) => {
    const rawId = row[idIndex];
    const name = row[nameIndex]?.trim();
    if (!rawId || !/^[0-9]+$/.test(rawId)) {
      throw new Error(
        `Invalid genres CSV: row ${index + 2} has an invalid positive integer id.`,
      );
    }

    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error(
        `Invalid genres CSV: row ${index + 2} has an invalid positive integer id.`,
      );
    }
    if (!name) {
      throw new Error(
        `Invalid genres CSV: row ${index + 2} has an empty name.`,
      );
    }

    return { id, name };
  });
}
