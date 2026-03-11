import { describe, expect, it } from 'vitest';
import { detectGraphQL } from './detectGraphQL';

describe('detectGraphQL', () => {
  it('returns undefined for non-object body', () => {
    expect(detectGraphQL(null)).toBeUndefined();
    expect(detectGraphQL(undefined)).toBeUndefined();
    expect(detectGraphQL('string')).toBeUndefined();
    expect(detectGraphQL(42)).toBeUndefined();
  });

  it('returns undefined for arrays', () => {
    expect(detectGraphQL([{ query: '{ hello }' }])).toBeUndefined();
  });

  it('returns undefined if no query field', () => {
    expect(detectGraphQL({ foo: 'bar' })).toBeUndefined();
  });

  it('returns undefined if query is not a string', () => {
    expect(detectGraphQL({ query: 123 })).toBeUndefined();
  });

  it('detects a query operation', () => {
    const result = detectGraphQL({ query: '{ countries { name } }' });
    expect(result).toEqual({
      operationType: 'query',
      operationName: undefined,
    });
  });

  it('detects a query with "query" keyword', () => {
    const result = detectGraphQL({
      query: 'query GetCountries { countries { name } }',
    });
    expect(result).toEqual({
      operationType: 'query',
      operationName: undefined,
    });
  });

  it('detects a mutation', () => {
    const result = detectGraphQL({
      query: 'mutation CreateUser { createUser { id } }',
    });
    expect(result).toEqual({
      operationType: 'mutation',
      operationName: undefined,
    });
  });

  it('detects mutation with leading whitespace', () => {
    const result = detectGraphQL({ query: '  mutation Foo { bar }' });
    expect(result).toEqual({
      operationType: 'mutation',
      operationName: undefined,
    });
  });

  it('extracts operationName when present', () => {
    const result = detectGraphQL({
      query: 'query GetCountries { countries { name } }',
      operationName: 'GetCountries',
    });
    expect(result).toEqual({
      operationType: 'query',
      operationName: 'GetCountries',
    });
  });

  it('ignores non-string operationName', () => {
    const result = detectGraphQL({
      query: '{ hello }',
      operationName: 123,
    });
    expect(result).toEqual({
      operationType: 'query',
      operationName: undefined,
    });
  });
});
