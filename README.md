# Asyncify

JSCodeshift tool to transform promises to async/await. Currently only verified
to sort-of-work on mocha/jest test functions that have easy-to-transform
promise chains.

## Usage
```shell
jscodeshift --babel -d -p -t transform.js <file-to-transform.js>
```
Only remove the `-d` if you're ready for this barely tested code to overwrite all of your files

