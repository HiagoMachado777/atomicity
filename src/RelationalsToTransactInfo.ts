class RelationalsToTransactInfo {

  private MySQLTransactionsToExecute: number = 0;
  private SQLServerTransactionsToExecute: number = 0;
  private PostgreSQLTransactionsToExecute: number = 0;
  private ClientsInTransaction: string[] = []
  private MySQLTransactionsExecuting: string[] = []

  constructor(mysqlConnections, sqlServerConnections, postgresConnections ) {

    this.MySQLTransactionsToExecute = mysqlConnections.length;
    this.SQLServerTransactionsToExecute = sqlServerConnections.length;
    this.PostgreSQLTransactionsToExecute  = postgresConnections.length;

    if(mysqlConnections.length) this.ClientsInTransaction.push('MySQL');
    if(sqlServerConnections.length) this.ClientsInTransaction.push('SQLServer');
    if(postgresConnections.length) this.ClientsInTransaction.push('PostgreSQL');
  }

  public countRelationalsToTransact(): number {
    return this.MySQLTransactionsToExecute + this.SQLServerTransactionsToExecute + this.PostgreSQLTransactionsToExecute;
  }

  public setTransactionExecuting(clientName: string): void {
    const attributeName = `${clientName}TransactionsToExecute`;
    if(this[attributeName] > 0) this[attributeName]--;
  }

  public getClientNameFromUniqueTransactionToExecute(): string {
    if(this.countRelationalsToTransact() > 1) throw new Error('There is more than one database to transact')
    if(this.MySQLTransactionsToExecute === 1) return 'MySQL'
    if(this.SQLServerTransactionsToExecute === 1) return 'SQLServer'
    if(this.PostgreSQLTransactionsToExecute === 1) return 'PostgreSQL'
  }

  public getTransactingClientsNames(): string[] {
    return this.ClientsInTransaction;
  }

  public getRemainingToExecute(): any {
    return ({
      MySQL: this.MySQLTransactionsToExecute,
      SQLServer: this.SQLServerTransactionsToExecute,
      PostgreSQL: this.PostgreSQLTransactionsToExecute
    })
  }

}

export default RelationalsToTransactInfo;
