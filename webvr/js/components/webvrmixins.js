(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global AFRAME, THREE */
var parse = require('./parser/main').parse

var ANode = AFRAME.ANode;
var styleStringify = AFRAME.utils.styleParser.stringify;

var xhrLoader = new THREE.XHRLoader();

var AStyle = document.registerElement('a-style', {
  prototype: Object.create(ANode.prototype, {
    createdCallback: {
      value: function () {
        // Will make <a-asset-item> wait for load.
        this.isAssetItem = true;
      }
    },

    attachedCallback: {
      value: function () {
        var self = this;
        var src = this.getAttribute('src');

        xhrLoader.load(src, function (textResponse) {
          self.injectMixins(textResponse);
        });
      }
    },

    /**
     * Parse data and inject <a-mixin>s as children of <a-style>.
     */
    injectMixins: {
      value: function (mssContent) {
        var self = this;

        // Parse.
        var mixins = parse(mssContent).mixins;

        // Loop over mixins.
        Object.keys(mixins).forEach(function (id) {
          var mixinEl = document.createElement('a-mixin');
          mixinEl.setAttribute('id', id);

          // Loop over components.
          Object.keys(mixins[id]).forEach(function (componentName) {
            var props = mixins[id][componentName];
            var value = props.constructor === Object ? styleStringify(props) : props;
            mixinEl.setAttribute(componentName, value);
          });

          self.appendChild(mixinEl);
        });

        ANode.prototype.load.call(self);
      }
    }
  })
});

module.exports = {
  AStyle: AStyle,
  parse: parse
};

},{"./parser/main":5}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":4}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.17 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var main = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,16],$V1=[1,4],$V2=[1,5],$V3=[1,6],$V4=[1,13],$V5=[1,16,45,47,48],$V6=[2,49],$V7=[2,47],$V8=[1,18],$V9=[2,46],$Va=[1,21],$Vb=[1,7,9,13,14,16,17,19,21,26,28,33,34,35,36,37,38,39,41,42,43,44,45,47,48],$Vc=[16,17,21],$Vd=[1,29],$Ve=[1,30],$Vf=[16,17,21,45],$Vg=[26,45],$Vh=[7,9,13,14,16,33,34,35,36,37,39,44],$Vi=[1,57],$Vj=[1,59],$Vk=[1,55],$Vl=[1,56],$Vm=[1,58],$Vn=[1,50],$Vo=[1,51],$Vp=[1,52],$Vq=[1,53],$Vr=[1,54],$Vs=[1,60],$Vt=[1,62],$Vu=[1,67],$Vv=[1,68],$Vw=[1,69],$Vx=[7,9,13,14,16,28,33,34,35,36,37,38,39,41,42,43,44,45],$Vy=[7,9,13,14,16,28,33,34,35,36,37,38,39,41,42,43,44],$Vz=[33,34,35,36,37];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"stylesheet":3,"space_cdata_list":4,"general_list":5,"string_or_uri":6,"STRING":7,"wempty":8,"URI":9,"general_item":10,"ruleset":11,"unary_operator":12,"-":13,"+":14,"property_name":15,"IDENT":16,"*":17,"mixin_name":18,"{":19,"component_list":20,"}":21,"whitespace":22,"component_name":23,"property":24,"multi_prop_component":25,":":26,"expr":27,";":28,"term":29,"operator":30,"computable_term":31,"string_term":32,"NUMBER":33,"PERCENTAGE":34,"ANGLE":35,"TIME":36,"FUNCTION":37,")":38,"UNICODERANGE":39,"hexcolor":40,"/":41,",":42,"=":43,"HASH":44,"S":45,"space_cdata":46,"CDO":47,"CDC":48,"$accept":0,"$end":1},
terminals_: {2:"error",7:"STRING",9:"URI",13:"-",14:"+",16:"IDENT",17:"*",19:"{",21:"}",26:":",28:";",33:"NUMBER",34:"PERCENTAGE",35:"ANGLE",36:"TIME",37:"FUNCTION",38:")",39:"UNICODERANGE",41:"/",42:",",43:"=",44:"HASH",45:"S",47:"CDO",48:"CDC"},
productions_: [0,[3,2],[6,2],[6,2],[5,1],[5,2],[5,0],[10,1],[10,1],[12,1],[12,1],[15,2],[15,3],[11,7],[18,2],[23,2],[20,1],[20,2],[20,1],[20,2],[25,7],[24,7],[24,1],[27,1],[27,3],[27,2],[29,1],[29,2],[29,1],[31,2],[31,2],[31,2],[31,2],[31,5],[32,2],[32,2],[32,2],[32,2],[32,1],[30,2],[30,2],[30,2],[30,0],[40,2],[22,1],[22,2],[8,1],[8,0],[4,1],[4,2],[4,0],[46,1],[46,1],[46,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:

      this.$ = {};
      // $$[$0] respectively corresponds to output of general_list.
      if ($$[$0]) {
        this.$['mixins'] = $$[$0];
      }
      return this.$;
    
break;
case 2: case 3: case 11: case 14: case 15: case 29: case 30: case 31: case 32: case 34: case 35: case 36: case 37: case 39: case 40: case 41: case 43:
this.$ = $$[$0-1];
break;
case 4:

      this.$ = {};
      if ($$[$0] === null) { return; }
      var mixinName = $$[$0].id;
      var components = $$[$0].components;
      this.$[mixinName] = components;
    
break;
case 5:

      this.$ = $$[$0-1];
      if ($$[$0] === null) { return; }
      var mixinName = $$[$0].id;
      var components = $$[$0].components;
      this.$[mixinName] = components;
    
break;
case 6: case 8: case 22: case 48: case 49: case 51: case 52: case 53:
this.$ = null;
break;
case 7: case 9: case 10: case 23: case 26: case 28: case 38: case 46:
this.$ = $$[$0];
break;
case 12:
this.$ = $$[$0-2] + $$[$0-1]  // cwdoh.;
break;
case 13:
this.$ = {id: $$[$0-6], components: $$[$0-2]};
break;
case 16:

     // Terminal for single-prop component. Start data structure.
     var components = {};
     var property = $$[$0];
     if (property === null) { this.$ = components; return; }
     var propertyName = property[0];
     var propertyValue = property[1];

     if (!components[propertyName]) {
       components[propertyName] = propertyValue;
     } else if (components[propertyName].constructor === Array) {
       components[propertyName].push(propertyValue);
     } else {
       components[propertyName] = [components[propertyName], propertyValue];
     }
     this.$ = components;
    
break;
case 17:

     // Non-terminal for single-prop component. Update data structure.
     var components = $$[$0-1];
     var property = $$[$0];
     if (property === null) { this.$ = components; return; }
     var propertyName = property[0];
     var propertyValue = property[1];

     if (!components[propertyName]) {
       components[propertyName] = propertyValue;
     } else if (components[propertyName].constructor === Array) {
       components[propertyName].push(propertyValue);
     } else {
       components[propertyName] = [components[propertyName], propertyValue];
     }
     this.$ = components;
    
break;
case 18:

     // Terminal for multi-prop component. Create data structure.
     var components = {};
     var componentName = $$[$0].component;
     var properties = $$[$0].properties;
     if (properties === null) { this.$ = components; return; }
     components[componentName] = properties;
     this.$ = components;
    
break;
case 19:

     // Non-terminal for multi-prop component. Create data structure.
     var components = $$[$0-1];
     var componentName = $$[$0].component;
     var properties = $$[$0].properties;
     if (properties === null) { this.$ = components; return; }
     components[componentName] = properties;
     this.$ = components;
    
break;
case 20:
this.$ = {component: $$[$0-6], properties: $$[$0-2]};
break;
case 21:
this.$ = [$$[$0-6], $$[$0-2]];
break;
case 24:
this.$ = $$[$0-2] + $$[$0-1] + $$[$0];
break;
case 25:
this.$ = $$[$0-1] + ' ' + $$[$0];
break;
case 27:
this.$ = $$[$0-1] + $$[$0];
break;
case 33:
this.$ = $$[$0-4] + $$[$0-2] + $$[$0-1];
break;
case 42: case 47:
this.$ = "";
break;
case 44: case 45:
this.$ = ' ';
break;
}
},
table: [o($V0,[2,50],{3:1,4:2,46:3,45:$V1,47:$V2,48:$V3}),{1:[3]},{1:[2,6],4:11,5:7,10:9,11:10,16:$V4,18:12,45:$V1,46:8,47:$V2,48:$V3},o($V5,[2,48]),o($V5,[2,51]),o($V5,[2,52]),o($V5,[2,53]),{1:[2,1],4:11,10:14,11:10,16:$V4,18:12,45:$V1,46:3,47:$V2,48:$V3},o($V5,$V6),o($V5,[2,4]),o($V5,[2,7]),o($V0,[2,8],{46:15,45:$V1,47:$V2,48:$V3}),{8:16,19:$V7,22:17,45:$V8},{22:19,45:$V8},o($V5,[2,5]),o($V5,$V6),{19:[1,20]},o([1,7,9,13,14,16,17,19,21,26,28,33,34,35,36,37,38,39,41,42,43,44,47,48],$V9,{45:$Va}),o($Vb,[2,44]),{19:[2,14],45:$Va},o($Vc,$V7,{22:17,8:22,45:$V8}),o($Vb,[2,45]),{8:27,15:26,16:$Vd,17:$Ve,20:23,21:$V7,22:17,23:28,24:24,25:25,45:$V8},{8:27,15:26,16:$Vd,17:$Ve,21:[1,31],22:17,23:28,24:32,25:33,45:$V8},o($Vf,[2,16]),o($Vf,[2,18]),{8:34,22:17,26:$V7,45:$V8},o($Vf,[2,22]),{8:35,19:$V7,22:17,45:$V8},{8:36,22:37,26:$V7,45:$V8},{16:[1,38]},o([1,16,47,48],$V7,{22:17,8:39,45:$V8}),o($Vf,[2,17]),o($Vf,[2,19]),{26:[1,40]},{19:[1,41]},o($Vg,[2,11]),{19:[2,15],26:$V9,45:$Va},{8:42,22:17,26:$V7,45:$V8},o($V5,[2,13]),o($Vh,$V7,{22:17,8:43,45:$V8}),o($Vc,$V7,{22:17,8:44,45:$V8}),o($Vg,[2,12]),{7:$Vi,9:$Vj,12:48,13:$Vk,14:$Vl,16:$Vm,27:45,29:46,31:47,32:49,33:$Vn,34:$Vo,35:$Vp,36:$Vq,37:$Vr,39:$Vs,40:61,44:$Vt},{8:27,15:26,16:$Vd,17:$Ve,20:63,21:$V7,22:17,23:28,24:24,25:25,45:$V8},{7:$Vi,8:64,9:$Vj,12:48,13:$Vk,14:$Vl,16:$Vm,22:17,28:$V7,29:66,30:65,31:47,32:49,33:$Vn,34:$Vo,35:$Vp,36:$Vq,37:$Vr,39:$Vs,40:61,41:$Vu,42:$Vv,43:$Vw,44:$Vt,45:$V8},o($Vx,[2,23]),o($Vx,[2,26]),{31:70,33:$Vn,34:$Vo,35:$Vp,36:$Vq,37:$Vr},o($Vx,[2,28]),o($Vy,$V7,{22:17,8:71,45:$V8}),o($Vy,$V7,{22:17,8:72,45:$V8}),o($Vy,$V7,{22:17,8:73,45:$V8}),o($Vy,$V7,{22:17,8:74,45:$V8}),o($Vh,$V7,{22:17,8:75,45:$V8}),o($Vz,[2,9]),o($Vz,[2,10]),o($Vy,$V7,{22:17,8:76,45:$V8}),o($Vy,$V7,{22:17,8:77,45:$V8}),o($Vy,$V7,{22:17,8:78,45:$V8}),o($Vy,$V7,{22:17,8:79,45:$V8}),o($Vx,[2,38]),o($Vy,$V7,{22:17,8:80,45:$V8}),{8:27,15:26,16:$Vd,17:$Ve,21:[1,81],22:17,23:28,24:32,25:33,45:$V8},{28:[1,82]},{7:$Vi,9:$Vj,12:48,13:$Vk,14:$Vl,16:$Vm,29:83,31:47,32:49,33:$Vn,34:$Vo,35:$Vp,36:$Vq,37:$Vr,39:$Vs,40:61,44:$Vt},o($Vx,[2,25]),o($Vh,$V7,{22:17,8:84,45:$V8}),o($Vh,$V7,{22:17,8:85,45:$V8}),o($Vh,$V7,{22:17,8:86,45:$V8}),o($Vx,[2,27]),o($Vx,[2,29]),o($Vx,[2,30]),o($Vx,[2,31]),o($Vx,[2,32]),{7:$Vi,9:$Vj,12:48,13:$Vk,14:$Vl,16:$Vm,27:87,29:46,31:47,32:49,33:$Vn,34:$Vo,35:$Vp,36:$Vq,37:$Vr,39:$Vs,40:61,44:$Vt},o($Vx,[2,34]),o($Vx,[2,35]),o($Vx,[2,36]),o($Vx,[2,37]),o($Vx,[2,43]),o($Vc,$V7,{22:17,8:88,45:$V8}),o($Vf,[2,21]),o($Vx,[2,24]),o($Vh,[2,39]),o($Vh,[2,40]),o($Vh,[2,41]),{7:$Vi,9:$Vj,12:48,13:$Vk,14:$Vl,16:$Vm,29:66,30:65,31:47,32:49,33:$Vn,34:$Vo,35:$Vp,36:$Vq,37:$Vr,38:[1,89],39:$Vs,40:61,41:$Vu,42:$Vv,43:$Vw,44:$Vt},o($Vf,[2,20]),o($Vy,$V7,{22:17,8:90,45:$V8}),o($Vx,[2,33])],
defaultActions: {},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        function _parseError (msg, hash) {
            this.message = msg;
            this.hash = hash;
        }
        _parseError.prototype = Error;

        throw new _parseError(str, hash);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 45;
break;
case 1:
break;
case 2:return 47;
break;
case 3:return 48;
break;
case 4:return 'INCLUDES';
break;
case 5:return 'DASHMATCH';
break;
case 6:return 'PREFIXMATCH';
break;
case 7:return 'SUFFIXMATCH';
break;
case 8:return 'SUBSTRINGMATCH';
break;
case 9:return 9;
break;
case 10:return 9;
break;
case 11:return "FUNCTION";
break;
case 12:return 7;
break;
case 13:return 16;
break;
case 14:return 44;
break;
case 15:return 'PAGE_SYM';
break;
case 16:return 35;
break;
case 17:return 35;
break;
case 18:return 36;
break;
case 19:return 36;
break;
case 20:return 'DIMEN';
break;
case 21:return 34;
break;
case 22:return 33;
break;
case 23:return 39;
break;
case 24:return 39;
break;
case 25:return yy_.yytext;
break;
}
},
rules: [/^(?:[ \t\r\n\f]+)/,/^(?:\/\*[^*]*\*+([^/][^*]*\*+)*\/)/,/^(?:<!--)/,/^(?:-->)/,/^(?:~=)/,/^(?:\|=)/,/^(?:\^=)/,/^(?:\$=)/,/^(?:\*=)/,/^(?:url\(([ \t\r\n\f]*)(("([\t !#$%&(-~]|\\(\n|\r\n|\r|\f)|'|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))*")|('([\t !#$%&(-~]|\\(\n|\r\n|\r|\f)|"|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))*'))([ \t\r\n\f]*)\))/,/^(?:url\(([ \t\r\n\f]*)(([!#$%&*-~]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))*)([ \t\r\n\f]*)\))/,/^(?:([-]?([a-zA-Z]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))([_]|([a-zA-Z0-9-]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377])))*)\()/,/^(?:(("([\t !#$%&(-~]|\\(\n|\r\n|\r|\f)|'|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))*")|('([\t !#$%&(-~]|\\(\n|\r\n|\r|\f)|"|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))*')))/,/^(?:([-]?([a-zA-Z]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))([_]|([a-zA-Z0-9-]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377])))*))/,/^(?:#(([_]|([a-zA-Z0-9-]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377])))+))/,/^(?:@page\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))deg\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))rad\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))ms\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))s\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))([-]?([a-zA-Z]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))([_]|([a-zA-Z0-9-]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377])))*))/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))%)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+)))/,/^(?:U\+(\?{1,6}|([0-9a-fA-F])(\?{0,5}|([0-9a-fA-F])(\?{0,4}|([0-9a-fA-F])(\?{0,3}|([0-9a-fA-F])(\?{0,2}|([0-9a-fA-F])(\??|([0-9a-fA-F]))))))))/,/^(?:U\+([0-9a-fA-F]){1,6}([0-9a-fA-F]){1,6})/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = main;
exports.Parser = main.Parser;
exports.parse = function () { return main.parse.apply(main, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require('_process'))
},{"_process":4,"fs":2,"path":3}]},{},[1]);
