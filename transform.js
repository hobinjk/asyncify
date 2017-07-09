function makeAsync(j, path) {
  // processEnd(j, path);
  if (processThen(j, path)) {
    path.node.async = true;

    // Special-case running in a Mocha/Jest test declaration, removing the
    // `done` parameter
    let parent = path.parentPath.node;
    if (parent.type !== 'CallExpression') {
      return;
    }
    if (parent.callee.name !== 'it') {
      return;
    }
    path.node.params = [];
  }
}

/**
 * Convert from `call().end((err, res) => {})` to async/await given that `call()`
 * returns a promise.
 * @param j - jscodeshift api instance
 * @param path - path descriptor
 */
function processEnd(j, path) {
  // Find the .end() call
  j(path).find(j.CallExpression, {
    callee: {
      property: {
        name: 'end'
      }
    }
  }).forEach(callPath => {
    // Replace with const {second argument of end's function} = await call()
    let call = callPath.node;
    let newBody = [
      j.variableDeclaration('const', [j.variableDeclarator(call.arguments[0].params[1], j.awaitExpression(call.callee.object))])
    ];
    newBody = newBody.concat(call.arguments[0].body.body);
    let statementIndex = path.node.body.body.indexOf(callPath.parentPath.node);
    path.node.body.body.splice(statementIndex, 1, ...newBody);
  });
}

/**
 * Convert from `call().then(res => {})` to `const res = await call()`
 * @param j - jscodeshift api instance
 * @param path - path descriptor
 */
function processThen(j, path) {
  let lastPromise = null;
  let paths = [];
  let anyTransformed = false;


  // upon seeing a fn, pop off the promise and replace args with const arg = await promise; body
  j(path).find(j.CallExpression, {
    callee: {
      property: {
        name: 'then'
      }
    }
  }).forEach(callPath => {
    paths.push(callPath);
  });


  while (true) {
    if (paths.length === 0) {
      break;
    }

    let callPath = paths.pop();
    let call = callPath.node;
    let callBody = call.arguments[0].body.body;
    let awaited = lastPromise || call.callee.object;
    let newBody = [
      j.variableDeclaration('const', [j.variableDeclarator(call.arguments[0].params[0], j.awaitExpression(awaited))])
    ];

    if (callBody[callBody.length - 1].type === 'ReturnStatement') {
      lastPromise = callBody.pop().argument;
    }

    newBody = newBody.concat(call.arguments[0].body.body);

    let statementIndex = path.node.body.body.indexOf(callPath.parentPath.node);
    if (statementIndex >= 0) {
      path.node.body.body.splice(statementIndex, 1, ...newBody);
    } else {
      path.node.body.body = newBody.concat(path.node.body.body);
    }
    anyTransformed = true;
  }

  // TODO: If the promise chain is returned append lastPromise to path.node.body.body

  return anyTransformed;
}

function processCollection(j, collection) {
  collection.forEach(path => {
    if (path.node.async) {
      return;
    }
    makeAsync(j, path);
  });
}

module.exports = function(file, api) {
  let j = api.jscodeshift;
  let source = j(file.source)
  processCollection(j, source.find(j.ArrowFunctionExpression));
  processCollection(j, source.find(j.FunctionExpression));
  processCollection(j, source.find(j.FunctionDeclaration));
  return source.toSource();
};

module.exports.parser = 'babel';
