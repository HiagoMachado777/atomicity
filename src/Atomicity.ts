import _ from 'lodash';

class Atomicity {

  private MySQL: any;
  private SQLServer: any;
  private PostgreSQL: any;
  private MongoDB: any; 
  private MySQLTransaction: any;
  private SQLServerTransaction: any;
  private PostgreSQLTransaction: any;
  private MongoDBTransaction: any;
  private CallbackParams: any;
  private ReadyToGo: boolean = false;

  constructor(params: any ) {

    Atomicity.validateParams(params)

    const { mysql, sqlServer, postgreSql, mongoDb } = params;

    if(mysql) this.setKnexMySQLConnection(mysql);
    if(sqlServer) this.setKnexSQLServerConnection(sqlServer);
    if(postgreSql) this.setKnexPostgreSQLConnection(postgreSql);
    if(mongoDb) this.setMongooseConnection(mongoDb);

    this.ReadyToGo = true;

  }

  private setKnexMySQLConnection(knexMySQL: any):void {
    if(knexMySQL &&
      knexMySQL._context &&
      knexMySQL._context.config &&
      knexMySQL._context.config.client === 'mysql') this.MySQL = knexMySQL;
    else Atomicity.invalidConnectionError('MySQL');
  }

  private setKnexPostgreSQLConnection(knexPostgreSQL: any):void {
    if(knexPostgreSQL &&
      knexPostgreSQL._context &&
      knexPostgreSQL._context.config &&
      knexPostgreSQL._context.config.client === 'pg') this.PostgreSQL = knexPostgreSQL;
    else Atomicity.invalidConnectionError('PostgreSQL');
  }

  private setKnexSQLServerConnection(knexSQLServer: any):void {
    if(knexSQLServer &&
      knexSQLServer._context &&
      knexSQLServer._context.config &&
      knexSQLServer._context.config.client === 'mssql') this.SQLServer = knexSQLServer;
    else Atomicity.invalidConnectionError('SQLServer');
  }

  private setMongooseConnection(mongoose: any): void {
    if(mongoose &&
      mongoose.connections &&
      mongoose.connections[0] &&
      mongoose.connections[0].base &&
      mongoose.connections[0].base.connections &&
      mongoose.connections[0].base.connections[0] &&
      mongoose.connections[0].base.connections[0].client) this.MongoDB = mongoose;
    else throw new Error('Invalid mongoose connection');
  }

  private static validateParams(params: any): void {
    if(!params) Atomicity.databaseIsRequiredError();
    const { mysql, sqlServer, postgreSql, mongoDb } = params;
    if(!mysql && !sqlServer && !postgreSql && !mongoDb) Atomicity.databaseIsRequiredError();
  }

  private static invalidConnectionError(client: string): never {
    throw new Error(`Invalid knex ${client} connection`);
  }

  private static databaseIsRequiredError(): never {
    throw new Error('At least one database is required to start a transaction');
  }

  public async transact(callback) {

    if(!this.ReadyToGo) throw new Error('Atomicity instance is not configurated yet');

    const relationalsToTransact: string[] = [];

    if(this.MySQL) relationalsToTransact.push('MySQL');
    if(this.PostgreSQL) relationalsToTransact.push('PostgreSQL');
    if(this.SQLServer) relationalsToTransact.push('SQLServer');

    if(this.MongoDB && relationalsToTransact.length === 0) return this.simpleMongoTransaction(callback);

    if(!this.MongoDB && relationalsToTransact.length === 1) {
      
      const callbackResponse: any = await this.simpleRelationalTransaction(callback, relationalsToTransact[0]);
      return callbackResponse;

    };

    if(!this.MongoDB && relationalsToTransact.length > 1) {

      const callbackResponse: any = await this.atomize({ relationalsToTransact }, callback);
      return callbackResponse;

    }

    if(this.MongoDB && relationalsToTransact.length > 1) {

      const callbackResponse: any = await this.atomize({
        relationalsToTransact,
        isTransactingWithMongo: true
      }, callback);
      return callbackResponse;

    }

  }


  private simpleRelationalTransaction(callback, relationalToTransact) {

    const clientTransactionName: string = `${relationalToTransact}Transaction`;

    return new Promise( (resolve, reject) => 

      this[relationalToTransact].transaction(async trx => {

        try {
          this[clientTransactionName] = trx;
          this.mountCallbackParams();
          const callbackResponse = await callback(this.CallbackParams);
          return trx.commit(callbackResponse);
        }
        catch (error) {
          trx.rollback();
          return reject(error);
        }

      })
      .then((data) => resolve(data))
      .catch(error => reject(error))
    )
  } 

  private async simpleMongoTransaction(callback) {

    this.MongoDBTransaction = await this.MongoDB.startSession();
    this.MongoDBTransaction.startTransaction();  

    this.mountCallbackParams();

    const callbackResponse = callback(this.CallbackParams);

    this.MongoDBTransaction.commitTransaction();

    return callbackResponse;

  }

  private atomize(atomizeConfig, callback) {

    const { relationalsToTransact, isTransactingWithMongo, isChildrenTransaction } = atomizeConfig

    const atomizingRelational: string = relationalsToTransact[0];
    const relationalsToAtomize: string[] = relationalsToTransact.filter(relational => relational !== atomizingRelational);
    const clientTransactionName: string = `${atomizingRelational}Transaction`;

    return new Promise( (resolve, reject) => 
//TODO: Conditional when the transactions is 1-MONGO X 1 RELATIONAL
      this[atomizingRelational].transaction(async trx => {

        this[clientTransactionName] = trx;
        this.mountCallbackParams();

        if(isTransactingWithMongo) {
          this.MongoDBTransaction = await this.MongoDB.startSession();
          this.MongoDBTransaction.startTransaction();
        }

        if(!isChildrenTransaction) {
          try {
            
            const callbackResponse = await this.atomize({
              relationalsToTransact: relationalsToAtomize,
              isChildrenTransaction: true
            }, callback);
            if(isTransactingWithMongo) this.MongoDBTransaction.commitTransaction();
            return trx.commit(callbackResponse);

          }
          catch (error) {

            trx.rollback();//TODO: Check if knex run rollback for nested transactions
            if(isTransactingWithMongo) this.MongoDBTransaction.abortTransaction();
            return reject(error);

          }
        }

        else {

          if(relationalsToAtomize.length > 0) {

            const callbackResponse = await this.atomize({
              relationalsToTransact: relationalsToAtomize,
              isChildrenTransaction: true
            }, callback);
            return trx.commit(callbackResponse);

          }

          else {

            const callbackResponse = await callback(this.CallbackParams);
            return trx.commit(callbackResponse);

          }
        }

      })
      .then((data) => resolve(data))
      .catch(error => reject(error))
    )

  }
/*
  private commitRelational(relationalsToCommit, callbackResponse) {
    
    for (let index: number = 0; index < relationalsToCommit.length; index++) {

      const clientTransactionName: string = `${relationalsToCommit[index]}Transaction`;

      if(index !== (relationalsToCommit.length - 1) && this[clientTransactionName]) this[clientTransactionName].commit(callbackResponse);
      else if(this[clientTransactionName]) return this[clientTransactionName].commit(callbackResponse);
      
    }
    
  }
*/

  private mountCallbackParams() {
    this.CallbackParams = {};
    if(this.MySQLTransaction) this.CallbackParams.mysqlTrx = this.MySQLTransaction;
    if(this.PostgreSQLTransaction) this.CallbackParams.postgresqlTrx = this.PostgreSQLTransaction;
    if(this.SQLServerTransaction) this.CallbackParams.sqlserverTrx = this.SQLServerTransaction;
    if(this.MongoDBTransaction) this.CallbackParams.mongoSession = this.MongoDBTransaction;
  }




}

export default Atomicity;



// xport default (callback) => 
//   new Promise( (resolve, reject) =>
//     knex.transaction(async trx => {

//       const session = await mongoose.startSession();
//       session.startTransaction();         
        
//       const legacyResponse = await legacyDatabase.transaction(async legacyTrx => {   
//         const callbackResponse = await callback(trx, session, legacyTrx)
//         return legacyTrx.commit(callbackResponse)
//       })
              
//       session.commitTransaction()
//       return trx.commit(legacyResponse)
//     })
//     .then((data) => resolve(data))
//     .catch(error => reject(error))
//   )








// export default (callback) => 
//   new Promise( (resolve, reject) =>
//     knex.transaction(async trx => {
//       const session = await mongoose.startSession();
//       session.startTransaction();      
//       try {
//         const callbackResponse = await callback(trx, session)
//         session.commitTransaction()
//         return trx.commit(callbackResponse)
//       }
//       catch (error) {
//         trx.rollback();
//         session.abortTransaction();
//         return reject(error);
//       }
//     })
//     .then((data) => resolve(data))
//     .catch(error => reject(error))
//   )
