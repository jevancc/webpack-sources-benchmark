const path = require("path");
const cp = require("child_process");

let args = [];
["js", "wasm"].forEach(mode => {
    [
        ["nb", [1000]],
        ["edb", [100]],
        ["sb", [100]],
        ["csb", [100]],
        ["bwc", [1000]]
    ].forEach(test => {
        test[1].forEach(size => {
            args.push([
                "-s",
                10,
                "-m",
                mode,
                `--${test[0]}`,
                size,
                "--note",
                `_${mode}_${test[0]}_${size}_`
            ]);
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
