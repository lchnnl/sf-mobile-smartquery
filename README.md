# Salesforce Mobile Smart Query factory

## JS Library to securely generate Smart Queries used by Salesforce Mobile SDK. This library prevents SQL injections. It can be used in React Native or Cordova apps.

### Why Use This Library
When Salesforce [SmartSQL Queries](https://developer.salesforce.com/docs/atlas.en-us.noversion.mobile_sdk.meta/mobile_sdk/offline_smart_sql.htm) has to be dynamically generated based on user input, it is very easy to introduce SQL injections. This library parses all inputs and generates a query that can be consumed by [Salesforce SmartStore](https://developer.salesforce.com/docs/atlas.en-us.noversion.mobile_sdk.meta/mobile_sdk/offline_intro.htm)

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
import {SmartQuery} from 'lchnnl/sf-mobile-smartquery'; 

const q = new SmartQuery();
q.select('_soup');
q.from('Account');
q.run() // output: SELECT {Account:_soup} from {Account}

// Chaining functions
const q = new SmartQuery();
q.select('Id', 'Name')
.from('Account')
.where('Id', '=', `'001XXXXXXXXXXX'`)
.run() // output: SELECT {Account:Id}, {Account:Name} FROM {Account} WHERE {Account:Id} = '001XXXXXXXXXXX'
```

More examples can be found in the [test fille](./src/SmartQuery.test.ts)
