"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Atomicity = /** @class */ (function () {
    function Atomicity(params) {
        this.ReadyToGo = false;
        Atomicity.validateParams(params);
        var mysql = params.mysql, sqlServer = params.sqlServer, postgreSql = params.postgreSql, mongoDb = params.mongoDb;
        if (mysql)
            this.setKnexMySQLConnection(mysql);
        if (sqlServer)
            this.setKnexSQLServerConnection(sqlServer);
        if (postgreSql)
            this.setKnexPostgreSQLConnection(postgreSql);
        if (mongoDb)
            this.setMongooseConnection(mongoDb);
        this.ReadyToGo = true;
    }
    Atomicity.prototype.setKnexMySQLConnection = function (knexMySQL) {
        if (knexMySQL &&
            knexMySQL._context &&
            knexMySQL._context.client &&
            knexMySQL._context.client.config &&
            knexMySQL._context.client.config.client === 'mysql')
            this.MySQL = knexMySQL;
        else
            Atomicity.invalidConnectionError('MySQL');
    };
    Atomicity.prototype.setKnexPostgreSQLConnection = function (knexPostgreSQL) {
        if (knexPostgreSQL &&
            knexPostgreSQL._context &&
            knexPostgreSQL._context.client &&
            knexPostgreSQL._context.client.config &&
            knexPostgreSQL._context.client.config.client === 'pg')
            this.PostgreSQL = knexPostgreSQL;
        else
            Atomicity.invalidConnectionError('PostgreSQL');
    };
    Atomicity.prototype.setKnexSQLServerConnection = function (knexSQLServer) {
        if (knexSQLServer &&
            knexSQLServer._context &&
            knexSQLServer._context.client &&
            knexSQLServer._context.client.config &&
            knexSQLServer._context.client.config.client === 'mssql')
            this.SQLServer = knexSQLServer;
        else
            Atomicity.invalidConnectionError('SQLServer');
    };
    Atomicity.prototype.setMongooseConnection = function (mongoose) {
        if (mongoose &&
            mongoose.connections &&
            mongoose.connections[0] &&
            mongoose.connections[0].base &&
            mongoose.connections[0].base.connections &&
            mongoose.connections[0].base.connections[0] &&
            mongoose.connections[0].base.connections[0].client)
            this.MongoDB = mongoose;
        else
            throw new Error('Invalid mongoose connection');
    };
    Atomicity.validateParams = function (params) {
        if (!params)
            Atomicity.databaseIsRequiredError();
        var mysql = params.mysql, sqlServer = params.sqlServer, postgreSql = params.postgreSql, mongoDb = params.mongoDb;
        if (!mysql && !sqlServer && !postgreSql && !mongoDb)
            Atomicity.databaseIsRequiredError();
    };
    Atomicity.invalidConnectionError = function (client) {
        throw new Error("Invalid knex " + client + " connection");
    };
    Atomicity.databaseIsRequiredError = function () {
        throw new Error('At least one database is required to start a transaction');
    };
    Atomicity.prototype.transact = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            var relationalsToTransact, callbackResponse, callbackResponse, callbackResponse, callbackResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.ReadyToGo)
                            throw new Error('Atomicity instance is not configurated yet');
                        relationalsToTransact = [];
                        if (this.MySQL)
                            relationalsToTransact.push('MySQL');
                        if (this.PostgreSQL)
                            relationalsToTransact.push('PostgreSQL');
                        if (this.SQLServer)
                            relationalsToTransact.push('SQLServer');
                        if (!(this.MongoDB && relationalsToTransact.length === 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.simpleMongoTransaction(callback)];
                    case 1:
                        callbackResponse = _a.sent();
                        return [2 /*return*/, callbackResponse];
                    case 2:
                        if (!(!this.MongoDB && relationalsToTransact.length === 1)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.simpleRelationalTransaction(callback, relationalsToTransact[0])];
                    case 3:
                        callbackResponse = _a.sent();
                        return [2 /*return*/, callbackResponse];
                    case 4:
                        ;
                        if (!(!this.MongoDB && relationalsToTransact.length > 1)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.atomize({ relationalsToTransact: relationalsToTransact }, callback)];
                    case 5:
                        callbackResponse = _a.sent();
                        return [2 /*return*/, callbackResponse];
                    case 6:
                        if (!(this.MongoDB && relationalsToTransact.length > 0)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.atomize({
                                relationalsToTransact: relationalsToTransact,
                                isTransactingWithMongo: true
                            }, callback)];
                    case 7:
                        callbackResponse = _a.sent();
                        return [2 /*return*/, callbackResponse];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    Atomicity.prototype.simpleRelationalTransaction = function (callback, relationalToTransact) {
        var _this = this;
        var clientTransactionName = relationalToTransact + "Transaction";
        return new Promise(function (resolve, reject) {
            return _this[relationalToTransact].transaction(function (trx) { return __awaiter(_this, void 0, void 0, function () {
                var callbackResponse, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this[clientTransactionName] = trx;
                            this.mountCallbackParams();
                            return [4 /*yield*/, callback(this.CallbackParams)];
                        case 1:
                            callbackResponse = _a.sent();
                            return [2 /*return*/, trx.commit(callbackResponse)];
                        case 2:
                            error_1 = _a.sent();
                            trx.rollback();
                            return [2 /*return*/, reject(error_1)];
                        case 3: return [2 /*return*/];
                    }
                });
            }); })
                .then(function (data) { return resolve(data); })
                .catch(function (error) { return reject(error); });
        });
    };
    Atomicity.prototype.simpleMongoTransaction = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, callbackResponse;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this.MongoDB.startSession()];
                    case 1:
                        _a.MongoDBTransaction = _b.sent();
                        this.MongoDBTransaction.startTransaction();
                        this.mountCallbackParams();
                        return [4 /*yield*/, callback(this.CallbackParams)];
                    case 2:
                        callbackResponse = _b.sent();
                        this.MongoDBTransaction.commitTransaction();
                        return [2 /*return*/, callbackResponse];
                }
            });
        });
    };
    Atomicity.prototype.atomize = function (atomizeConfig, callback) {
        var _this = this;
        try {
            var relationalsToTransact = atomizeConfig.relationalsToTransact, isTransactingWithMongo_1 = atomizeConfig.isTransactingWithMongo, isChildrenTransaction_1 = atomizeConfig.isChildrenTransaction;
            var atomizingRelational_1 = relationalsToTransact[0];
            var relationalsToAtomize_1 = relationalsToTransact.filter(function (relational) { return relational !== atomizingRelational_1; });
            var clientTransactionName_1 = atomizingRelational_1 + "Transaction";
            return new Promise(function (resolve, reject) {
                return _this[atomizingRelational_1].transaction(function (trx) { return __awaiter(_this, void 0, void 0, function () {
                    var _a, callbackResponse, _b, error_2, callbackResponse, error_3, callbackResponse, error_4;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                this[clientTransactionName_1] = trx;
                                if (!isTransactingWithMongo_1) return [3 /*break*/, 3];
                                _a = this;
                                return [4 /*yield*/, this.MongoDB.startSession()];
                            case 1:
                                _a.MongoDBTransaction = _c.sent();
                                return [4 /*yield*/, this.MongoDBTransaction.startTransaction()];
                            case 2:
                                _c.sent();
                                _c.label = 3;
                            case 3:
                                this.mountCallbackParams();
                                if (!!isChildrenTransaction_1) return [3 /*break*/, 15];
                                _c.label = 4;
                            case 4:
                                _c.trys.push([4, 11, , 14]);
                                if (!(relationalsToAtomize_1.length > 0)) return [3 /*break*/, 6];
                                return [4 /*yield*/, this.atomize({
                                        relationalsToTransact: relationalsToAtomize_1,
                                        //isTransactingWithMongo,
                                        isChildrenTransaction: true
                                    }, callback)];
                            case 5:
                                _b = _c.sent();
                                return [3 /*break*/, 8];
                            case 6: return [4 /*yield*/, callback(this.CallbackParams)];
                            case 7:
                                _b = _c.sent();
                                _c.label = 8;
                            case 8:
                                callbackResponse = _b;
                                if (!isTransactingWithMongo_1) return [3 /*break*/, 10];
                                return [4 /*yield*/, this.MongoDBTransaction.commitTransaction()];
                            case 9:
                                _c.sent();
                                _c.label = 10;
                            case 10: return [2 /*return*/, trx.commit(callbackResponse)];
                            case 11:
                                error_2 = _c.sent();
                                if (!isTransactingWithMongo_1) return [3 /*break*/, 13];
                                return [4 /*yield*/, this.MongoDBTransaction.abortTransaction()];
                            case 12:
                                _c.sent();
                                _c.label = 13;
                            case 13:
                                trx.rollback();
                                return [2 /*return*/, reject(error_2)];
                            case 14: return [3 /*break*/, 25];
                            case 15:
                                if (!(relationalsToAtomize_1.length > 0)) return [3 /*break*/, 21];
                                _c.label = 16;
                            case 16:
                                _c.trys.push([16, 18, , 20]);
                                return [4 /*yield*/, this.atomize({
                                        relationalsToTransact: relationalsToAtomize_1,
                                        isChildrenTransaction: true
                                    }, callback)];
                            case 17:
                                callbackResponse = _c.sent();
                                return [2 /*return*/, trx.commit(callbackResponse)];
                            case 18:
                                error_3 = _c.sent();
                                return [4 /*yield*/, trx.rollback(error_3)];
                            case 19:
                                _c.sent();
                                throw error_3;
                            case 20: return [3 /*break*/, 25];
                            case 21:
                                _c.trys.push([21, 23, , 25]);
                                return [4 /*yield*/, callback(this.CallbackParams)];
                            case 22:
                                callbackResponse = _c.sent();
                                return [2 /*return*/, trx.commit(callbackResponse)];
                            case 23:
                                error_4 = _c.sent();
                                return [4 /*yield*/, trx.rollback(error_4)];
                            case 24:
                                _c.sent();
                                throw error_4;
                            case 25: return [2 /*return*/];
                        }
                    });
                }); })
                    .then(function (data) { return resolve(data); })
                    .catch(function (error) { return reject(error); });
            });
        }
        catch (error) {
            throw error;
        }
    };
    Atomicity.prototype.mountCallbackParams = function () {
        this.CallbackParams = {};
        if (this.MySQLTransaction)
            this.CallbackParams.mysqlTrx = this.MySQLTransaction;
        if (this.PostgreSQLTransaction)
            this.CallbackParams.postgresqlTrx = this.PostgreSQLTransaction;
        if (this.SQLServerTransaction)
            this.CallbackParams.sqlserverTrx = this.SQLServerTransaction;
        if (this.MongoDBTransaction)
            this.CallbackParams.mongoSession = this.MongoDBTransaction;
    };
    return Atomicity;
}());
exports.default = Atomicity;
