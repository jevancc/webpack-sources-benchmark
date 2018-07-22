const path = require("path");
const fs = require("fs");
const moment = require("moment");
const Benchmark = require("benchmark");
const run = require("./run");
const argv = require("yargs")
    .option("mode", {
        alias: "m",
        describe: "The mode/implementation of package webpack-sources",
        choices: ["js", "wasm"],
        demandOption: true
    })
    .option("output", {
        alias: "o",
        describe: "The log output path",
        default: path.join(__dirname, "../log")
    })
    .option("samples", {
        alias: "s",
        describe:
            "The minimum sample size required to perform statistical analysis",
        type: "number",
        default: 20
    })
    .option("all", {
        describe: "Test all with default sizes",
        type: "boolean",
        default: false
    })
    .option("nb", {
        describe:
            "Test 'normal-build' with specified size(s), -1 to test with default sizes",
        type: "array",
        default: []
    })
    .option("edb", {
        describe:
            "Test 'eval-dev-build' with specified size(s), -1 to test with default sizes",
        type: "array",
        default: []
    })
    .option("sb", {
        describe:
            "Test 'sourcemap-build' with specified size(s), -1 to test with default sizes",
        type: "array",
        default: []
    })
    .option("csb", {
        describe:
            "Test 'cheap-sourcemap-build' with specified size(s), -1 to test with default sizes",
        type: "array",
        default: []
    })
    .option("bwc", {
        describe:
            "Test 'build-with-chunks' with specified size(s), -1 to test with default sizes",
        type: "array",
        default: []
    })
    .option("note", {
        type: "string",
        default: ""
    })
    .help().argv;

const outputPath = path.join(__dirname, "js");
const fixtures = path.join(__dirname, "fixtures");

const benchmarkOptions = {
    defer: true,
    onCycle: function() {
        process.stderr.write(".");
    },
    minSamples: argv.samples
};

const tests = {
    "normal-build": [
        [0, 1, 5, 10, 50, 100, 200],
        (size, deferred) => {
            run.build(
                {
                    context: fixtures,
                    entry: `./${size}.js`,
                    output: outputPath
                },
                () => {
                    deferred.resolve();
                }
            );
        },
        "nb"
    ],
    "eval-dev-build": [
        [0, 1, 2, 5, 10, 15],
        (size, deferred) => {
            run.build(
                {
                    context: fixtures,
                    entry: `./${size}.big.js`,
                    output: outputPath,
                    devtool: "eval"
                },
                () => {
                    deferred.resolve();
                }
            );
        },
        "edb"
    ],
    "sourcemap-build": [
        [0, 1, 2, 5, 10, 15],
        (size, deferred) => {
            run.build(
                {
                    context: fixtures,
                    entry: `./${size}.big.js`,
                    output: outputPath,
                    devtool: "source-map"
                },
                () => {
                    deferred.resolve();
                }
            );
        },
        "sb"
    ],
    "cheap-sourcemap-build": [
        [0, 1, 2, 5, 10, 15],
        (size, deferred) => {
            run.build(
                {
                    context: fixtures,
                    entry: `./${size}.big.js`,
                    output: outputPath,
                    devtool: "cheap-source-map"
                },
                () => {
                    deferred.resolve();
                }
            );
        },
        "csb"
    ],
    "build-with-chunks": [
        [0, 1, 5, 10, 50, 100, 200],
        (size, deferred) => {
            run.build(
                {
                    context: fixtures,
                    entry: `./${size}.async.js`,
                    output: outputPath
                },
                () => {
                    deferred.resolve();
                }
            );
        },
        "bwc"
    ]
};

const suite = new Benchmark.Suite();

run.setWebpackSourcesMode(argv.mode);
Object.keys(tests).forEach(name => {
    const test = tests[name];
    let sizes = argv[test[2]].map(parseInt);
    if (sizes.includes(-1)) {
        sizes = test[0];
    }
    sizes.forEach(size => {
        suite.add(
            `${name}:${size}`,
            deferred => {
                test[1](size, deferred);
            },
            benchmarkOptions
        );
    });
});

let result = [];
suite.on("cycle", event => {
    process.stderr.write("\n");
    const b = event.target;
    console.log(
        b.name +
            "\t" +
            Math.floor(1000 * b.stats.mean) +
            "\t" +
            Math.floor(1000 * (b.stats.mean - b.stats.moe)) +
            "\t" +
            Math.floor(1000 * (b.stats.mean + b.stats.moe))
    );
    result.push({
        name: b.name,
        mean: Math.floor(1000 * b.stats.mean),
        max: Math.floor(1000 * (b.stats.mean + b.stats.moe)),
        min: Math.floor(1000 * (b.stats.mean - b.stats.moe))
    });
    run.setWebpackSourcesMode(argv.mode);
});

suite.on("complete", event => {
    if (argv.output !== "null") {
        let dir = path.resolve(argv.output);
        try {
            fs.mkdirSync(dir);
        } catch (e) {
            // The directory already exists
        }
        let note = argv.note ? "_" + argv.note : "_log";
        let filename = path.join(
            dir,
            moment().format("MM-DD_HH-mm") + note + ".json"
        );
        console.log("Writing log to " + filename);
        fs.writeFileSync(filename, JSON.stringify(result, null, 4));
    }
});

suite.run({
    async: true
});
