// Regex to validate to validate inputs
export const REGEX = {
    DIGITS: /^\d+$/,
    CHARACTERS_DIGITS_UNDERSCORE: /^\'?\w+\'?$/,
    CHARACTERS_DIGITS_UNDERSCORE_DASH: /^\(?(\'?(\w|-|\.)+\'?\,?)+\)?$/,
    DATETIME: /^(\w|-|:|\.)+$/,
    // Filters on internal functional
    FUNCTION_DATE: /^FUNC_\w+\((\{\w+:\w+\}|[a-zA-Z]+\((\d|\'|,|-)+\))\)$/,
    FUNCTION_DATETIME: /^FUNC_date(\w+)?\(substr\((\{(\w|-)+:(\w|-|\.)+\}|\'(\w|-|:|\.)+\')(\d|\'|,|-)+\)\)/,
};

// Default Exceptions and messages. This object is used to throw Exceptions
export const EXCEPTIONS = {
    CHARACTERS_DIGITS_UNDERSCORE: "QueryFactory: Only characters, digits and underscores are accepted",
    CHARACTERS_DIGITS_UNDERSCORE_DASH: "QueryFactory: Only characters, digits, underscores, and dashes are accepted",
    DIGITS: "QueryFactory: Only digits expected",
    WHITELISTED_OPERATORS: "QueryFactory: Operator not recognized or not whitelisted",
    WHITELISTED_DIRECTIONS: "QueryFactrory: Unknown direction",
    WHERE_FUNCTION_PARAMETER: "QueryFactory: where method expects function as parameter",
};

export const FUNC_STR = "FUNC_";
