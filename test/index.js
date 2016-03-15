/* eslint-env mocha */
import jsonImporter from '../src/index';
import sass         from 'node-sass';
import {expect}     from 'chai';
import {resolve}    from 'path';

const EXPECTATION = 'body {\n  color: #c33; }\n';

function sassRenderFile(opts = {}) {
  return function(file) {
    return sass.renderSync({
      file: file,
      importer: jsonImporter,
      ...opts
    });
  }
}

function testExpectedCSS(result) {
    expect(result.css.toString()).to.eql(EXPECTATION);
}


describe('Import type test', function() {

  it('imports strings', function() {
    ['./test/fixtures/strings/style.scss',
      './test/fixtures/strings/style-js.scss'
    ].map(sassRenderFile()).forEach(testExpectedCSS);
  });

  it('imports lists', function() {
    ['./test/fixtures/lists/style.scss',
      './test/fixtures/lists/style-js.scss'
    ].map(sassRenderFile()).forEach(testExpectedCSS);
  });

  it('imports maps', function() {
    ['./test/fixtures/maps/style.scss',
      './test/fixtures/maps/style-js.scss'
    ].map(sassRenderFile()).forEach(testExpectedCSS);
  });

  it('finds imports via includePaths', function() {
    ['./test/fixtures/include-paths/style.scss',
      './test/fixtures/include-paths/style-js.scss'
    ].map(sassRenderFile({
      includePaths: ['./test/fixtures/include-paths/variables']
    })).forEach(testExpectedCSS);
  });

  it('finds imports via multiple includePaths', function() {
    ['./test/fixtures/include-paths/style.scss',
      './test/fixtures/include-paths/style-js.scss'
    ].map(sassRenderFile({
      includePaths: ['./test/fixtures/include-paths/variables', './some/other/path/']
    })).forEach(testExpectedCSS);
  });

  it('quotes strings and preserves numbers, floats, colors, and values with units', function() {
    ['./test/fixtures/convert-strings/style-js.scss',
      './test/fixtures/convert-strings/style.scss'
    ].map(sassRenderFile()).forEach(function(result) {
      expect(result.css.toString()).to.eql(`body {\n  content: 'Lorem ipsum, ("foo", bar)';\n  color: #c33, white, black, #0a0000, blue;\n  font-size: 2.3em;\n  margin-top: 5px;\n  margin-bottom: 5.5em; }\n`);
    });
  });

  it(`strips non-valid JSON values from JS exports`, function() {
    function render() {
      sass.renderSync({
        file: './test/fixtures/wrong-js-export/style-js.scss',
        importer: jsonImporter
      });
    }
    expect(render).to.throw(`Undefined variable: "$color-red".`)
  });

  it(`throws when an import doesn't exist`, function() {
    function render(file) {
      return function() {
        sass.renderSync({
          file: file,
          includePaths: ['./test/fixtures/include-paths/foo'],
          importer: jsonImporter
        });
      }
    }

    expect(render('./test/fixtures/include-paths/style.scss')).to.throw(
      'Unable to find "variables.json" from the following path(s): ' +
      `${resolve(process.cwd(), 'test/fixtures/include-paths')}, ./test/fixtures/include-paths/foo. ` +
      'Check includePaths.'
    );
    expect(render('./test/fixtures/include-paths/style-js.scss')).to.throw(
      'Unable to find "variables.js" from the following path(s): ' +
      `${resolve(process.cwd(), 'test/fixtures/include-paths')}, ./test/fixtures/include-paths/foo. ` +
      'Check includePaths.'
    );
  });
});
