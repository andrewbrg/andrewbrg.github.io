const path = require('path');
const autoprefixer = require('autoprefixer');
const copyWebpackPlugin = require('copy-webpack-plugin');
const extractTextPlugin = require('extract-text-webpack-plugin');
const extractSCSS = new extractTextPlugin('../css/index.css');

module.exports = (env, argv) => {
    const config = {
        mode: argv.mode || 'development',
        debug: ('production' !== argv.mode),
        minimize: ('production' === argv.mode),
        sourceMap: ('production' !== argv.mode),
        comments: ('production' !== argv.mode)
    };

    return {
        mode: config.mode,
        devtool: false,
        entry: {
            main: [
                path.resolve(__dirname, 'js/index.js'),
                path.resolve(__dirname, 'scss/index.scss')
            ]
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, '../dist/assets/js'),
            publicPath: 'assets/js'
        },
        performance: {
            hints: false
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            comments: config.comments,
                            minified: config.minimize,
                            presets: [
                                ['env', {
                                    'targets': {'browsers': ['last 2 versions', 'safari >= 6']},
                                    'debug': config.debug,
                                    'modules': 'commonjs',
                                    'include': ['transform-es2015-arrow-functions']
                                }]
                            ],
                            plugins: ['transform-runtime']
                        }
                    }
                },
                {
                    test: /index\.scss$/,
                    use: extractSCSS.extract({
                        use: [
                            {loader: 'css-loader', options: {minimize: config.minimize}},
                            {loader: 'postcss-loader', options: {plugins: [autoprefixer]}},
                            {loader: 'sass-loader'}
                        ]
                    })
                }
            ]
        },
        plugins: [
            extractSCSS,
            new copyWebpackPlugin([{from: 'index.html', to: '../../index.html'}]),
            new copyWebpackPlugin([{from: 'js/textures/blue-noise.jpg', to: '../../assets/img/blue-noise.jpg'}])
        ],
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    }
};