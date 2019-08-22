import knex from 'knex';
import mongoose from 'mongoose';
import Atomicity from '../../src/Atomicity';

jest.mock('knex');
jest.mock('mongoose');

afterEach(() => {    
  jest.clearAllMocks();
});

const mongooseFakeSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn()
}

const mongooseFakeCon = {
  startSession: jest.fn().mockReturnValue(mongooseFakeSession),
  connections: [
    {
      base: {
        connections: [
          { client: {} }
        ]
      }
    }
  ]
}

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

describe('An invalid connection error will be thrown if:', () =>{

  const invalidKnexConnection: object = knex({client: 'invalid'});

  const invalidMongooseConnection = mongoose;
  
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

describe('An Atomicity instance is correctly initialized when: ', () => {

  test('Will not return de not configurated instance error', () => {

    const atomic = new Atomicity({
      mongoDb: mongooseFakeCon, 
      mysql: knex({client: 'mysql'}),
      postgreSql: knex({client: 'pg'})
    })

    expect(() => atomic.transact(() => {})).not.toThrow('Atomicity instance is not configurated yet');
  })

})

describe('Test Atomicity strategy choice to different connections configurations', () => {

  test('When only one knex connection is configured the strategy should be simpleRelationalTransaction', async () => {

    const fakeKnex = knex({client: 'mysql'})

    const callback = jest.fn();

    const atomic = new Atomicity({ 
      mysql: fakeKnex
    })

    const simpleRelationalTransactionSpy = jest.spyOn(Atomicity.prototype as any, 'simpleRelationalTransaction');

    await atomic.transact(callback);

    expect(simpleRelationalTransactionSpy).toBeCalled();
    expect(fakeKnex.transaction).toBeCalled();
    expect(callback).toBeCalled();

  })

  test('When only the mongoose connection is configured the strategy should be simpleMongoTransaction', async () => {

    const callback = jest.fn();

    const atomic = new Atomicity({
      mongoDb: mongooseFakeCon
    })

    const simpleMongoTransactionSpy = jest.spyOn(Atomicity.prototype as any, 'simpleMongoTransaction');

    await atomic.transact(callback);

    expect(simpleMongoTransactionSpy).toBeCalled();
    expect(mongooseFakeCon.startSession).toBeCalled();
    expect(mongooseFakeSession.startTransaction).toBeCalled();
    expect(callback).toBeCalled();
    expect(mongooseFakeSession.commitTransaction).toBeCalled();

  })

  test('When just multiple knex connections are configured the strategy should be atomize running just relational transactions', async() => {

    const fakeKnexMysql = knex({ client: 'mysql' });
    const fakeKnexPg = knex({ client: 'pg' });

    const callback = jest.fn();

    const atomic = new Atomicity({ 
      mysql: fakeKnexMysql,
      postgreSql: fakeKnexPg
    });

    const atomizeSpy = jest.spyOn(Atomicity.prototype as any, 'atomize');

    await atomic.transact(callback);

    expect(atomizeSpy).toBeCalledTimes(2);
    expect(atomizeSpy).toHaveBeenNthCalledWith(1, { relationalsToTransact: [ 'MySQL', 'PostgreSQL' ] }, callback);
    expect(fakeKnexMysql.transaction).toBeCalled();
    expect(atomizeSpy).toHaveBeenNthCalledWith(2, { relationalsToTransact: [ 'PostgreSQL' ], isChildrenTransaction: true }, callback);
    expect(fakeKnexPg.transaction).toBeCalled();
    expect(callback).toBeCalled();

  })

  test('When one knex connection and one mongoose connection are configurated the strategy should be atomize running a relational and a mongo transaction', async () =>  {
    const fakeKnexMysql = knex({ client: 'mysql' });

    const callback = jest.fn();

    const atomic = new Atomicity({
      mysql: fakeKnexMysql,
      mongoDb: mongooseFakeCon
    })

    const atomizeSpy = jest.spyOn(Atomicity.prototype as any, 'atomize');

    await atomic.transact(callback);

    expect(atomizeSpy).toBeCalledTimes(1);
    expect(atomizeSpy).toBeCalledWith({ relationalsToTransact: [ 'MySQL' ], isTransactingWithMongo: true }, callback);
    expect(fakeKnexMysql.transaction).toBeCalled();
    expect(mongooseFakeCon.startSession).toBeCalled();
    expect(mongooseFakeSession.startTransaction).toBeCalled();
    expect(mongooseFakeSession.commitTransaction).toBeCalled();
  })

  test('When multiple knex connections and one mongoose connection are configurated the strategy should be atomize running multiple relationals transactions and a mongo transaction', async () =>  {
    const fakeKnexMysql = knex({ client: 'mysql' });
    const fakeKnexPg = knex({ client: 'pg' });

    const callback = jest.fn();

    const atomic = new Atomicity({
      mysql: fakeKnexMysql,
      postgreSql: fakeKnexPg,
      mongoDb: mongooseFakeCon
    })

    const atomizeSpy = jest.spyOn(Atomicity.prototype as any, 'atomize');

    await atomic.transact(callback);

    expect(atomizeSpy).toBeCalledTimes(2);
    expect(atomizeSpy).toHaveBeenNthCalledWith(1, { relationalsToTransact: [ 'MySQL', 'PostgreSQL' ], isTransactingWithMongo: true }, callback);
    expect(atomizeSpy).toHaveBeenNthCalledWith(2, { relationalsToTransact: [ 'PostgreSQL' ], isChildrenTransaction: true }, callback)
    expect(fakeKnexMysql.transaction).toBeCalled();
    expect(fakeKnexPg.transaction).toBeCalled();
    expect(mongooseFakeCon.startSession).toBeCalled();
    expect(mongooseFakeSession.startTransaction).toBeCalled();
    expect(mongooseFakeSession.commitTransaction).toBeCalled();
  })

})

