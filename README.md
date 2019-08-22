# AtomicityJS
#
#### AtomicityJS helps you ensure the atomicity of cross database transactions using high friendly code.
#
##Supported Databases:

* MySQL
* PostgreSQL
* SQL Server
* MongoDB

#

##Coming soon:

* SQLite3
* Neo4j
* Oracle
* And more

#

#Before start:

*  **We are in beta**
* Currently for the relational database transactions supported, it is necessary to configure a [Knex](http://knexjs.org/) connection to be passed to AtomicityJS.
* And as for the mongo, [Mongoose](https://mongoosejs.com/) must be used.
* The plan is that Atomicity will in future support pure database node drivers and also Sequelize ORM.


#Get started

##Installation:

`npm install atomicity`

**or:**

`yarn add atomicity`

##Let's make some code !

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

**WARNING:** MongoDB supports transactions only from version 4.0 upwards and only in [replica set](https://docs.mongodb.com/manual/tutorial/convert-standalone-to-replica-set/).

You just need to [configure Mongoose](https://mongoosejs.com/docs/connections.html) normally and it will be ready to use.

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


const createUser = (name, email, pet) => {

  const atomic = new Atomicity({ mysql: mysqlKnex });

  const userId = await atomic.transact( async ({ mysqlTrx }) => {

    const userId = ( await createUserTrx(name, email, mysqlTrx) )[0];
    await createPetTrx(userId, pet, trx);
    return userId;

  });

}

```
If any error occurs while executing the callback of the *transact* method, all changes already made will be reversed.



/*

const a = async () => {
  const atomic = new Atomicity({ /*mysql: connectKnexMysql, postgreSql: connectKnexPg,*/ mongoDb: mongoose })

const val = await atomic.transact( async ({ /*mysqlTrx, postgresqlTrx,*/ mongoSession }) => {

    //const beforeShit = await connectKnexMysql('test_table').insert({ value_str: 'wwww', value_int: 222 }).transacting(mysqlTrx)

    //const beforeShitPg = await connectKnexPg('mydb.test_tb').insert({ value: 'wwww'}, 'id').transacting(postgresqlTrx);

    const beforeShitMongo = await testMongo.create([{ id: 33232, value: 'ratao' }], { session: mongoSession });

   // console.log('beforeShit', beforeShit);

    //console.log('beforeShitPg', beforeShitPg);

    console.log('beforeShitMongo', beforeShitMongo);


   // await connectKnexMysql('test_table').insert({ value_str: '4343', value_int: 434 }).transacting(mysqlTrx)

    //await connectKnexPg('mydb.test_tb').insert({ value: 'tttttttttt'}).transacting(postgresqlTrx)

    await testMongo.create([{ id: 219212, value: 'miau' }], { session: mongoSession });

    throw 'shit happens'

    return ({ /*beforeShit, beforeShitPg,*/ beforeShitMongo });

  })

}

*/