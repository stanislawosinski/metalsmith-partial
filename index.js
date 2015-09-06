
var fs = require('fs');
var extend = require('extend');
var consolidate = require('consolidate');

module.exports = plugin;

/**
 * @param {Object} options
 * @param {String} options.engine is engine name in consolidate.js
 * @param {String} options.directory is directory to put partial files.
 */
function plugin(options) {
  options = extend({
    directory: 'partials',
    preload: false
  }, options || {});

  if (!options.engine) {
    throw new Error('options.engine is required.');
  }

  return function(files, metalsmith, done) {

    metalsmith.metadata().partial = function(name, params) {
      var path = metalsmith.path(options.directory, name);
      var partialContents = fs.readFileSync(path).toString('utf8');
      var context = params ? extend({}, params, this) : extend({}, this);

      var result = null;
      var promise = new Promise(function (resolve, reject) {
        // There is some weirdness in consolidate.js API -- the returned promise is resolved
        // properly ONLY if we don't provide the callback function. If we do provide the callback,
        // a dead promise is returned (one that will never resolve or reject).
        // For this reason, to handle both synchronous and asynchronous rendering, we have to create 
        // and resolve our own promise here.
        consolidate[options.engine].render(partialContents, context, function(error, rendered) {
          if (error) {
            reject(error);
            throw new Error(error);
          }

          result = rendered;
          resolve(rendered);
        });
      });

      // If the result was not computed synchronously, return a promise.
      return result === null ? promise : result;
    };

    done();
  };
}
