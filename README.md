# dependency-check-plugin

A webpack plugin that checks dependencies of your package.json file by stats data.

## Installation

```bash
npm install --save-dev dependency-check-plugin
yarn add --dev dependency-check-plugin
```

## Usage

```JS
// webpack.config.js

const { DependencyCheckPlugin } = require('dependency-check-plugin');

module.exports = {
  plugins: [new DependencyCheckPlugin()],
};
```

## Examples

```JS
// main.js

import { merge } from 'lodash-es';
import dayjs from 'dayjs';
```

```JS
// api.js

import axios from 'axios';
```

```JSON
// package.json

  "dependencies": {
    "axios": "^0.27.2",
    "dayjs": "^1.11.1",
    "moment": "^2.29.3"
  },
  "devDependencies": {
    "lodash-es": "^4.17.21"
  }
```

```JS
// webpack.config.js

const { DependencyCheckPlugin } = require('dependency-check-plugin');

module.exports = {
  entry: {
    main: './src/main.js',
    api: './src/api.js',
  },
  plugins: [new DependencyCheckPlugin()],
};
```

output:

```bash
Bundled dependencies:
* dayjs      ./src/main.js
* axios      ./src/api.js
* lodash-es  ./src/main.js
Missing dependencies:
* lodash-es
Unused dependencies:
* moment
```

## Options

### new DependencyCheckPlugin(options)

- options (Object|undefined)

  - statsOptions (Object|undefined)

  - checkOptions (Object|undefined)

    - moduleFilter (Function|undefined)

    - checkKeys (Array|String|undefined)

    - onDone (Function|undefined)
