/**
 * Ported from Cordova App.
 * Factory to generate smart queries used by smart store. Include validity checks of parameters.
 * For more complex queries, where calculations are involved do NOT usage this factory.
 *
 * Usage:
 * var q = QueryFactory.newInstance();  // to generate a new instance of the query factory
 * q.select([id, name]);
 * q.from(table)
 * q.where(field1,operator1,criteria1)
 * q.where(field2,operator2,criteria2)
 *
 * q.run()          // generator of the query, returns a string
 * Generated query would look like:
 * "SELECT {table:id}, {table:name} FROM {table} WHERE {table:field1} operator1 criteria1 AND {table:field2} operator2 criteria2"
 *
 * var q = QueryFactory.newInstance();  // to generate a new instance of the query factory
 * q.select([id, name]);
 * q.from(table)
 * q.where(field1,operator1,criteria1)
 * q.whereOr(field2,operator2,criteria2)
 *
 * q.run()          // generator of the query, returns a string
 * Generated query would look like:
 * "SELECT {table:id}, {table:name} FROM {table} WHERE {table:field1} operator1 criteria1 OR {table:field2} operator2 criteria2"
 *
 * Added functions to create a WHERE condition for datetime and date function
 */

import {
    OPERATORS,
    DIRECTIONS,
    EXCEPTIONS,
    FUNC_STR,
    REGEX,
    WHITELISTED_DIRECTIONS,
    WHITELISTED_OPERATORS,
} from "./SmartQueryConstants";
import { _isValidExpression, _composeColumns, _composeTable, _composeCondition } from "./SmaryQueryHelpers";

        export class SmartQuery {
    // Private properties
    private _table: string = "";
    private _columns: string[] = [];
    private readonly _where: any[] = [];
    private readonly _orderBy: any[] = [];
    private readonly _groupBy: any[] = [];
    private _limit: string = "";

    /**
     * Public Method to indicate which columns to be selected
     * Input parameter is checked for allowed characters.
     * Allowed characters are only characters, digits and underscore.
     * Any parameters that is not allowed will be ignored.
     * @params {[string]} columns contains an array of column names
     */
    select(columns: string[]) {
        const sanitizedColumns: string[] = [];
        if (columns.length && columns.length > 0) {
            columns.forEach((column) => {
                if (REGEX.CHARACTERS_DIGITS_UNDERSCORE_DASH.test(column)) {
                    sanitizedColumns.push(column);
                }
            });
        }
        this._columns = sanitizedColumns;

        return this;
    }

    /**
     * Public method to indicate which table to be selected
     * Input is checked agains allowed characters.
     * Only characters, digits and underscores are allowed.
     * If input contains some thing else, an exception ONLY_CHARACTERS_DIGITS will be thrown.
     * @param {string} table is the table name
     */
    from(table: string) {
        if (REGEX.CHARACTERS_DIGITS_UNDERSCORE.test(table)) {
            this._table = table;
        } else {
            throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE);
        }

        return this;
    }

    /**
     * Add a 'where' condition. This is an overloaded function, behaving differently depending on the parameters.
     * There are 2 ways of using the where condition:
     * - q.where(column, operator, criteria)
     * When using the method this way, it will generate a where condition prependend by the AND operator.
     * This would generated 'WHERE leftExpression operator rightExpression
     * Column parameter is validated. Only characters digits and underscore is allowed.
     * Operator parameter is also validated. Whitelisted operators can be found in WHITELISTED_OPERATORS
     * Criteria parameter is also validated. Allowed characters are characters, digits, dash and underscore
     * @param {string} leftExpression
     * @param {string} operator
     * @param {string} rightExpression
     *
     * - q.where(
     *  QueryFactory.newInstance()
     *  .where(leftExpression1, operator1, rightExpression1)
     *  .where(leftExpression2, operator2, rightExpression2)
     * )
     * When using this way, it would generated the following
     * WHERE (leftExpression1 operator1 rightExpression1 AND leftExpression2 operator2 rightExpression2)
     * With this method an array is passed with objects containing the column, operator and criterias
     * @param {QueryFactory.newInstance}
     */
    where(arg1: any, arg2?: any, arg3?: any) {
        // where is used as q.where(column, operator, criteria)
        if (arg2 && arg3) {
            const leftExpression = arg1;
            const operator = arg2.toUpperCase();
            const rightExpression = arg3;

            if (!_isValidExpression(leftExpression)) {
                throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
            }

            if (!WHITELISTED_OPERATORS.includes(operator)) {
                throw new Error(EXCEPTIONS.WHITELISTED_OPERATORS);
            }

            if (!_isValidExpression(rightExpression)) {
                throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
            }

            this._where.push(
                // @ts-ignore
                this._whereObj(leftExpression, operator, rightExpression, OPERATORS.AND)
            );
        }

        // where is used where a function is passed
        if (!(arg2 && arg3)) {
            const queryFactoryClosure = arg1;

            if (!(queryFactoryClosure instanceof Object) || !(typeof queryFactoryClosure.run === "function")) {
                throw new Error(EXCEPTIONS.WHERE_FUNCTION_PARAMETER);
            }
            this._where.push(
                // @ts-ignore
                this._whereObj(queryFactoryClosure, OPERATORS.AND)
            );
        }

        return this;
    }

    /**
     * Function generates the Where condition with the IN operator
     * usage: q.whereIn(leftExpression, rightExpression)
     * output: WHERE leftExpression IN rightExpression
     * @param {string} leftExpression
     * @param {string} rightExpression
     * @returns {QueryFactory.newInstance}
     */
    whereIn(leftExpression: string, rightExpression: string) {
        if (!_isValidExpression(leftExpression)) {
            throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
        }

        this._where.push(
            // @ts-ignore
            this._whereObj(leftExpression, OPERATORS.IN, rightExpression, OPERATORS.AND)
        );

        return this;
    }

    /**
     * Function to generate where condition with IS operator
     * usage: q.whereIs(leftExpression, rightExpression)
     * output: WHERE leftExpression IN rightExpression
     * @param {string} leftExpression
     * @param {string} rightExpression
     * @returns {whereIs}
     */
    whereIs(leftExpression: string, rightExpression: string) {
        if (!_isValidExpression(leftExpression)) {
            throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
        }

        if (!_isValidExpression(rightExpression)) {
            throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
        }

        this._where.push(
            //@ts-ignore
            this._whereObj(leftExpression, OPERATORS.IS, rightExpression, OPERATORS.AND)
        );

        return this;
    }

    /**
     * Add a 'where' condition prepended with the OR statement
     * Column parameter is validated. Only characters digits and underscore is allowed.
     * Operator parameter is also validated. Whitelisted operators can be found in WHITELISTED_OPERATORS
     * Criteria parameter is also validated. Allowed characters are characters, digits, dash and underscore
     * If parameters do not
     * @param {string} leftExpression
     * @param {string} operator
     * @param {string} rightExpression
     * @returns {QueryFactory.newInstance}
     */
    orWhere(arg1: any, arg2?: any, arg3?: any) {
        // where is used as q.where(column, operator, criteria)
        if (arg2 && arg3) {
            const leftExpression = arg1;
            const operator = arg2;
            const rightExpression = arg3;

            if (!_isValidExpression(leftExpression)) {
                throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
            }

            if (!WHITELISTED_OPERATORS.includes(operator)) {
                throw new Error(EXCEPTIONS.WHITELISTED_OPERATORS);
            }

            if (!_isValidExpression(rightExpression)) {
                throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
            }
            this._where.push(
                // @ts-ignore
                this._whereObj(leftExpression, operator, rightExpression, OPERATORS.OR)
            );
        }

        // where is used where a function is passed
        if (arguments.length === 1) {
            const queryFactoryClosure = arguments[0];

            if (!(queryFactoryClosure instanceof Object) || !queryFactoryClosure.hasOwnProperty("run")) {
                throw new Error(EXCEPTIONS.WHERE_FUNCTION_PARAMETER);
            }
            this._where.push(
                // @ts-ignore
                this._whereObj(queryFactoryClosure, OPERATORS.OR)
            );
        }

        return this;
    }

    /**
     * Generate an where condition with IN operator. The condition will be an Or condition
     * usage: q.OrWhereIn(leftExpression, rightExpression)
     * output: WHERE .... OR leftExpression IN rightExpression
     * @param leftExpression
     * @param rightExpression
     * @returns {QueryFactory.newInstance}
     */
    orWhereIn(leftExpression: string, rightExpression: string) {
        if (!_isValidExpression(leftExpression)) {
            throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
        }

        this._where.push(
            // @ts-ignore
            this._whereObj(leftExpression, OPERATORS.IN, rightExpression, OPERATORS.OR)
        );

        return this;
    }

    /**
     * Function generates an Or condition using the IS operator
     * usage: q.orWhereIs(leftExpression, rightExpression)
     * output: WHERE ... OR leftExpression IN rightExpression
     * @param {string} leftExpression
     * @param {string} rightExpression
     * @returns {QueryFactory.newInstance}
     */
    orWhereIs(leftExpression: string, rightExpression: string) {
        if (!_isValidExpression(leftExpression)) {
            throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
        }

        if (!_isValidExpression(rightExpression)) {
            throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
        }

        this._where.push(
            // @ts-ignore
            this._whereObj(leftExpression, OPERATORS.IS, rightExpression, OPERATORS.OR)
        );

        return this;
    }

    /**
     * Adds a 'order by' condition
     * Column parameter is validated.
     * Direction can only be ASC or DESC
     * @param column
     * @param direction
     */
    orderBy() {
        const column = arguments[0];
        const direction = arguments[1];

        if (!REGEX.CHARACTERS_DIGITS_UNDERSCORE_DASH.test(column)) {
            throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
        }

        if (direction !== undefined && !WHITELISTED_DIRECTIONS.includes(direction.toUpperCase())) {
            throw new Error(EXCEPTIONS.WHITELISTED_DIRECTIONS);
        }

        this._orderBy.push(
            // @ts-ignorer
            this._orderObj(column, direction === undefined ? DIRECTIONS.ASC : direction)
        );

        return this;
    }

    /**
     * Generates the Group By statement
     * usage: q.groupBy(column)
     * output: ... GROUP BY {table:column}
     * @param column
     * @returns {groupBy}
     */
    groupBy(column: string): any {
        if (!REGEX.CHARACTERS_DIGITS_UNDERSCORE_DASH.test(column)) {
            throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
        }

        this._groupBy.push(column);

        return this;
    }

    /**
     * Generates the LIMIT statement
     * usage: q.limit(count)
     * output: .... LIMIT count
     * @param count
     * @returns {limit}
     */
    limit(count: number) {
        const countStr = count.toString();
        if (!REGEX.DIGITS.test(countStr)) {
            throw new Error(EXCEPTIONS.DIGITS);
        }

        this._limit = countStr;

        return this;
    }

    /**
     * This method generates the smart query string. This function has to be executed at the very end
     * @returns {string} the smart query
     */
    run() {
        if (this._columns !== undefined && this._columns.length !== 0) {
            return (
                `SELECT ${_composeColumns(this._table, this._columns)} FROM ${_composeTable(this._table)}` +
                `${this._composeWhere()}` +
                `${this._composeOrderBy()}` +
                `${this._composeGroupBy()}` +
                `${this._composeLimit()}`
            );
        } else {
            return `(${this._composeWhere().replace(/^\s*WHERE\s*/, "")})`;
        }
    }

    /**
     * this function generate string for a SQLite function 'date'.
     * Function returns a string with the FUNC_STR prefixed.
     * When passing one parameter it will treat this parameter as a value that has to go through the date function.
     * q.date(datestr) will be converted to the following. Please note that the datestr has to be in format YYYY-MM-DDf
     * FUNC_STR+date(substr('datestr', 1, 10))
     *
     * When passing two parameter this function will treat this as a field.
     * q.date(table, field1) will be converted to:
     * FUNC_STR+date({table:field1})
     *
     * Usage:
     * var q = QueryFactory.newInstance();  // to generate a new instance of the query factory
     * q.select([id, name]);
     * q.from(table)
     * q.where(q.date(table, field1),operator1,q.date(criteria))
     *
     * Note:  table and dateFields are checked on validity. Only characters, digits and underscores allowed.
     * @param {string} table - Table name.
     * @param {string} dateField - the name of the field or date string in format YYYY-MM-DD.
     * @return {string} - date function prefixed with FUNCSTR
     */
    date() {
        // two parameters are passed. treat this as q.date(table, dateField)
        if (arguments.length === 2) {
            const table = arguments[0];
            const dateField = arguments[1];
            if (!REGEX.CHARACTERS_DIGITS_UNDERSCORE.test(table)) {
                throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE);
            }

            if (!REGEX.CHARACTERS_DIGITS_UNDERSCORE_DASH.test(dateField)) {
                throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE);
            }

            const res = `date({${table}:${dateField}})`;
            // We add a prefix 'FUNC_' This is internally used to check if we're dealing with functions or not
            return FUNC_STR + res;
        }

        // one parameter is passed. treat this as q.date(datestr)
        if (arguments.length === 1) {
            const field = arguments[0];
            if (!REGEX.CHARACTERS_DIGITS_UNDERSCORE_DASH.test(field) && !REGEX.DATETIME.test(field)) {
                throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
            }

            const res = `date(substr('${field}',1,10))`;
            return FUNC_STR + res;
        }
    }

    /**
     * this function generate string for a SQLite function 'datetime'.
     * Function returns a string with the FUNC_STR prefixed.
     * When passing one parameter it will treat the parameter as a value that has to through datetime function
     * q.dateTime(datestr) will be converted to the following.
     * FUNC_STR+datetime(substr('datestr', 0, 24))
     * When passing two parameter this function will treat this as a field.
     * q.date(table, field1) will be converted to:
     * FUNC_STR+datetime(substr({table:field1}, 0, 24))
     *
     * Usage:
     * var q = QueryFactory.newInstance();  // to generate a new instance of the query factory
     * q.select([id, name]);
     * q.from(table)
     * q.where(q.dateTime(table, field1),operator1,q.dateTime(criteria1))
     *
     * Note:  table and dateFields are checked on validity. Only characters, digits and underscores allowed.
     * @param {string} table - name of the table
     * @param {string} dateField - the name of the field or date string in format YYYY-MM-DDT00:00:00.000
     * @return {string} - see method description for usage
     */
    dateTime(table: string, dateField: string) {
        if (arguments.length === 2) {
            const table = arguments[0];
            const dateField = arguments[1];

            if (!REGEX.CHARACTERS_DIGITS_UNDERSCORE.test(table)) {
                throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE);
            }

            if (!REGEX.CHARACTERS_DIGITS_UNDERSCORE_DASH.test(dateField)) {
                throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
            }

            const res = `datetime(substr({${table}:${dateField}},0,24))`;

            return FUNC_STR + res;
        }

        if (arguments.length === 1) {
            const field = arguments[0];

            if (!REGEX.CHARACTERS_DIGITS_UNDERSCORE_DASH.test(field) && !REGEX.DATETIME.test(field)) {
                throw new Error(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
            }

            const res = `datetime(substr('${field}',0,24))`;

            return FUNC_STR + res;
        }
    }

    /**
     * Private function to generate all where conditions
     * @returns {string} of all where conditions
     */
    private _composeWhere() {
        // return nothing if there are no where conditions
        const whereConditions = this._where;
        if (whereConditions.length === 0) {
            return "";
        } else {
            // else generate the where string
            let isFirstConditionGenerated = false;
            const conditions: string[] = [];
            whereConditions.forEach((whereCondition) => {
                // Please note that the structure of the where condition is determined by _whereObj
                // There is a regular condition here
                if (whereCondition.condition !== null) {
                    const cond = whereCondition.condition;
                    if (!isFirstConditionGenerated) {
                        conditions.push(_composeCondition(this._table, cond.column, cond.operator, cond.criteria));
                        isFirstConditionGenerated = true;
                    } else {
                        conditions.push(
                            `${whereCondition.operator} ${_composeCondition(
                                this._table,
                                cond.column,
                                cond.operator,
                                cond.criteria
                            )}`
                        );
                    }
                }

                // Another instance of Query factory is passed.
                if (whereCondition.closure !== null) {
                    const queryFactoryInstance = whereCondition.closure;
                    queryFactoryInstance.from(this._table);
                    if (!isFirstConditionGenerated) {
                        conditions.push(`${queryFactoryInstance.run()}`);
                        isFirstConditionGenerated = true;
                    } else {
                        conditions.push(`${whereCondition.operator} ${queryFactoryInstance.run()}`);
                    }
                }
            });
            return ` WHERE ${conditions.join(" ")}`;
        }
    }

    /**
     * Private function to generate all order by
     * @returns {string} all order bys
     */
    private _composeOrderBy() {
        if (this._orderBy.length === 0) {
            return "";
        } else {
            const orderBys: string[] = [];
            this._orderBy.forEach((orderByElement) => {
                // Pleate note the structure of the order by is generated by _orderByObj
                const column = orderByElement.column;
                const direction = orderByElement.direction;
                orderBys.push(`{${this._table}:${column}} ${direction}`);
            });
            return ` ORDER BY ${orderBys.join(",")}`;
        }
    }

    /**
     * private function that generates the 'Group By' statement
     * @returns {string}
     */
    private _composeGroupBy() {
        if (this._groupBy.length === 0) {
            return "";
        } else {
            const groupBys: string[] = [];
            this._groupBy.forEach((groupByElement) => {
                // Pleate note the structure of the order by is generated by _orderByObj
                groupBys.push(`{${this._table}:${groupByElement}}`);
            });
            return ` GROUP BY ${groupBys.join(",")}`;
        }
    }

    /**
     * Private function that generates the LIMIT statement
     * @returns {string}
     * @private
     */
    private _composeLimit() {
        if (this._limit === "") {
            return "";
        } else {
            return ` LIMIT ${this._limit}`;
        }
    }

    /**
     * Generates a where object used within the query factory.
     * @param column
     * @param operator
     * @param criteria
     * @param whereOperator
     * @returns {condition: {criteria: *, column: *, operator: *}, operator: *, closure: *}
     * @private
     */
    private _whereObj() {
        if (arguments.length === 4) {
            const column = arguments[0];
            const operator = arguments[1];
            const criteria = arguments[2];
            const whereOperator = arguments[3];
            return {
                operator: whereOperator,
                condition: {
                    column,
                    operator,
                    criteria,
                },
                closure: null,
            };
        }

        if (arguments.length === 2) {
            const queryFactoryClosure = arguments[0];
            const whereOperator = arguments[1];
            return {
                operator: whereOperator,
                condition: null,
                closure: queryFactoryClosure,
            };
        }
    }
}
