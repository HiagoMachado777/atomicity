declare class Atomicity {
    private MySQL;
    private SQLServer;
    private PostgreSQL;
    private MongoDB;
    private MySQLTransaction;
    private SQLServerTransaction;
    private PostgreSQLTransaction;
    private MongoDBTransaction;
    private CallbackParams;
    private ReadyToGo;
    constructor(params: any);
    private setKnexMySQLConnection;
    private setKnexPostgreSQLConnection;
    private setKnexSQLServerConnection;
    private setMongooseConnection;
    private static validateParams;
    private static invalidConnectionError;
    private static databaseIsRequiredError;
    transact(callback: any): Promise<any>;
    private simpleRelationalTransaction;
    private simpleMongoTransaction;
    private atomize;
    private mountCallbackParams;
}
export default Atomicity;
