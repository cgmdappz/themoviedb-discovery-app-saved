import { parse } from 'csv-parse/sync';
import type { Country } from '../types/Country.ts';

export function parseCountriesCsv(contents: string): Country[] {
  let records: string[][];
  try {
    records = parse(contents, {
      bom: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: false,
    }) as string[][];
  } catch (error) {
    throw new Error('Invalid countries CSV: malformed CSV syntax.', {
      cause: error,
    });
  }

  const [header, ...rows] = records;
  if (!header || header.length !== 2) {
    throw new Error(
      'Invalid countries CSV: expected exactly the code and name columns.',
    );
  }

  const normalizedHeader = header.map((column) => column.toLowerCase());
  if (
    normalizedHeader[0] === normalizedHeader[1] ||
    !normalizedHeader.includes('code') ||
    !normalizedHeader.includes('name')
  ) {
    throw new Error(
      'Invalid countries CSV: expected exactly the code and name columns.',
    );
  }

  const codeIndex = normalizedHeader.indexOf('code');
  const nameIndex = normalizedHeader.indexOf('name');

  return rows.map((row, index) => {
    const code = row[codeIndex]?.trim();
    const name = row[nameIndex]?.trim();
    if (!code || !/^[A-Z]{2}$/.test(code)) {
      throw new Error(
        `Invalid countries CSV: row ${index + 2} must have a two-letter uppercase country code.`,
      );
    }
    if (!name) {
      throw new Error(
        `Invalid countries CSV: row ${index + 2} has an empty name.`,
      );
    }
    return { code, name };
  });
}
