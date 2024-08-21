/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const { resolve } = require('path');
const path = require('path');

const CONFIG = {
  mode: 'development',
  entry: {
    app: './app.js'
  },
  devServer: {
    historyApiFallback: true,
    static: "./"
  },
  output: {
    filename:'app.js',
    publicPath: 'auto',
    path: path.resolve(__dirname, 'public')
  },
  resolve: {
    alias: {
      'arlas-d3': resolve('dist/index.js')
    }
  }
};

// This line enables bundling against src in this repo rather than installed module
module.exports = CONFIG;