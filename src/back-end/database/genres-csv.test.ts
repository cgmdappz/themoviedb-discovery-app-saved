import { describe, expect, it } from 'vitest';
import { parseGenresCsv } from './genres-csv.ts';

describe('parseGenresCsv', () => {
  it('accepts BOM, CRLF, case-insensitive headers, reordered columns, quoted commas, and escaped quotes', () => {
    // Arrange: include the supported CSV variants in one representative input.
    const csv =
      '\uFEFFNAME,Id\r\n"Comedy, drama",35\r\n"The ""classic"" genre",18\r\n\r\n';

    // Act and assert
    expect(parseGenresCsv(csv)).toEqual([
      { id: 35, name: 'Comedy, drama' },
      { id: 18, name: 'The "classic" genre' },
    ]);
  });

  it('accepts LF input and ignores empty lines', () => {
    // Arrange
    const csv = 'id,name\n\n12,Aventure\n';

    // Act and assert
    expect(parseGenresCsv(csv)).toEqual([{ id: 12, name: 'Aventure' }]);
  });

  it.each([
    ['', /expected exactly/],
    ['id,name,extra\n1,Drama,x', /expected exactly/],
    ['id,id\n1,Drama', /expected exactly/],
    ['id,name\n0,Drama', /positive integer id/],
    ['id,name\n-1,Drama', /positive integer id/],
    ['id,name\n1.5,Drama', /positive integer id/],
    ['id,name\n9007199254740992,Drama', /positive integer id/],
    ['id,name\n1,   ', /empty name/],
    ['id,name\n1,"unfinished', /Invalid genres CSV/],
  ])('rejects invalid CSV input %s', (csv, error) => {
    // Arrange, act, and assert: invalid content is reported explicitly.
    expect(() => parseGenresCsv(csv)).toThrow(error);
  });
});
