class Atomicity {

  private MySQL: object;
  private SQLServer: object;
  private PostgreSQL: object;
  private MongoDB: object; 

  constructor(params: any ) {

    Atomicity.validateParams(params)

    const { mysql, sqlServer, postgreSql, mongoDb } = params;

    if(mysql) this.setKnexMySQLConnection(mysql);
    if(sqlServer) this.setKnexSQLServerConnection(sqlServer);
    if(postgreSql) this.setKnexPostgreSQLConnection(postgreSql);
    if(mongoDb) this.setMongooseConnection(mongoDb);

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
