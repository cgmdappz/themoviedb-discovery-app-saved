import { describe, expect, it } from 'vitest';
import { parseCountriesCsv } from './countries-csv.ts';

describe('parseCountriesCsv', () => {
  it('accepts BOM, CRLF, case-insensitive reordered headers, whitespace, commas, and escaped quotes', () => {
    // Arrange
    const csv =
      '\uFEFFNAME,Code\r\n" United States, America ", US \r\n "The ""United"" Kingdom",GB\r\n\r\n';

    // Act and assert
    expect(parseCountriesCsv(csv)).toEqual([
      { code: 'US', name: 'United States, America' },
      { code: 'GB', name: 'The "United" Kingdom' },
    ]);
  });

  it('accepts LF input and skips blank lines', () => {
    // Arrange
    const csv = 'code,name\n\nFR,France\n';

    // Act and assert
    expect(parseCountriesCsv(csv)).toEqual([{ code: 'FR', name: 'France' }]);
  });

  it('returns an empty list for a header-only document', () => {
    // Arrange, act, and assert
    expect(parseCountriesCsv('code,name\r\n')).toEqual([]);
  });

  it.each([
    ['', /expected exactly/],
    ['code,name,other\nFR,France,x', /expected exactly/],
    ['code,code\nFR,France', /expected exactly/],
    ['code,name\nfr,France', /two-letter uppercase/],
    ['code,name\nFRA,France', /two-letter uppercase/],
    ['code,name\nF1,France', /two-letter uppercase/],
    ['code,name\n ,France', /two-letter uppercase/],
    ['code,name\nFR,  ', /empty name/],
    ['code,name\nFR,"unfinished', /malformed CSV/],
  ])('rejects invalid CSV input %s', (csv, error) => {
    // Arrange, act, and assert
    expect(() => parseCountriesCsv(csv)).toThrow(error);
  });
});
