# AtomicityJS
#
#### AtomicityJS helps you ensure the atomicity of cross database transactions using high friendly code.
#
## Supported Databases:

* MySQL
* PostgreSQL
* SQL Server
* MongoDB

#

## Coming soon:

* SQLite3
* Neo4j
* Oracle
* And more

#

# Before start:

*  **AtomicityJS is in beta**
* Currently for the relational database transactions supported, it is necessary to configure a [Knex](http://knexjs.org/) connection to be passed to AtomicityJS.
* And as for the MongoDB, [Mongoose](https://mongoosejs.com/) must be used.
* The plan is that Atomicity will in future support pure database node drivers and also Sequelize ORM.


# Get started

## Installation:

`npm install atomicity`

**or:**

`yarn add atomicity`

## Let's make some code !

First of all you should know that Atomicity will make cross database transactions and common transactions. And under the hoods it chooses the best way to do it. 

### Setting some Knex connections to start:

```javascript
//myDatabaseConfig.js
import knex from 'knex';


export const mysqlKnex = (() => knex({
  client: 'mysql', 
  connection: {
    host: 'localhost',
    user: 'dbuser',
    port: 3306,
    password: 'pleasedonthackme',
    database: 'mydatabase',
  }
}))();


export const postgreKnex = (() => knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    user: 'dbuser',
    port: 3306,
    password: 'pleasedonthackme',
    database: 'mydatabase',
  }
}))();


export const sqlServerKnex = (() => knex({
  client: 'mssql',
  connection: {
    host: 'localhost',
    user: 'dbuser',
    port: 3306,
    password: 'pleasedonthackme',
    database: 'mydatabase',
  }
}))();

```

How you can see basically the knex configuration does not change so much from database to database.

#
### Setting a Mongo connection:

**IMPORTANT:** MongoDB supports transactions only from version 4.0 upwards and only in [replica set](https://docs.mongodb.com/manual/tutorial/convert-standalone-to-replica-set/).

You just need to [configure Mongoose](https://mongoosejs.com/docs/connections.html) normally and it will be ready to use.

#

### The Atomicity constructor:

The Atomicity constructor is very simple, you just need to pass an object with the connections you will use in your transaction.

For instance, if you want to make a transaction with MySQL and MongoDB you will just need to pass your MySQL Knex connection and your mongoose configured:

```javascript

const atomic = new Atomicity({ mysql: connectKnexMysql, mongoDb: mongoose });
```

The complete list of options that you can pass in the constructor is: *mysql, sqlServer, postgreSql* and *mongoDb*

#

### The *transact* method:

After initialize the constructor correctly you will be able to use the *transact* method.

The method will receive just a callback that will run all your database instructions. The Atomicity will inject a param in your callback.

For each database configured in the Atomicity constructor a transaction reference will be injected in an object that will be passed as param in your callback.

For the instance, let's see how it would work with the Atomicity that we configured in last section:

```javascript
const atomic = new Atomicity({ mysql: connectKnexMysql, mongoDb: mongoose });
const transactionReturnedData = await atomic.transact( async ({ mysqlTrx, mongoSession }) => {

  await someMySQLDatabaseInstruction(mysqlTrx);

  const mongoReturnedData = await someMongoDatabaseInstruction(mongoSession);

  return mongoReturnedData;
})
```

How you can see, for each connection ( mysql, mongoDb ) a transaction reference (mysqlTrx, mongoSession) is injected in the param object of your callback.

The transact method also return your callback return.

Each connection in the Atomicity configuration will generate a transaction reference. The relationship between configured connections and tansactions references is:

* *mysql* generates *mysqlTrx*
* *sqlServer* generates *sqlserverTrx*
* *postgreSql* generates *postgresqlTrx*
* *mongoDb* generates *mongoSession*

#

### A simple relational transaction:
Assuming we have already configured our knex connections as in the examples above, let's start with a simple MySQL relational transaction:

```javascript
import Atomicity from 'atomicity';
import { mysqlKnex } from './myDatabaseConfig';

//TABLES SHORTHANDS
const User = () => mysqlKnex('user');
const Pet = () => mysqlKnex('user_pet');


//CREATE USER AND HIS PET TRANSACTION

const createUserTrx = (name, email, trx) =>
  User()
    .insert({ name, email }, 'id')
    .transacting(trx);


const createPetTrx = (userId, petName, trx) =>
  Pet()
    .insert({ id_user: userId, name: pet })
    .transacting(trx);


const createUser = async (name, email, pet) => {

  const atomic = new Atomicity({ mysql: mysqlKnex });

  const userId = await atomic.transact( async ({ mysqlTrx }) => {

    const userId = ( await createUserTrx(name, email, mysqlTrx) )[0];
    await createPetTrx(userId, pet, trx);
    return userId;

  });

}

```
If any error occurs while executing the callback of the *transact* method, all changes already made will be reversed.

#

### A transaction that cross three different databases:

**IMPORTANT:** Atomicity does not support yet transactions with different connections but the same database client. For instance, currently is not possible to do transactions between two databases where both are MySQL, but is totally possible perform a transaction between PostgreSQL and MySQL connections. This feature will be available in the future.

Now let's imagine that we want put the user and pet data in different databases in different ways. We want to do just like we did in the example above, but we also want to add in SQL Server and MongoDB.

Let's consider a [schema](https://mongoosejs.com/docs/guide.html) for Mongo that will look like this structure:

```
{
  userIdMysql: Number,
  userIdSQLServer: Number,
  lastNameKnown: String,
  lastEmailKnown: String
}
```

The code will be something like this:

```javascript
import Atomicity from 'atomicity';
import mongoose from 'mongoose';
import { mysqlKnex, sqlServerKnex } from './myDatabaseConfig';
import { user } from './mongoModels';

//TABLES SHORTHANDS
const UserMySQL = () => mysqlKnex('user');
const UserSQLServer = () => sqlServerKnex('user');
const PetMySQL = () => mysqlKnex('user_pet');
const PetSQLServer = () => sqlServerKnex('user_pet');


//CREATE USER AND HIS PET TRANSACTION

//MySQL functions
const createUserOnMySQLTrx = (name, email, trx) =>
  UserMySQL()
    .insert({ name, email }, 'id')
    .transacting(trx);


const createPetOnMySQLTrx = (userId, petName, trx) =>
  PetMySQL()
    .insert({ id_user: userId, name: pet })
    .transacting(trx);


//SQL Server functions
const createUserOnSQLServerTrx = (name, email, trx) =>
  UserMySQL()
    .insert({ name, email }, 'id')
    .transacting(trx);


const createPetOnSQLServerTrx = (userId, petName, trx) =>
  PetMySQL()
    .insert({ id_user: userId, name: pet })
    .transacting(trx);


//MongoDB function
const createUserOnMongoTrx = (userIdMySQL, userIdSQLServer, name, email, session) =>
  user.create(
    [{
      userIdMysql: Number,
      userIdSQLServer: Number,
      lastNameKnown: String,
      lastEmailKnown: String
    }], { session });

//The atomic transaction
const createUser = async (name, email, pet) => {
  const atomic = new Atomicity({ mysql: connectKnexMysql, sqlServer: sqlServerKnex, mongoDb: mongoose });
  const transactionReturnedData = await atomic.transact( async ({ mysqlTrx, sqlserverTrx, mongoSession }) => {

    const userIdMySQL = ( await createUserOnMySQLTrx(name, email, mysqlTrx) )[0];
    const userIdSQLServer = ( await createUserOnSQLServerTrx(name, email, mysqlTrx) )[0];

    await createPetOnMySQLTrx(userIdMySQL, pet, mysqlTrx);
    await createPetOnSQLServerTrx(userIdSQLServer, pet, sqlserverTrx);

    await mongoResume = await createUserOnMongoTrx(userIdMySQL, userIdSQLServer, name, email, mongoSession);

    return mongoResume;

  });
}

```
And again, just to remember, if any error occurs while executing the callback of the transact method, all changes already made will be reversed.