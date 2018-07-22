const path = require("path");
const fs = require("fs");
const cp = require("child_process");
const mock = require("mock-require");
const clearRequire = require("clear-require");

let webpack = require("webpack");
let webpackSources = require("webpack-sources");

function setWebpackSourcesMode(mode) {
    if (mode === "js") {
        clearRequire.all();
        mock.stop("webpack-sources");
        webpack = mock.reRequire("webpack");
        webpackSources = mock.reRequire("webpack-sources");
        if (webpackSources.clear) {
            throw new Error("Require webpack-sources failed");
        }
    } else if (mode === "wasm") {
        clearRequire.all();
        mock("webpack-sources", "wasm-webpack-sources");
        webpack = mock.reRequire("webpack");
        webpackSources = mock.reRequire("webpack-sources");
        if (!webpackSources.clear) {
            throw new Error("Mock require wasm-webpack-sources failed");
        }
    } else {
        throw new Error("Invalid webpack-sources mode");
    }
}
module.exports.setWebpackSourcesMode = setWebpackSourcesMode;

function build(options, callback) {
    const config = {
        context: options.context,
        entry: options.entry,
        output: {
            path: options.output,
            filename: "bundle.js"
        }
    };
    if (options.devtool) {
        config.devtool = options.devtool;
    }

    const compiler = webpack(config);
    compiler.run((err, stats) => {
        if (err) {
            throw err;
        } else {
            if (webpackSources.clear) {
                webpackSources.clear();
            }
            callback();
        }
    });
}
module.exports.build = build;
