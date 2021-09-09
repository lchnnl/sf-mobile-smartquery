# Salesforce Mobile Smart Query factory

## JS Library to securely generate Smart Queries used by Salesforce Mobile SDK. This library prevents SQL injections. It can be used in React Native or Cordova apps.

### Why Use This Library
When Salesforce [SmartSQL Queries](https://developer.salesforce.com/docs/atlas.en-us.noversion.mobile_sdk.meta/mobile_sdk/offline_smart_sql.htm) has to be dynamically generated based on user input, it is very easy to introduce SQL injections. This library parses all inputs and generates a query that can be consumed by [Salesforce SmartStore](https://developer.salesforce.com/docs/atlas.en-us.noversion.mobile_sdk.meta/mobile_sdk/offline_intro.htm)

This library allows you to generate most basic [SmartSQL Queries](https://developer.salesforce.com/docs/atlas.en-us.noversion.mobile_sdk.meta/mobile_sdk/offline_smart_sql.htm). This library does not support the creation of comples queries (yet). For more examples please checkout the [test scripts](./src/SmartQuery.test.ts)

## Installation

Install using npm or yarn

```
npm install sf-mobile-smartquery
```
or
```typescript
yarn add sf-mobile-smartquery
```


### Usage
```typescript
import {SmartQuery} from 'sf-mobile-smartquery'; 

// Regular usage
const q = new SmartQuery();
q.select(['_soup']);
q.from('Account');
q.run() // output: SELECT {Account:_soup} from {Account}

// Chaining functions
const q = new SmartQuery();
q.select(['Id', 'Name'])
.from('Account')
.where('Id', '=', `'001XXXXXXXXXXX'`)
.run() // output: SELECT {Account:Id}, {Account:Name} FROM {Account} WHERE {Account:Id} = '001XXXXXXXXXXX'

// Capturing errors
import {SmartQuery, EXCEPTIONS} from 'sf-mobile-smartquery';
try {
  const q = new SmartQuery()
  q.select(['_soup']);
  q.from(`Account' `);  // Spaces and quotes are not allowed. An exception is thrown
  const query = q.run();
} catch (e) {
  console.log(e) // Error instance is thrown
}

```

More examples can be found in the [test scripts](./src/SmartQuery.test.ts)
