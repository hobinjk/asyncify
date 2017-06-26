function makeAsync(j, path) {
  path.node.async = true;
  path.node.params = [];

  // processEnd(j, path);
  processThen(j, path);
}

function processEnd(j, path) {
  j(path).find(j.CallExpression, {
    callee: {
      property: {
        name: 'end'
      }
    }
  }).forEach(callPath => {
    let call = callPath.node;
    let newBody = [
      j.variableDeclaration('const', [j.variableDeclarator(call.arguments[0].params[1], j.awaitExpression(call.callee.object))])
    ];
    newBody = newBody.concat(call.arguments[0].body.body);
    let statementIndex = path.node.body.body.indexOf(callPath.parentPath.node);
    path.node.body.body.splice(statementIndex, 1, ...newBody);
  });
}

function processThen(j, path) {
  let lastPromise = null;
  let paths = [];


  // upon seeing a fn, pop off the promise and replace args with let arg = await promise; body
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
      // newBody.push(
      //   j.variableDeclaration('const', [j.variableDeclarator(call.arguments[0].params[0], ret.argument)])
      // );
    }

    newBody = newBody.concat(call.arguments[0].body.body);

    let statementIndex = path.node.body.body.indexOf(callPath.parentPath.node);
    console.log(statementIndex);
    if (statementIndex >= 0) {
      path.node.body.body.splice(statementIndex, 1, ...newBody);
    } else {
      path.node.body.body = newBody.concat(path.node.body.body);
    }

    console.log(j(path).toSource());
  }
}
module.exports = function(file, api) {
  let j = api.jscodeshift;
  return j(file.source)
    .find(j.ArrowFunctionExpression)
    .forEach(path => {
      if (path.node.async) {
        return;
      }
      let parent = path.parentPath.node;
      if (parent.type !== 'CallExpression') {
        return;
      }
      if (parent.callee.name !== 'it') {
        return;
      }
      makeAsync(j, path);
    })
    .toSource();
};

module.exports.parser = 'babel';
