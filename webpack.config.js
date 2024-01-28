const path = require('path');

// Webpack configuration to pack the app that runs in the webview (/src/app)
// This is the code that will be executed in the webview, and it
// is convinient to use webpack to pack it and insert it into the
// index.html file. The rest of the extension is packed using
// the vsce tool.
module.exports = {
    context: path.resolve('src', 'app'),
    entry: './app.ts',
    output: {
        path: path.resolve('out'),
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                // Make a regex equivalent of above exclude
                include(value) {
                    return value.indexOf('app') !== -1;
                },
            },
        ]
    },
};