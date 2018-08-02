const path = require("path");
const cp = require("child_process");

let args = [];
["js", "wasm"].forEach(mode => {
    [
        ["nb", [1000], 10],
        ["edb", [100], 20],
        ["sb", [100], 10],
        ["csb", [100], 20],
        ["bwc", [1000], 20]
    ].forEach(test => {
        test[1].forEach(size => {
            let arg = [
                "-s",
                test[2] || 10,
                "-m",
                mode,
                `--${test[0]}`,
                size,
                "--note",
                `_${mode}_${test[0]}_${size}_`
            ];
            args.push(arg);
        });
    });
});

args.forEach(arg => {
    arg = [path.join(__dirname, "../benchmark/benchmarkFixtures.js")].concat(
        arg
    );
    cp.execFileSync("node", arg, {
        stdio: "inherit"
    });
});
