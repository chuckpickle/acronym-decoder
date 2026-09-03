const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: {
        'content-script': './content-script/boot.ts',
        background: './src/background.ts'
    },
    mode: 'production',
    devtool: 'source-map',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist/browser'),
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: {loader: 'ts-loader', options: {configFile: 'tsconfig.webpack.json'}},
            exclude: /node_modules/,
        },],
    },

    optimization: {
        minimizer: [new TerserPlugin({
            extractComments: false,
        })],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback:{ 
            "https": require.resolve("https-browserify"),
            "http": require.resolve("stream-http"),
            "crypto": require.resolve("crypto-browserify")
        },
    }
};