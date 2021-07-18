/**
 * private function to check if a expression is valid or not.
 * It checks whether the expression has valid characters.
 * Will also check if the expression is a function using the date or datetime method
 * @param expression
 * @returns {boolean}
 * @private
 */
import { FUNC_STR, REGEX } from "utilities/factories/smart-query/SmartQueryConstants";

export function _isValidExpression(expression: string) {
    return (
        REGEX.CHARACTERS_DIGITS_UNDERSCORE_DASH.test(expression) ||
        REGEX.FUNCTION_DATE.test(expression) ||
        REGEX.FUNCTION_DATETIME.test(expression)
    );
}

/**
 * Generates the 'order By' objected used within query factory
 * @param column
 * @param direction
 * @returns {{column: *, direction: *}}
 * @private
 */
export function _orderObj(column: string, direction: string) {
    return {
        column,
        direction,
    };
}

/**
 * Private function to check if a provided string is flagged as a function. A string is flagged as a function
 * if the the string is appended with the "FUNC_STR" constant.
 * @param {string} str - string to check if it is a function
 * @returns {boolean}
 */
export function _isFunc(str: string) {
    return str.substr(0, FUNC_STR.length) === FUNC_STR;
}

/**
 * Private function to remove the prefix "FUNC_STR" from a string.
 * @param str
 * @returns {string}
 */
export function _clearFunc(str: string) {
    var res = "";
    if (_isFunc(str)) {
        res = str.substr(FUNC_STR.length);
    } else {
        res = str;
    }
    return res;
}

/**
 * Private function to compose a column string of format {table:column}
 * @param {string} table is the table name
 * @param {string} column is the colum name
 * @returns {string} {table:column}
 */
export function _composeColumn(table: string, column: string) {
    return `{${table}:${column}}`;
}

/**
 * Private function to compose the list of columns
 * @param {string} table is the table name
 * @param {[string]} columns contains the column names
 * @returns {string} columns seperated by a ,
 */
export function _composeColumns(table: string, columns: string[]) {
    let cols: string[] = [];
    columns.forEach(function (column) {
        cols.push(_composeColumn(table, column));
    });
    return cols.join(",");
}

/**
 * Private function to compose the table string
 * @param {string} table
 * @returns {string} "{table}"
 */
export function _composeTable(table: string) {
    return `{${table}}`;
}

/**
 * Private function to generate one where condition
 * @param {string} column is the name of the field
 * @param {string} operator
 * @param {string} criteria
 * @return {string} generated where condition
 */
export function _composeCondition(table: string, column: string, operator: string, criteria: string) {
    // check provided column contains a function flag of the column field is function
    if (_isFunc(column)) {
        // column is a function then sanitize the column field and the criteria field
        return `${_clearFunc(column)} ${operator} ${_clearFunc(criteria)}`;
    } else {
        // column is not a function, then
        return `{${table}:${column}} ${operator} ${criteria}`;
    }
}
