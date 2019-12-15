'use strict';

process.env.BABEL_ENV = 'main';

const path = require('path');
const {dependencies} = require('../package.json');
const webpack = require('webpack');

let modulesConfig = {
    entry: {
        unzip: path.join(__dirname, '../src/modules/unzip.ts'),
        process: path.join(__dirname, '../src/modules/process.ts'),
        image: path.join(__dirname, '../src/modules/image.ts')
    },
    externals: [
        ...Object.keys(dependencies || {})
    ],
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    node: {
        __dirname: process.env.NODE_ENV !== 'production',
        __filename: process.env.NODE_ENV !== 'production'
    },
    output: {
        filename: '[name].js',
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '../dist/electron')
    },
    plugins: [
        new webpack.NoEmitOnErrorsPlugin()
    ],
    resolve: {
        extensions: ['.js', '.json', '.node']
    },
    target: 'node'
};

module.exports = modulesConfig;
