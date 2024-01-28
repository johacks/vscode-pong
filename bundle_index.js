// Purpose: Bundles the index.html and bundle.js files together
const path = require('path');
const fs = require('fs');

// Open out/bundle.js and src/index.html:
fs.readFile(path.resolve('out', 'bundle.js'), 'utf8', (err, bundle) => {
    if (err) {
        console.error(err);
        return;
    }
    fs.readFile(path.resolve('src', 'index.html'), 'utf8', (err, html) => {
        if (err) {
            console.error(err);
            return;
        }
        // Code here to replace the script tag with the contents of bundle.js
        const newHtml = html.replace('/*--webpack-bundle--*/', bundle);
        fs.writeFile(path.resolve('out', 'index.html'), newHtml, (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log('Successfully bundled!');
        });
    });
});