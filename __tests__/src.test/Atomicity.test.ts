import Atomicity from '../../src/Atomicity';

describe('Atomicity class should exists', () => {

  test('It need to be a class ( where typeof is function )', () => {
    expect(typeof Atomicity).toBe('function');
  })

})


describe('An error will be thrown with the message "At least one database is required to start a transaction" if:', () => {

  test('Atomicity was initialized with no params', () => {
    expect(new Atomicity()).toThrowError(new Error('At least one database is required to start a transaction'));
  })

  test('Atomicity was initilized with an empty object', () => {
    expect(new Atomicity({})).toThrowError(new Error('At least one database is required to start a transaction'))
  })

  test('Atomicity was initialized with an object whose all valid properties have falsy values', () => {
    expect(new Atomicity())
  })

})