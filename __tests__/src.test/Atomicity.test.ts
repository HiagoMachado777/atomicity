import knex from 'knex';
import Atomicity from '../../src/Atomicity';

jest.mock('knex');

describe('Atomicity class should exists', () => {

  test('It need to be a class ( where typeof is function )', () => {
    expect(typeof Atomicity).toBe('function');
  })

})

describe('An error will be thrown with the message "At least one database is required to start a transaction" if:', () => {

  test('Atomicity was initialized with no params', () => { 
    expect((): any => new Atomicity('')).toThrow('At least one database is required to start a transaction');
  })


  test('Atomicity was initialized with an object whose all valid properties have falsy values', () => {
    expect((): any => new Atomicity({ someRandomProp: true, mysql: false })).toThrow('At least one database is required to start a transaction');
  })

  test('Atomicity was initialized with anything but a valid object', () => {

    const invalidParams: any = new Set([ 0, 1, '0', '2', [ 1 ], undefined, null, true, false, [], {}, '' ])
    
    for (const invalidParam of invalidParams) {
      expect((): any => new Atomicity(invalidParam)).toThrow('At least one database is required to start a transaction');
    }
  })

})

describe.only('An invalid connection error will be thrown if:', () =>{

  const invalidKnexConnection: object = knex({client: 'invalid'});

  const invalidMongooseConnection: object = {
    connections: [
      {
        base: [
          {
            connections: [
              { client: undefined }
            ]
          }
        ]
      }
    ]
  }
  
  test('An invalid knex MySQL connection is passed', () => {
    expect((): any => new Atomicity({ mysql: invalidKnexConnection })).toThrow('Invalid knex MySQL connection')
  })

  test('An invalid knex SQLServer connection is passed', () => {
    expect((): any => new Atomicity({ sqlServer: invalidKnexConnection })).toThrow('Invalid knex SQLServer connection')
  })

  test('An invalid knex PostgreSQL connection is passed', () => {
    expect((): any => new Atomicity({ postgreSql: invalidKnexConnection })).toThrow('Invalid knex PostgreSQL connection')
  })

  test('An invalid mongoose connection is passed', () => {
    expect((): any => new Atomicity({ mongoDb: invalidMongooseConnection })).toThrow('Invalid mongoose connection')
  })

})

