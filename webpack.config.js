import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import S3Plugin from 'webpack-s3-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default function(options) {
  const webpackConfig = {
    entry: [
      './index.js'
    ],
    output: {
      path: __dirname + '/public',
      publicPath: '/',
      filename: 'bundle.js'
    },
    plugins: [
      new webpack.LoaderOptionsPlugin({
        options: {
          sassLoader: {
            includePaths: [__dirname + '/src']
          },
          context: '/',
          postcss: [
            require('postcss-cssnext')({browsers: 'last 2 versions'}),
            require('postcss-pxtorem')({replace: true}),
            require('postcss-reporter')(),
          ]
        }
      }),
      new ExtractTextPlugin({
        filename: 'styles.css',
        allChunks: true
      }),
      new HtmlWebpackPlugin({
        template: __dirname + '/index.html',
        favicon: './images/favicon.png',
        hash: false,
        inject: 'body'
      })
    ],
    module: {
      loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        }
      }, {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: ['css-loader?sourceMap', 'postcss-loader', 'sass-loader?sourceMap']
        })
      }, {
        test: /\.html$/,
        loader: 'html-loader'
      }, {
        test: /\.(png|jpg)$/,
        loader: 'url-loader?limit=10000'
      }, {
        test: /\.svg(\?.*)?$/,
        loader: 'url-loader?limit=10000&mimetype=image/svg+xml'
      }]
    },
    resolve: {
      modules: ['./', 'node_modules'],
      extensions: ['.js']
    }
  };

  if (options.dev) {
    webpackConfig.devtool = 'source-map';
  }

  if (options.prod) {
    webpackConfig.plugins.push(
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': 'production'
      }),
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          unused: true,
          dead_code: true,
          warnings: false
        }
      })
    );
  }

  if (options.deploy) {
    const s3Config = {};
    s3Config.s3Options = {
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
      region: process.env.S3_REGION
    };
    s3Config.s3UploadOptions = {
      Bucket: process.env.S3_BUCKET_NAME
    };
    s3Config.cloudfrontInvalidateOptions = {
      DistributionId: process.env.CF_DISTRIBUTION_ID,
      Items: ["/*"]
    };
    webpackConfig.plugins.push(
      new S3Plugin(s3Config)
    );
  }

  return webpackConfig;
}
