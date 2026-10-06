const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const path = require("path");
const webpack = require("webpack");
const includeEnv = require("svelte-environment-variables");
const sveltePreprocess = require("svelte-preprocess");
const pkg = require("./package.json");

const mode = process.env.NODE_ENV || (process.argv.includes("production") ? "production" : "development");
const prod = mode === "production";

module.exports = {
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
  },
  resolve: {
    alias: {
      svelte: path.resolve("node_modules", "svelte"),
    },
    extensions: [".mjs", ".js", ".ts", ".svelte"],
    mainFields: ["svelte", "browser", "module", "main"],
    conditionNames: ["svelte", "browser", "import", "require", "default"],
  },
  devServer: {
    port: 4000,
    historyApiFallback: true,
    allowedHosts: "all",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.svelte$/,
        use: {
          loader: "svelte-loader",
          options: {
            compilerOptions: { dev: !prod },
            emitCss: prod,
            hotReload: !prod,
            preprocess: sveltePreprocess({ sourceMap: true }),
          },
        },
      },
      {
        test: /\.(m?js|ts)/,
        type: "javascript/auto",
        resolve: { fullySpecified: false },
      },
      {
        test: /\.css$/,
        use: [
          prod ? MiniCssExtractPlugin.loader : "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: { tailwindcss: {}, autoprefixer: {} },
              },
            },
          },
        ],
      },
    ],
  },
  mode,
  plugins: [
    new webpack.DefinePlugin({ ...includeEnv() }),
    new ModuleFederationPlugin({
      name: "client",
      filename: "remoteEntry.js",
      remotes: process.env.CONTAINER_NAME && process.env.SVELTE_APP_REMOTE_URL
        ? { App: `${process.env.CONTAINER_NAME}@${process.env.SVELTE_APP_REMOTE_URL}/remoteEntry.js` }
        : {},
      exposes: {},
      shared: {
        svelte: {
          singleton: true,
          eager: true,
          requiredVersion: pkg.devDependencies.svelte,
        },
        "svelte/internal": {
          singleton: true,
          eager: true,
          version: pkg.devDependencies.svelte,
          requiredVersion: pkg.devDependencies.svelte,
        },
        "svelte/store": {
          singleton: true,
          eager: true,
          version: pkg.devDependencies.svelte,
          requiredVersion: pkg.devDependencies.svelte,
        },
      },
    }),
    new MiniCssExtractPlugin({ filename: "[name].css" }),
    new HtmlWebpackPlugin({ template: "./src/index.html" }),
  ],
  devtool: prod ? false : "source-map",
};
