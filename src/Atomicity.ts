import RelationalsToTransactInfo from './RelationalsToTransactInfo';

class Atomicity {

  private MySQL: any[] = [];
  private SQLServer: any[] = [];
  private PostgreSQL: any[] = [];
  private MongoDB: any; 
  private MySQLTransaction: any[] = [];
  private SQLServerTransaction: any[] = [];
  private PostgreSQLTransaction: any[] = [];
  private MongoDBTransaction: any;
  private CallbackParams: any;
  private ReadyToGo: boolean = false;

  constructor(params: any ) {

    Atomicity.validateParams(params)

    const { mysql, sqlServer, postgreSql, mongoDb } = params;

    if(mysql) this.setKnexConnections(Atomicity.connectionsFormat(mysql), 'mysql', 'MySQL');
    if(sqlServer) this.setKnexConnections(Atomicity.connectionsFormat(sqlServer), 'mssql', 'SQLServer');
    if(postgreSql) this.setKnexConnections(Atomicity.connectionsFormat(postgreSql), 'pg', 'PostgreSQL');
    if(mongoDb) this.setMongooseConnection(mongoDb);

    this.ReadyToGo = true;

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

  private setKnexConnections(knexConnections: any[], clientName: string, atomicityRefName: string): void {
    for (const knexConnection of knexConnections) {
      if(knexConnection &&
        knexConnection._context &&
        knexConnection._context.client &&
        knexConnection._context.client.config &&
        knexConnection._context.client.config.client === clientName) this[atomicityRefName].push(knexConnection)
      else Atomicity.invalidConnectionError(atomicityRefName);
    }
  }

  private static validateParams(params: any): void {
    if(!params) Atomicity.databaseIsRequiredError();
    const { mysql, sqlServer, postgreSql, mongoDb } = params;
    if(!Atomicity.isValidParam(mysql) &&
      !Atomicity.isValidParam(sqlServer) &&
      !Atomicity.isValidParam(postgreSql) &&
      mongoDb) Atomicity.databaseIsRequiredError();
  }

  private static isValidParam(param: any): boolean {
    return ( Array.isArray(param) && param.length > 0 || param )
  }

  private static connectionsFormat(connections: any): any[] {
    if(Array.isArray(connections)) return connections
    return [connections]
  }

  private static invalidConnectionError(client: string): never {
    throw new Error(`Invalid knex ${client} connection`);
  }

  private static databaseIsRequiredError(): never {
    throw new Error('At least one database is required to start a transaction');
  }

  public async transact(callback) {

    if(!this.ReadyToGo) throw new Error('Atomicity instance is not configurated yet');

    const relationalsToTransactInfo = new RelationalsToTransactInfo(this.MySQL, this.SQLServer, this.PostgreSQL);

    const relationalsToTransact = relationalsToTransactInfo.countRelationalsToTransact();

    if(this.MongoDB && relationalsToTransact === 0) {

      const callbackResponse: any = await this.simpleMongoTransaction(callback);
      return callbackResponse;

    }

    if(!this.MongoDB && relationalsToTransact === 1) {
      
      const callbackResponse: any = await this.simpleRelationalTransaction(callback, relationalsToTransactInfo.getClientNameFromUniqueTransactionToExecute());
      return callbackResponse;

    };

    if(!this.MongoDB && relationalsToTransact > 1) {
      const callbackResponse: any = await this.atomize({ relationalsToTransactInfo }, callback);
      return callbackResponse;

    }

    if(this.MongoDB && relationalsToTransact > 0) {
      const callbackResponse: any = await this.atomize({
        relationalsToTransactInfo,
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

    const callbackResponse: any = await callback(this.CallbackParams);

    this.MongoDBTransaction.commitTransaction();

    return callbackResponse;

  }

  private atomize(atomizeConfig, callback) {
    try {
      const { relationalsToTransactInfo, isTransactingWithMongo, isChildrenTransaction } = atomizeConfig

      const atomizingRelational: string = relationalsToTransactInfo[0];
      const relationalsToAtomize: string[] = relationalsToTransactInfo.filter(relational => relational !== atomizingRelational);
      const clientTransactionName: string = `${atomizingRelational}Transaction`;

      return new Promise( (resolve, reject) => 
  
        this[atomizingRelational].transaction(async trx => {

          this[clientTransactionName] = trx;

          if(isTransactingWithMongo) {
            this.MongoDBTransaction = await this.MongoDB.startSession();
            await this.MongoDBTransaction.startTransaction();
          }

          this.mountCallbackParams();

          if(!isChildrenTransaction) {
            try {
              const callbackResponse: any = relationalsToAtomize.length > 0?
                await this.atomize({
                  relationalsToTransactInfo: relationalsToAtomize,
                  isChildrenTransaction: true
                }, callback)
                :
                await callback(this.CallbackParams);

              if(isTransactingWithMongo) await this.MongoDBTransaction.commitTransaction();
              return trx.commit(callbackResponse);

            }
            catch (error) {
              if(isTransactingWithMongo) await this.MongoDBTransaction.abortTransaction();
              trx.rollback();
              return reject(error);

            }
          }

          else {

            if(relationalsToAtomize.length > 0) {
              try {
                const callbackResponse: any = await this.atomize({
                  relationalsToTransactInfo: relationalsToAtomize,
                  isChildrenTransaction: true
                }, callback);
                return trx.commit(callbackResponse);
              }
              catch(error) {
                await trx.rollback(error);
                throw error;
              }

            }

            else {
              try {
                const callbackResponse: any = await callback(this.CallbackParams);
                return trx.commit(callbackResponse);
              }
              catch(error) {
                await trx.rollback(error);
                throw error;
              }

            }
          }

        })
        .then((data) => resolve(data))
        .catch(error => reject(error))
      )
    }

    catch(error) {
      throw error;
    }

  }

  private mountCallbackParams() {
    this.CallbackParams = {};
    if(this.MySQLTransaction) this.CallbackParams.mysqlTrx = this.MySQLTransaction;
    if(this.PostgreSQLTransaction) this.CallbackParams.postgresqlTrx = this.PostgreSQLTransaction;
    if(this.SQLServerTransaction) this.CallbackParams.sqlserverTrx = this.SQLServerTransaction;
    if(this.MongoDBTransaction) this.CallbackParams.mongoSession = this.MongoDBTransaction;
  }

}

export default Atomicity;
