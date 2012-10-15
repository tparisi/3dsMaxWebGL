// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 */


/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 *
 * @const
 */
var goog = goog || {}; // Identifies this file as the Closure base.


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.LOCALE = 'en';  // default to en


/**
 * Creates object stubs for a namespace.  The presence of one or more
 * goog.provide() calls indicate that the file defines the given
 * objects/namespaces.  Build tools also scan for provide/require statements
 * to discern dependencies, build dependency files (see deps.js), etc.
 * @see goog.require
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part".
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice. This is intended
    // to teach new developers that 'goog.provide' is effectively a variable
    // declaration. And when JSCompiler transforms goog.provide into a real
    // variable declaration, the compiled JS should work the same as the raw
    // JS--even when the raw JS uses goog.provide incorrectly.
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


/**
 * Marks that the current file should only be used for testing, and never for
 * live code in production.
 * @param {string=} opt_message Optional message to add to the error that's
 *     raised when used in production code.
 */
goog.setTestOnly = function(opt_message) {
  if (COMPILED && !goog.DEBUG) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                opt_message ? ': ' + opt_message : '.');
  }
};


if (!COMPILED) {

  /**
   * Check if the given name has been goog.provided. This will return false for
   * names that are available only as implicit namespaces.
   * @param {string} name name of the object to look for.
   * @return {boolean} Whether the name has been provided.
   * @private
   */
  goog.isProvided_ = function(name) {
    return !goog.implicitNamespaces_[name] && !!goog.getObjectByName(name);
  };

  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares
   * that 'goog' and 'goog.events' must be namespaces.
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {?} The value (object or primitive) or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array} provides An array of strings with the names of the objects
 *                         this file provides.
 * @param {Array} requires An array of strings with the names of the objects
 *                         this file requires.
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};




// NOTE(user): The debug DOM loader was included in base.js as an orignal
// way to do "debug-mode" development.  The dependency system can sometimes
// be confusing, as can the debug DOM loader's asyncronous nature.
//
// With the DOM loader, a call to goog.require() is not blocking -- the
// script will not load until some point after the current script.  If a
// namespace is needed at runtime, it needs to be defined in a previous
// script, or loaded via require() with its registered dependencies.
// User-defined namespaces may need their own deps file.  See http://go/js_deps,
// http://go/genjsdeps, or, externally, DepsWriter.
// http://code.google.com/closure/library/docs/depswriter.html
//
// Because of legacy clients, the DOM loader can't be easily removed from
// base.js.  Work is being done to make it disableable or replaceable for
// different environments (DOM-less JavaScript interpreters like Rhino or V8,
// for example). See bootstrap/ for more information.


/**
 * @define {boolean} Whether to enable the debug loader.
 *
 * If enabled, a call to goog.require() will attempt to load the namespace by
 * appending a script tag to the DOM (if the namespace has been registered).
 *
 * If disabled, goog.require() will simply assert that the namespace has been
 * provided (and depend on the fact that some outside tool correctly ordered
 * the script).
 */
goog.ENABLE_DEBUG_LOADER = true;


/**
 * Implements a system for the dynamic resolution of dependencies
 * that works in parallel with the BUILD system. Note that all calls
 * to goog.require will be stripped by the JSCompiler when the
 * --closure_pass option is used.
 * @see goog.provide
 * @param {string} name Namespace to include (as was given in goog.provide())
 *     in the form "goog.package.part".
 */
goog.require = function(name) {

  // if the object already exists we do not need do do anything
  // TODO(user): If we start to support require based on file name this has
  //            to change
  // TODO(user): If we allow goog.foo.* this has to change
  // TODO(user): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      return;
    }

    if (goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if (path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return;
      }
    }

    var errorMessage = 'goog.require could not find: ' + name;
    if (goog.global.console) {
      goog.global.console['error'](errorMessage);
    }


      throw Error(errorMessage);

  }
};


/**
 * Path for included scripts
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default,
 * the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * A function to import a single script. This is meant to be overridden when
 * Closure is being run in non-HTML contexts, such as web workers. It's defined
 * in the global scope so that it can be set before base.js is loaded, which
 * allows deps.js to be imported properly.
 *
 * The function is passed the script source, which is a relative URI. It should
 * return true if the script was imported, false otherwise.
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {...*} var_args The arguments of the function.
 * @return {*} The first argument.
 * @deprecated Use goog.functions.identity instead.
 */
goog.identityFunction = function(var_args) {
  return arguments[0];
};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 *
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error
 * will be thrown when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as
 * an argument because that would make it more difficult to obfuscate
 * our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor());
  };
};


if (!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  /**
   * Object used to keep track of urls that have already been added. This
   * record allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 to many
    nameToPath: {}, // 1 to 1
    requires: {}, // 1 to many
    // used when resolving dependencies to prevent us from
    // visiting the file twice
    visited: {},
    written: {} // used to keep track of script files we have written
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of the base.js script that bootstraps Closure
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Imports a script if, and only if, that script hasn't already been imported.
   * (Must be called at execution time)
   * @param {string} src Script source.
   * @private
   */
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /**
   * The default implementation of the import function. Writes a script tag to
   * import the script.
   *
   * @param {string} src The script source.
   * @return {boolean} True if the script was imported, false otherwise.
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write(
          '<script type="text/javascript" src="' + src + '"></' + 'script>');
      return true;
    } else {
      return false;
    }
  };


  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls importScript_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // we have already visited this one. We can get here if we have cyclic
      // dependencies
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          // If the required name is defined, we assume that it was already
          // bootstrapped by other means.
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error('Undefined nameToPath for ' + requireName);
            }
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // Check these first, so we can avoid calling Object.prototype.toString if
      // possible.
      //
      // IE improperly marshals tyepof across execution contexts, but a
      // cross-context object will still return false for "instanceof Object".
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }

      // HACK: In order to use an Object prototype method on the arbitrary
      //   value, the compiler requires the value be cast to type Object,
      //   even though the ECMA spec explicitly allows it.
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      // In Firefox 3.6, attempting to access iframe window objects' length
      // property throws an NS_ERROR_FAILURE, so we need to special-case it
      // here.
      if (className == '[object Window]') {
        return 'object';
      }

      // We cannot always use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if ((className == '[object Array]' ||
           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox
    // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
    // and RegExps.  We would like to return object for those and we can
    // detect an invalid function by making sure that the function
    // object has a call method.
    return 'object';
  }
  return s;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE). Does not use browser native
 * Object.propertyIsEnumerable.
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  // KJS in Safari 2 is not ECMAScript compatible and lacks crucial methods
  // such as propertyIsEnumerable.  We therefore use a workaround.
  // Does anyone know a more efficient work around?
  if (propName in object) {
    for (var key in object) {
      if (key == propName &&
          Object.prototype.hasOwnProperty.call(object, propName)) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE).
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerable_ = function(object, propName) {
  // In IE if object is from another window, cannot use propertyIsEnumerable
  // from this window's Object. Will raise a 'JScript object expected' error.
  if (object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName);
  } else {
    return goog.propertyIsEnumerableCustom_(object, propName);
  }
};


/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * Returns true if the specified value is |null|
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like
 * the value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays
 * and functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == 'object' || type == 'array' || type == 'function';
};


/**
 * Gets a unique ID for an object. This mutates the object so that further
 * calls with the same object as a parameter returns the same value. The unique
 * ID is guaranteed to be unique across the current session amongst objects that
 * are passed into {@code getUid}. There is no guarantee that the ID is unique
 * or consistent across sessions. It is unsafe to generate unique ID for
 * function prototypes.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(user): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(user): Make the type stricter, do not accept null.

  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure javascript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * Forward declaration for the clone method. This is necessary until the
 * compiler can better support duck-typing constructs as used in
 * goog.cloneObject.
 *
 * TODO(user): Remove once the JSCompiler can infer that the check for
 * proto.clone is safe in goog.cloneObject.
 *
 * @type {Function}
 */
Object.prototype.clone;


/**
 * A native implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind
 *     is deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
goog.bindNative_ = function(fn, selfObj, var_args) {
  return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
};


/**
 * A pure-JS implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 */
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error();
  }

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };

  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of |this| 'pre-specified'.<br><br>
 *
 * Remaining arguments specified at call-time are appended to the pre-
 * specified ones.<br><br>
 *
 * Also see: {@link #partial}.<br><br>
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @suppress {deprecated} See above.
 */
goog.bind = function(fn, selfObj, var_args) {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Somebody pulled base.js into the default
      // Chrome extension environment. This means that for Chrome extensions,
      // they get the implementation of Function.prototype.bind that
      // calls goog.bind instead of the native one. Even worse, we don't want
      // to introduce a circular dependency between goog.bind and
      // Function.prototype.bind, so we have to hack this to make sure it
      // works correctly.
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Prepend the bound arguments to the current arguments.
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a
 * hyphen and passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which
 * these mappings are used. In the BY_PART style, each part (i.e. in
 * between hyphens) of the passed in css name is rewritten according
 * to the map. In the BY_WHOLE style, the full css name is looked up in
 * the map directly. If a rewrite is not specified by the map, the
 * compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls
 * to goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed
 * only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param {string=} opt_style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};


/**
 * To use CSS renaming in compiled mode, one of the input files should have a
 * call to goog.setCssNameMapping() with an object literal that the JSCompiler
 * can extract and use to replace all calls to goog.getCssName(). In uncompiled
 * mode, JavaScript code should be loaded before this base.js file that declares
 * a global variable, CLOSURE_CSS_NAME_MAPPING, which is used below. This is
 * to ensure that the mapping is loaded before any calls to goog.getCssName()
 * are made in uncompiled mode.
 *
 * A hook for overriding the CSS name mapping.
 * @type {Object|undefined}
 */
goog.global.CLOSURE_CSS_NAME_MAPPING;


if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  // This does not call goog.setCssNameMapping() because the JSCompiler
  // requires that goog.setCssNameMapping() be called with an object literal.
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}


/**
 * Abstract implementation of goog.getMsg for use with localized messages.
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   goog.base(this, a, b);
 * }
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the
 * aliases applied.  In uncompiled code the function is simply run since the
 * aliases as written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *    (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};


/**
 *
 */
goog.provide('SB.Mouse');

SB.Mouse = function()
{
	// N.B.: freak out if somebody tries to make 2
	// throw (...)

	this.state = 
	{ x : SB.Mouse.NO_POSITION, y: SB.Mouse.NO_POSITION,

	buttons : { left : false, middle : false, right : false },
	scroll : 0,
	};

	SB.Mouse.instance = this;
};

SB.Mouse.prototype.onMouseMove = function(x, y)
{
    this.state.x = x;
    this.state.y = y;	            
}

SB.Mouse.prototype.onMouseDown = function(x, y)
{
    this.state.x = x;
    this.state.y = y;
    this.state.buttons.left = true;
}

SB.Mouse.prototype.onMouseUp = function(x, y)
{
    this.state.x = x;
    this.state.y = y;
    this.state.buttons.left = false;	            
}

SB.Mouse.prototype.onMouseScroll = function(event, delta)
{
    this.state.scroll = 0; // PUNT!
}


SB.Mouse.prototype.getState = function()
{
	return this.state;
}

SB.Mouse.instance = null;
SB.Mouse.NO_POSITION = Number.MIN_VALUE;
/**
 *
 */
goog.provide('SB.Service');

/**
 * Interface for a Service.
 *
 * Allows multiple different backends for the same type of service.
 * @interface
 */
SB.Service = function() {};

//---------------------------------------------------------------------
// Initialization/Termination
//---------------------------------------------------------------------

/**
 * Initializes the physics world.
 */
SB.Service.prototype.initialize = function(param) {};

/**
 * Terminates the physics world.
 */
SB.Service.prototype.terminate = function() {};


/**
 * Updates the Service.
 */
SB.Service.prototype.update = function() {};/**
 *
 */
goog.provide('SB.Keyboard');

SB.Keyboard = function()
{
	// N.B.: freak out if somebody tries to make 2
	// throw (...)

	SB.Keyboard.instance = this;
}

SB.Keyboard.prototype.onKeyDown = function(keyCode, charCode)
{
}

SB.Keyboard.prototype.onKeyUp = function(keyCode, charCode)
{
}

SB.Keyboard.prototype.onKeyPress = function(keyCode, charCode)
{
}	        

SB.Keyboard.instance = null;

/* key codes
37: left
38: up
39: right
40: down
*/
SB.Keyboard.KEY_LEFT  = 37;
SB.Keyboard.KEY_UP  = 38;
SB.Keyboard.KEY_RIGHT  = 39;
SB.Keyboard.KEY_DOWN  = 40;
/**
 *
 */
goog.provide('SB.Input');
goog.require('SB.Service');
goog.require('SB.Mouse');
goog.require('SB.Keyboard');

SB.Input = function()
{
	// N.B.: freak out if somebody tries to make 2
	// throw (...)

	this.mouse = new SB.Mouse();
	this.keyboard = new SB.Keyboard();
	SB.Input.instance = this;
}

goog.inherits(SB.Input, SB.Service);

SB.Input.instance = null;/**
 * @fileoverview PubSub is the base class for any object that sends/receives messages
 * 
 * @author Tony Parisi
 */
goog.provide('SB.PubSub');

/**
 * @constructor
 */
SB.PubSub = function() {
    this.messageTypes = {};
    this.messageQueue = [];
    this.post = SB.PubSub.postMessages;
}

SB.PubSub.prototype.subscribe = function(message, subscriber, callback) {
    var subscribers = this.messageTypes[message];
    if (subscribers)
    {
        if (this.findSubscriber(subscribers, subscriber) != -1)
        {
            return;
        }
    }
    else
    {
        subscribers = [];
        this.messageTypes[message] = subscribers;
    }

    subscribers.push({ subscriber : subscriber, callback : callback });
}

SB.PubSub.prototype.unsubscribe =  function(message, subscriber, callback) {
    if (subscriber)
    {
        var subscribers = this.messageTypes[message];

        if (subscribers)
        {
            var i = this.findSubscriber(subscribers, subscriber, callback);
            if (i != -1)
            {
                this.messageTypes[message].splice(i, 1);
            }
        }
    }
    else
    {
        delete this.messageTypes[message];
    }
}

SB.PubSub.prototype.publish = function(message) {
    var subscribers = this.messageTypes[message];

    if (subscribers)
    {
        for (var i = 0; i < subscribers.length; i++)
        {
            if (this.post)
            {
                var args = [subscribers[i].callback];
                for (var j = 0; j < arguments.length - 1; j++)
                {
                    args.push(arguments[j + 1]);
                }
                subscribers[i].subscriber.postMessage.apply(subscribers[i].subscriber, args);
            }
            else
            {
                var args = [];
                for (var j = 0; j < arguments.length - 1; j++)
                {
                    args.push(arguments[j + 1]);
                }
                subscribers[i].callback.apply(subscribers[i].subscriber, args);
            }
        }
    }
}

SB.PubSub.prototype.findSubscriber = function (subscribers, subscriber) {
    for (var i = 0; i < subscribers.length; i++)
    {
        if (subscribers[i] == subscriber)
        {
            return i;
        }
    }
    
    return -1;
}

SB.PubSub.prototype.handleMessages = function() {
    var message;
    while (message = this.getMessage())
    {
        if (message.callback)
        {
            message.callback.apply(this, message.args);
        }
    }
}

SB.PubSub.prototype.postMessage = function (callback) {
    var args = [];
    var len = arguments.length - 1;
    var i;
    for (i = 0; i < len; i++)
    {
        args[i] = arguments[i+1];
    }

    this.messageQueue.push({callback : callback, args : args});
}

SB.PubSub.prototype.getMessage = function() {
    if (this.messageQueue.length)
    {
        return this.messageQueue.shift();
    }
    else
    {
        return null;
    }
}

SB.PubSub.prototype.peekMessage = function() {
    return (this.messageQueue.length > 0) ? this.messageQueue[0] : null;
}

SB.PubSub.postMessages = false;
/**
 * @fileoverview Main interface to the graphics and rendering subsystem
 * 
 * @author Tony Parisi
 */
goog.provide('SB.Time');

SB.Time = function()
{
	// Freak out if somebody tries to make 2
    if (SB.Time.instance)
    {
        throw new Error('Graphics singleton already exists')
    }
}


SB.Time.prototype.initialize = function(param)
{
	this.currentTime = Date.now();

	SB.Time.instance = this;
}

SB.Time.prototype.update = function()
{
	this.currentTime = Date.now();
}

SB.Time.instance = null;
	        
/**
 * @fileoverview Contains configuration options for the Skybox Engine.
 * @author Tony Parisi
 */
goog.provide('SB.Config');

/**
 * @define {boolean} Whether the library should be compiled for WebGL usage.
 */
SB.Config.USE_WEBGL = true;
/**
 * @fileoverview Main interface to the graphics and rendering subsystem
 * 
 * @author Tony Parisi
 */
goog.provide('SB.Graphics');

SB.Graphics = function()
{
	// Freak out if somebody tries to make 2
    if (SB.Graphics.instance)
    {
        throw new Error('Graphics singleton already exists')
    }
	
	SB.Graphics.instance = this;
}
	        
SB.Graphics.instance = null;
/**
 * @fileoverview Main interface to the graphics and rendering subsystem
 * 
 * @author Tony Parisi
 */
goog.require('SB.Graphics');
goog.provide('SB.GraphicsThreeJS');

SB.GraphicsThreeJS = function()
{
	SB.Graphics.call(this);
}

goog.inherits(SB.GraphicsThreeJS, SB.Graphics);

SB.GraphicsThreeJS.prototype.initialize = function(param)
{
	param = param || {};
	
	// call all the setup functions
	this.initOptions(param);
	this.initPageElements(param);
	this.initScene();
	this.initRenderer(param);
	this.initMouse();
	this.initKeyboard();
	this.addDomHandlers();
}

SB.GraphicsThreeJS.prototype.focus = function()
{
	if (this.renderer && this.renderer.domElement)
	{
		this.renderer.domElement.focus();
	}
}

SB.GraphicsThreeJS.prototype.initOptions = function(param)
{
	this.displayStats = (param && param.displayStats) ? 
			param.displayStats : SB.GraphicsThreeJS.default_display_stats;
}

SB.GraphicsThreeJS.prototype.initPageElements = function(param)
{
    this.container = param.container ? param.container : document.createElement( 'div' );
    document.body.appendChild( this.container );
    
    if (this.displayStats)
    {
        var stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.left = '140px';
        stats.domElement.style.height = '40px';
        this.container.appendChild( stats.domElement );
        this.stats = stats;
    }
}

SB.GraphicsThreeJS.prototype.initScene = function()
{
    var scene = new THREE.Scene();

//    scene.add( new THREE.AmbientLight(0xffffff) ); //  0x505050 ) ); // 
	
    var camera = new THREE.PerspectiveCamera( 45, 
    		this.container.offsetWidth / this.container.offsetHeight, 1, 4000 );
    camera.position.set( 0, 0, 10 );

    scene.add(camera);
    
    this.scene = scene;
	this.camera = camera;
}

SB.GraphicsThreeJS.prototype.initRenderer = function(param)
{
    var renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.sortObjects = false;
    renderer.setSize( this.container.offsetWidth, this.container.offsetHeight );

    if (param && param.backgroundColor)
    {
    	renderer.domElement.style.backgroundColor = param.backgroundColor;
    	renderer.domElement.setAttribute('z-index', -1);
    }
    
    this.container.appendChild( renderer.domElement );

    var projector = new THREE.Projector();

    this.renderer = renderer;
    this.projector = projector;
    
}

SB.GraphicsThreeJS.prototype.initMouse = function()
{
	var dom = this.renderer.domElement;
	
	var that = this;
	dom.addEventListener( 'mousemove', 
			function(e) { that.onDocumentMouseMove(e); }, false );
	dom.addEventListener( 'mousedown', 
			function(e) { that.onDocumentMouseDown(e); }, false );
	dom.addEventListener( 'mouseup', 
			function(e) { that.onDocumentMouseUp(e); }, false );
	
	$(dom).mousewheel(
	        function(e, delta) {
	            that.onDocumentMouseScroll(e, delta);
	        }
	    );
	
}

SB.GraphicsThreeJS.prototype.initKeyboard = function()
{
	var dom = this.renderer.domElement;
	
	var that = this;
	dom.addEventListener( 'keydown', 
			function(e) { that.onKeyDown(e); }, false );
	dom.addEventListener( 'keyup', 
			function(e) { that.onKeyUp(e); }, false );
	dom.addEventListener( 'keypress', 
			function(e) { that.onKeyPress(e); }, false );

	// so it can take focus
	dom.setAttribute("tabindex", 1);
    
}

SB.GraphicsThreeJS.prototype.addDomHandlers = function()
{
	var that = this;
	window.addEventListener( 'resize', function(event) { that.onWindowResize(event); }, false );
}

SB.GraphicsThreeJS.prototype.objectFromMouse = function(pagex, pagey)
{
	var offset = $(this.renderer.domElement).offset();
	
	var eltx = pagex - offset.left;
	var elty = pagey - offset.top;
	
	// translate client coords into vp x,y
    var vpx = ( eltx / this.container.offsetWidth ) * 2 - 1;
    var vpy = - ( elty / this.container.offsetHeight ) * 2 + 1;
    
    var vector = new THREE.Vector3( vpx, vpy, 0.5 );

    this.projector.unprojectVector( vector, this.camera );
	
    var pos = new THREE.Vector3;
    pos = this.camera.matrixWorld.multiplyVector3(pos);
    var ray = new THREE.Ray( pos, vector.subSelf( pos ).normalize() );

    var intersects = ray.intersectObject( this.scene, true );
	
    if ( intersects.length > 0 ) {
    	var i = 0;
    	while(!intersects[i].object.visible)
    	{
    		i++;
    	}
    	
    	var intersected = intersects[i];
    	
    	if (i >= intersects.length)
    	{
        	return { object : null, point : null, normal : null };
    	}
    	
    	return (this.findObjectFromIntersected(intersected.object, intersected.point, intersected.face.normal));        	    	                             
    }
    else
    {
    	return { object : null, point : null, normal : null };
    }
}

SB.GraphicsThreeJS.prototype.findObjectFromIntersected = function(object, point, normal)
{
	if (object.data)
	{
		return { object: object.data, point: point, normal: normal };
	}
	else if (object.parent)
	{
		return this.findObjectFromIntersected(object.parent, point, normal);
	}
	else
	{
		return { object : null, point : null, normal : null };
	}
}

SB.GraphicsThreeJS.prototype.onDocumentMouseMove = function(event)
{
    event.preventDefault();
    //console.log("MOUSE Mouse move " + event.pageX + ", " + event.pageY);
    
    SB.Mouse.instance.onMouseMove(event.pageX, event.pageY);
    
    if (SB.Picker)
    {
    	SB.Picker.handleMouseMove(event.pageX, event.pageY);
    }
    
    SB.Game.handleMouseMove(event.pageX, event.pageY);
}

SB.GraphicsThreeJS.prototype.onDocumentMouseDown = function(event)
{
    event.preventDefault();
    
    // N.B.: ahh, the bullshit continues...
    this.focus();
    
    // console.log("Mouse down " + event.pageX + ", " + event.pageY);
    
    SB.Mouse.instance.onMouseDown(event.pageX, event.pageY);
    
    if (SB.Picker)
    {
    	SB.Picker.handleMouseDown(event.pageX, event.pageY);
    }
    
    SB.Game.handleMouseDown(event.pageX, event.pageY);
}

SB.GraphicsThreeJS.prototype.onDocumentMouseUp = function(event)
{
    event.preventDefault();
    // console.log("Mouse up " + event.pageX + ", " + event.pageY);
    
    SB.Mouse.instance.onMouseUp(event.pageX, event.pageY);
    
    if (SB.Picker)
    {
    	SB.Picker.handleMouseUp(event.pageX, event.pageY);
    }	            

    SB.Game.handleMouseUp(event.pageX, event.pageY);
}

SB.GraphicsThreeJS.prototype.onDocumentMouseScroll = function(event, delta)
{
    event.preventDefault();
    // console.log("Mouse wheel " + delta);
    
    SB.Mouse.instance.onMouseScroll(delta);

    if (SB.Picker)
    {
    	SB.Picker.handleMouseScroll(delta);
    }
    
    SB.Game.handleMouseScroll(delta);
}

SB.GraphicsThreeJS.prototype.onKeyDown = function(event)
{
	// N.B.: Chrome doesn't deliver keyPress if we don't bubble... keep an eye on this
	event.preventDefault();

    SB.Keyboard.instance.onKeyDown(event.keyCode, event.charCode);
    
	SB.Game.handleKeyDown(event.keyCode, event.charCode);
}

SB.GraphicsThreeJS.prototype.onKeyUp = function(event)
{
	// N.B.: Chrome doesn't deliver keyPress if we don't bubble... keep an eye on this
	event.preventDefault();

    SB.Keyboard.instance.onKeyUp(event.keyCode, event.charCode);
    
	SB.Game.handleKeyUp(event.keyCode, event.charCode);
}
	        
SB.GraphicsThreeJS.prototype.onKeyPress = function(event)
{
	// N.B.: Chrome doesn't deliver keyPress if we don't bubble... keep an eye on this
	event.preventDefault();

    SB.Keyboard.instance.onKeyPress(event.keyCode, event.charCode);
    
	SB.Game.handleKeyPress(event.keyCode, event.charCode);
}

SB.GraphicsThreeJS.prototype.onWindowResize = function(event)
{
	this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);

	this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
	this.camera.updateProjectionMatrix();
}

SB.GraphicsThreeJS.prototype.setCursor = function(cursor)
{
	this.container.style.cursor = cursor;
}


SB.GraphicsThreeJS.prototype.update = function()
{
    this.renderer.render( this.scene, this.camera );

    if (this.stats)
    {
    	this.stats.update();
    }
}
	        
SB.GraphicsThreeJS.default_display_stats = false,
/**
 *
 */
goog.require('SB.Service');
goog.provide('SB.EventService');

/**
 * The EventService.
 *
 * @extends {SB.Service}
 */
SB.EventService = function() {};

goog.inherits(SB.EventService, SB.Service);

//---------------------------------------------------------------------
// Initialization/Termination
//---------------------------------------------------------------------

/**
 * Initializes the events system.
 */
SB.EventService.prototype.initialize = function(param) {};

/**
 * Terminates the events world.
 */
SB.EventService.prototype.terminate = function() {};


/**
 * Updates the EventService.
 */
SB.EventService.prototype.update = function()
{
	SB.Game.instance.updateEntities();
}
/**
 * @fileoverview Service locator for various game services.
 */
goog.provide('SB.Services');
goog.require('SB.Config');
goog.require('SB.Time');
goog.require('SB.Input');
goog.require('SB.EventService');
goog.require('SB.GraphicsThreeJS');

SB.Services = {};

SB.Services._serviceMap = 
{ 
		"time" : { object : SB.Time },
		"input" : { object : SB.Input },
		"events" : { object : SB.EventService },
		"graphics" : { object : SB.Config.USE_WEBGL ? SB.GraphicsThreeJS : null },
};

SB.Services.create = function(serviceName)
{
	var serviceType = SB.Services._serviceMap[serviceName];
	if (serviceType)
	{
		var prop = serviceType.property;
		
		if (SB.Services[serviceName])
		{
	        throw new Error('Cannot create two ' + serviceName + ' service instances');
		}
		else
		{
			if (serviceType.object)
			{
				var service = new serviceType.object;
				SB.Services[serviceName] = service;

				return service;
			}
			else
			{
		        throw new Error('No object type supplied for creating service ' + serviceName + '; cannot create');
			}
		}
	}
	else
	{
        throw new Error('Unknown service: ' + serviceName + '; cannot create');
	}
}

SB.Services.registerService = function(serviceName, object)
{
	if (SB.Services._serviceMap[serviceName])
	{
        throw new Error('Service ' + serviceName + 'already registered; cannot register twice');
	}
	else
	{
		var serviceType = { object: object };
		SB.Services._serviceMap[serviceName] = serviceType;
	}
}/**
 * @fileoverview The base Game class
 * 
 * @author Tony Parisi
 */
goog.provide('SB.Game');
goog.require('SB.PubSub');
goog.require('SB.Time');
goog.require('SB.Input');
goog.require('SB.Services');

/**
 * @constructor
 */
SB.Game = function()
{
	// N.B.: freak out if somebody tries to make 2
	// throw (...)

	SB.PubSub.call(this);
	SB.Game.instance = this;
}

goog.inherits(SB.Game, SB.PubSub);

SB.Game.prototype.initialize = function(param)
{
	this._services = [];
	this._entities = [];

	// Add required services first
	this.addService("time");
	this.addService("input");
	
	// Add optional (game-defined) services next
	this.addOptionalServices();

	// Add events and rendering services last - got to;
	this.addService("events");
	this.addService("graphics");
	
	// Start all the services
	this.initServices(param);
}

SB.Game.prototype.addService = function(serviceName)
{
	var service = SB.Services.create(serviceName);
	this._services.push(service);	
}

SB.Game.prototype.initServices = function(param)
{
	var i, len;
	len = this._services.length;
	for (i = 0; i < len; i++)
	{
		this._services[i].initialize(param);
	}
}

SB.Game.prototype.addOptionalServices = function()
{
}

SB.Game.prototype.focus = function()
{
	// Hack hack hack should be the input system
	SB.services.graphics.focus();
}

SB.Game.prototype.run = function()
{
    // core game loop here	        	
	// this.graphics.run();
	this.lastFrameTime = Date.now();
	this.runloop();
}
	        
SB.Game.prototype.runloop = function()
{
	var now = Date.now();
	var deltat = now - this.lastFrameTime;
	
	if (deltat >= SB.Game.minFrameTime)
	{
		this.handleMessages();
		this.updateServices();
        this.lastFrameTime = now;
	}
	
	var that = this;
    requestAnimationFrame( function() { that.runloop(); } );
}

SB.Game.prototype.updateServices = function()
{
	var i, len;
	len = this._services.length;
	for (i = 0; i < len; i++)
	{
		this._services[i].update();
	}
}

SB.Game.prototype.updateEntities = function()
{
	var i, len = this._entities.length;
	
	for (i = 0; i < len; i++)
	{
		this._entities[i].update();
	}
	
}

SB.Game.prototype.addEntity = function(e)
{
	this._entities.push(e);
}

SB.Game.prototype.removeEntity = function(e) {
    var i = this._entities.indexOf(e);
    if (i != -1) {
    	// N.B.: I suppose we could be paranoid and check to see if I actually own this component
        this._entities.splice(i, 1);
    }
}
	
SB.Game.prototype.onMouseMove = function(x, y)
{
	if (this.mouseDelegate)
	{
		this.mouseDelegate.onMouseMove(x, y);
	}
}

SB.Game.prototype.onMouseDown = function(x, y)
{
	if (this.mouseDelegate)
	{
		this.mouseDelegate.onMouseDown(x, y);
	}
}

SB.Game.prototype.onMouseUp = function(x, y)
{
	if (this.mouseDelegate)
	{
		this.mouseDelegate.onMouseUp(x, y);
	}
}

SB.Game.prototype.onMouseScroll = function(delta)
{
	if (this.mouseDelegate)
	{
		this.mouseDelegate.onMouseScroll(delta);
	}
}

SB.Game.prototype.onKeyDown = function(keyCode, charCode)
{
	if (this.keyboardDelegate)
	{
		this.keyboardDelegate.onKeyDown(keyCode, charCode);
	}
}

SB.Game.prototype.onKeyUp = function(keyCode, charCode)
{
	if (this.keyboardDelegate)
	{
		this.keyboardDelegate.onKeyUp(keyCode, charCode);
	}
}

SB.Game.prototype.onKeyPress = function(keyCode, charCode)
{
	if (this.keyboardDelegate)
	{
		this.keyboardDelegate.onKeyPress(keyCode, charCode);
	}
}	

/* statics */

SB.Game.instance = null;
SB.Game.curEntityID = 0;
SB.Game.minFrameTime = 16;
	    	
SB.Game.handleMouseMove = function(x, y)
{
    if (SB.Picker.clickedObject)
    	return;
    
    if (SB.Game.instance.onMouseMove)
    	SB.Game.instance.onMouseMove(x, y);	            	
}

SB.Game.handleMouseDown = function(x, y)
{
    if (SB.Picker.clickedObject)
    	return;
    
    if (SB.Game.instance.onMouseDown)
    	SB.Game.instance.onMouseDown(x, y);	            	
}

SB.Game.handleMouseUp = function(x, y)
{
    if (SB.Picker.clickedObject)
    	return;
    
    if (SB.Game.instance.onMouseUp)
    	SB.Game.instance.onMouseUp(x, y);	            	
}

SB.Game.handleMouseScroll = function(delta)
{
    if (SB.Picker.overObject)
    	return;
    
    if (SB.Game.instance.onMouseScroll)
    	SB.Game.instance.onMouseScroll(delta);	            	
}

SB.Game.handleKeyDown = function(keyCode, charCode)
{
    if (SB.Game.instance.onKeyDown)
    	SB.Game.instance.onKeyDown(keyCode, charCode);	            	
}

SB.Game.handleKeyUp = function(keyCode, charCode)
{
    if (SB.Game.instance.onKeyUp)
    	SB.Game.instance.onKeyUp(keyCode, charCode);	            	
}

SB.Game.handleKeyPress = function(keyCode, charCode)
{
    if (SB.Game.instance.onKeyPress)
    	SB.Game.instance.onKeyPress(keyCode, charCode);	            	
}	        
/**
 * @fileoverview Component is the base class for defining objects used within an Entity
 * 
 * @author Tony Parisi
 */
goog.provide('SB.Component');
goog.require('SB.PubSub');

/**
 * Creates a new Component.
 * @constructor
 */
SB.Component = function(param) {
    SB.PubSub.call(this);
	
	param = param || {};
	this.param = param;
    
    /**
     * @type {SB.Entity}
     * @private
     */
    this._entity = null;
    
    /**
     * @type {Boolean}
     * @private
     */
    this._realized = false;
}

goog.inherits(SB.Component, SB.PubSub);

/**
 * Gets the Entity the Component is associated with.
 * @returns {SB.Entity} The Entity the Component is associated with.
 */
SB.Component.prototype.getEntity = function() {
    return this._entity;
}

/**
 * Sets the Entity the Component is associated with.
 * @param {SB.Entity} entity
 */
SB.Component.prototype.setEntity = function(entity) {
    this._entity = entity;
}

SB.Component.prototype.realize = function() {
    this._realized = true;
}

SB.Component.prototype.update = function() {
    this.handleMessages();
}
/**
 * @fileoverview General-purpose key frame animation
 * @author Tony Parisi
 */
goog.provide('SB.KeyFrame');
goog.require('SB.Component');

/**
 * @constructor
 * @extends {SB.Component}
 */
SB.KeyFrame = function(param) 
{
    SB.Component.call(this, param);
	    		
	this.keys = [];
	this.values = [];
	
	if (param && param.keys && param.values)
	{
		this.setValue(param.keys, param.values);
	}	    		

	this.duration = (param && param.duration) ? param.duration : SB.KeyFrame.default_duration;
	this.loop = (param && param.loop) ? param.loop : false;
	this.easeOut = (param && param.easeOut) ? param.easeOut : false;
	this.running = false;
}

goog.inherits(SB.KeyFrame, SB.Component);

SB.KeyFrame.prototype.setValue = function(keys, values)
{
	this.keys = [];
	this.values = [];
	if (keys && keys.length && values && values.length)
	{
		this.copyKeys(keys, this.keys);
		this.copyValues(values, this.values);
	}
}

SB.KeyFrame.prototype.copyKeys = function(from, to)
{
	var i = 0, len = from.length;
	for (i = 0; i < len; i++)
	{
		to[i] = from[i];
	}
}

SB.KeyFrame.prototype.copyValues = function(from, to)
{
	var i = 0, len = from.length;
	for (i = 0; i < len; i++)
	{
		var val = {};
		this.copyValue(from[i], val);
		to[i] = val;
	}
}

SB.KeyFrame.prototype.copyValue = function(from, to)
{
	for ( var property in from ) {
		
		if ( from[ property ] === null ) {		
		continue;		
		}

		to[ property ] = from[ property ];
	}
}

SB.KeyFrame.prototype.tween = function(from, to, fract)
{
	var value = {};
	for ( var property in from ) {
		
		if ( from[ property ] === null ) {		
		continue;		
		}

		var range = to[property] - from[property];
		var delta = range * fract;
		value[ property ] = from[ property ] + delta;
	}
	
	return value;
}

SB.KeyFrame.prototype.start = function()
{
	if (this.running)
		return;
	
	this.startTime = Date.now();
	this.running = true;
}

SB.KeyFrame.prototype.stop = function()
{
	this.running = false;
}
	        
SB.KeyFrame.prototype.update = function()
{
	if (!this.running)
		return;
	
	var now = Date.now();
	var deltat = (now - this.startTime) % this.duration;
	var nCycles = Math.floor((now - this.startTime) / this.duration);
	var fract = deltat / this.duration;
	if (this.easeOut)
	{
		fract = SB.KeyFrame.ease(fract);
	}

	if (nCycles >= 1 && !this.loop)
	{
		this.running = false;
		return;
	}
	
	var i, len = this.keys.length;
	if (fract == this.keys[0])
	{
		this.publish("value", this.values[0]);
		return;
	}
	else if (fract >= this.keys[len - 1])
	{
		this.publish("value", this.values[len - 1]);
		return;
	}

	for (i = 0; i < len - 1; i++)
	{
		var key1 = this.keys[i];
		var key2 = this.keys[i + 1];

		if (fract >= key1 && fract <= key2)
		{
			var val1 = this.values[i];
			var val2 = this.values[i + 1];
			var value = this.tween(val1, val2, (fract - key1) / (key2 - key1));
			this.publish("value", value);
			break;
		}
	}
}

SB.KeyFrame.ease = function(n) {
	// Len's ease function, what does it do?
	// Maybe let's borrow the functions from Tween.js?
    var q = 0.07813 - n / 2,
        alpha = -0.25,
        Q = Math.sqrt(0.0066 + q * q),
        x = Q - q,
        X = Math.pow(Math.abs(x), 1/3) * (x < 0 ? -1 : 1),
        y = -Q - q,
        Y = Math.pow(Math.abs(y), 1/3) * (y < 0 ? -1 : 1),
        t = X + Y + 0.25;
    return Math.pow(1 - t, 2) * 3 * t * 0.1 + (1 - t) * 3 * t * t + t * t * t;
}

SB.KeyFrame.default_duration = 1000;
/**
 * @fileoverview Loader - loads level files
 * 
 * @author Tony Parisi
 */

goog.provide('SB.Loader');
goog.require('SB.PubSub');

/**
 * @constructor
 * @extends {SB.PubSub}
 */
SB.Loader = function()
{
    SB.PubSub.call(this);	
}

goog.inherits(SB.Loader, SB.PubSub);
        
goog.provide('SB.Shaders');

SB.Shaders = {} ;

SB.Shaders.ToonShader = function(diffuseUrl, toonUrl, ambient, diffuse)
{
	diffuse = diffuse || new THREE.Color( 0xFFFFFF );
	ambient = ambient || new THREE.Color( 0x050505 );

	var params = {	
		uniforms: 
			{
			"uDiffuseTexture" : { type: "t", value: 0, texture: THREE.ImageUtils.loadTexture(diffuseUrl) },
			"uToonTexture"    : { type: "t", value: 1, texture: THREE.ImageUtils.loadTexture(toonUrl) },
			"specular": { type: "c", value: new THREE.Color( 0x333333 ) },
			"diffuse" : { type: "c", value: diffuse },
			"ambient" : { type: "c", value: ambient },
			"shininess"    : { type: "f", value: 30 },
			"ambientLightColor": { type: "c", value: new THREE.Color( 0x888888 ) }
			},

		fragmentShader: [
			"uniform vec3 diffuse;",
			"uniform vec3 ambient;",
			"uniform vec3 specular;",
			"uniform float shininess;",
			"varying vec2 vUv;",
			"uniform sampler2D uDiffuseTexture;",
			"uniform sampler2D uToonTexture;",
			"uniform vec3 ambientLightColor;",
			"#if MAX_DIR_LIGHTS > 0",
			"uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];",
			"uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];",
			"#endif",
			"varying vec3 vViewPosition;",
			"varying vec3 vNormal;",

			"void main() {",

			"	vec3 normal = normalize( vNormal );",
			"	vec3 viewPosition = normalize( vViewPosition );",

			"	vec3 lightDir = normalize(vec3(1.0, 10.0, 0.0));",
			"	vec3 lightColor = vec3(1.0, 0.4, 0.4);",
				
			"	vec4 lDirection = viewMatrix * vec4( lightDir, 0.0 );",
			"	vec3 dirVector = normalize( lDirection.xyz );",
			"	vec3 dirHalfVector = normalize( lDirection.xyz + viewPosition );",
			"	float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );",
			"	float dirDiffuseWeight = max( dot( normal, dirVector ), 0.0 );",
			"	float dirSpecularWeight = pow( dirDotNormalHalf, shininess );",
				
			"	vec4 toonDiffuseWeight = texture2D(uToonTexture, vec2(dirDiffuseWeight, 0));",
			"	vec4 toonSpecularWeight = texture2D(uToonTexture, vec2(dirSpecularWeight, 0));",
			"	dirDiffuseWeight = toonDiffuseWeight.x;",
			"	dirSpecularWeight = toonSpecularWeight.x;",
			"	vec3 dirSpecular = specular * lightColor * dirSpecularWeight * dirDiffuseWeight;",
			"	vec3 dirDiffuse = diffuse * lightColor * dirDiffuseWeight;",

			"	gl_FragColor = vec4(( dirDiffuse + ambientLightColor * ambient ) + dirSpecular, 1.0);",
			"}"
		].join("\n"),
		
		vertexShader: [
			"varying vec3 vViewPosition;",
			"varying vec3 vNormal;",
			"varying vec2 vUv;",
			"uniform vec4 offsetRepeat;",

			"void main() {",
			"	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"	vUv = uv;",

			"	vViewPosition = -mvPosition.xyz;",
			"	vNormal = normalMatrix * normal;",

			"	gl_Position = projectionMatrix * mvPosition;",
			"}"
		].join("\n")

	} ;
	
	return params;
} ;


SB.Shaders.ToonShader.applyShader = function(object)
{
	var geometry = object.geometry;
	var material = object.material;
	
	if (material instanceof THREE.MeshFaceMaterial)
	{
		// HACK FOR TOON SHADING REMOVE
		var diffuseTexture = './images/diffuse-tree.png';
		var toonTexture = './images/toon-lookup.png';
		
		for (var i = 0; i < geometry.materials.length; i++)
		{
			var oldMaterial = geometry.materials[i];
			
			var newMaterialParams = SB.Shaders.ToonShader(diffuseTexture, toonTexture, oldMaterial.ambient, oldMaterial.color);
			
			geometry.materials[i] = new THREE.ShaderMaterial(newMaterialParams);
		}
	}
	else
	{
		var oldMaterial = material;
		
		var newMaterialParams = SB.Shaders.ToonShader(diffuseTexture, toonTexture, oldMaterial.ambient, oldMaterial.color);
		
		object.material = new THREE.ShaderMaterial(newMaterialParams);
	}
}

/**
 * @fileoverview Base class for visual elements.
 * @author Tony Parisi
 */
goog.provide('SB.SceneComponent');
goog.require('SB.Component');

/**
 * @constructor
 */
SB.SceneComponent = function(param)
{	
	SB.Component.call(this, param);
    
    this.object = null;
    this.position = this.param.position || new THREE.Vector3();
    this.rotation = this.param.rotation || new THREE.Vector3();
    this.scale = this.param.scale || new THREE.Vector3(1, 1, 1);
} ;

goog.inherits(SB.SceneComponent, SB.Component);

SB.SceneComponent.prototype.realize = function()
{
	if (this.object && !this.object.data)
	{
		this.addToScene();
	}
	
	SB.Component.prototype.realize.call(this);
}

SB.SceneComponent.prototype.update = function()
{	
	SB.Component.prototype.update.call(this);
	
	if (this.object)
	{
		this.object.position.x = this.position.x;
		this.object.position.y = this.position.y;
		this.object.position.z = this.position.z;
		this.object.rotation.x = this.rotation.x;
		this.object.rotation.y = this.rotation.y;
		this.object.rotation.z = this.rotation.z;
		this.object.scale.x = this.scale.x;
		this.object.scale.y = this.scale.y;
		this.object.scale.z = this.scale.z;
	}
}

SB.SceneComponent.prototype.addToScene = function() {
	if (this._entity)
	{
		var parent = this._entity.transform ? this._entity.transform.object : SB.Graphics.instance.scene;
		if (parent)
		{
		    parent.add(this.object);
		    this.object.data = this; // backpointer for picking and such
		}
		else
		{
			// N.B.: throw something?
		}
	}
	else
	{
		// N.B.: throw something?
	}
}

SB.SceneComponent.prototype.removeFromScene = function() {
	if (this._entity)
	{
		var parent = this._entity.transform ? this._entity.transform.object : SB.Graphics.instance.scene;
		if (parent)
		{
			this.object.data = null;
		    parent.remove(this.object);
		}
		else
		{
			// N.B.: throw something?
		}
	}
	else
	{
		// N.B.: throw something?
	}
}
/**
 * @fileoverview Base class for visual elements.
 * @author Tony Parisi
 */
goog.provide('SB.Visual');
goog.require('SB.SceneComponent');

/**
 * @constructor
 */
SB.Visual = function(param)
{
	SB.SceneComponent.call(this, param);	
} ;

goog.inherits(SB.Visual, SB.SceneComponent);
/**
 * @fileoverview A visual containing an arbitrary model
 * @author Tony Parisi
 */
goog.provide('SB.Model');
goog.require('SB.Visual');

/**
 * @constructor
 * @extends {SB.Visual}
 */
SB.Model = function(param)
{
    SB.Visual.call(this, param);

	this.frame = 0;
	this.animating = false;
	this.frameRate = SB.Model.default_frame_rate;
}

goog.inherits(SB.Model, SB.Visual);

SB.Model.prototype.animate  = function(animating)
{
	if (this.animating == animating)
	{
		return;
	}
	
	this.animating = animating;
	if (this.animating)
	{
		this.frame = 0;
		this.startTime = Date.now();
	}
}

SB.Model.prototype.applyShader = function(shaderClass)
{
	if (this.object && this.object.geometry && shaderClass && shaderClass.applyShader)
	{
		shaderClass.applyShader(this.object);
	}
}

SB.Model.default_frame_rate = 30;

SB.Model.loadModel = function(url, param, callback)
{
	var spliturl = url.split('.');
	var len = spliturl.length;
	var ext = '';
	if (len)
	{
		ext = spliturl[len - 1];
	}
	
	if (ext && ext.length)
	{
	}
	else
	{
		return;
	}
	
	var modelClass;
	var loaderClass;
	
	switch (ext.toUpperCase())
	{
		case 'DAE' :
			modelClass = SB.ColladaModel;
			loaderClass = THREE.ColladaLoader;
			break;
		case 'JS' :
			modelClass = SB.JsonModel;
			loaderClass = THREE.JSONLoader;
			break;
		default :
			break;
	}
	
	if (modelClass)
	{
		var model = new modelClass(param);
		
		var loader = new loaderClass;
		loader.load(url, function (data) {
			model.handleLoaded(data);
			if (callback)
			{
				callback(model);
			}
		});
		
		return model;
	}
}
/**
 * @fileoverview A visual containing a model in JSON format
 * @author Tony Parisi
 */
goog.provide('SB.JsonScene');
goog.require('SB.Model');
goog.require('SB.Shaders');
 
/**
 * @constructor
 * @extends {SB.Model}
 */
SB.JsonScene = function(param)
{
	SB.Model.call(this, param);
}

goog.inherits(SB.JsonScene, SB.Model);
	       
SB.JsonScene.prototype.handleLoaded = function(data)
{
	this.object = new THREE.Object3D();
	this.object.add(data.scene);
	
	this.addToScene();
}

SB.JsonScene.loadScene = function(url, param, callback)
{
	var scene = new SB.JsonScene(param);
	
	var loader = new THREE.SceneLoader;
	loader.load(url, function (data) {
		scene.handleLoaded(data);
		if (callback)
		{
			callback(scene);
		}
	});
	
	return scene;
}
goog.provide('SB.Camera');
goog.require('SB.SceneComponent');

SB.Camera = function(param)
{
	param = param || {};
	
	SB.SceneComponent.call(this, param);
	this._active = param.active || false;
}

goog.inherits(SB.Camera, SB.SceneComponent);

SB.Camera.prototype.realize = function() 
{
	SB.SceneComponent.prototype.realize.call(this);
	
	var container = SB.Graphics.instance.container;
	this.object = new THREE.PerspectiveCamera( 45, container.offsetWidth / container.offsetHeight, 1, 4000 );

	this.addToScene();
	
	if (this._active)
	{
		SB.Graphics.instance.camera = this.object;
	}
}

SB.Camera.prototype.setActive = function(active) 
{
	this._active = active;
	if (this._realized && this._active)
	{
		SB.Graphics.instance.camera = this.object;
	}
}

SB.Camera.prototype.lookAt = function(v) 
{
	this.object.lookAt(v);
}
/**
 * @fileoverview Contains prefab assemblies for core Skybox package
 * @author Tony Parisi
 */
goog.provide('SB.Prefabs');/**
 *
 */
goog.provide('SB.PhysicsSystem');

/**
 * Interface for a PhysicsSystem.
 *
 * Allows multiple different backends for physics.
 * @interface
 */
SB.PhysicsSystem = function() {};

//---------------------------------------------------------------------
// Initialization/Termination
//---------------------------------------------------------------------

/**
 * Initializes the physics world.
 */
SB.PhysicsSystem.prototype.initialize = function() {};

/**
 * Terminates the physics world.
 */
SB.PhysicsSystem.prototype.terminate = function() {};

//---------------------------------------------------------------------
// Properties
//---------------------------------------------------------------------

/**
 * Sets the gravity of the simulation.
 * @param {number} x Gravity in the x direction.
 * @param {number} y Gravity in the y direction.
 * @param {number} z Gravity in the z direction.
 */
SB.PhysicsSystem.prototype.setGravity = function(x, y, z) {};

/**
 * Sets the bounds of the simulation.
 * @param {number} minX The minimum x value.
 * @param {number} maxX The maximum x value.
 * @param {number} minY The minimum y value.
 * @param {number} maxY The maximum y value.
 * @param {number] minZ The minimum z value.
 * @param {number} maxZ The maximum z value.
 */
SB.PhysicsSystem.prototype.setBounds = function(minX, maxX, minY, maxY, minZ, maxZ) {};

//---------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------

/**
 * Adds a PhysicsBody to the simulation.
 * @param {SB.PhysicsBody} body The body to add to the simulation.
 */
SB.PhysicsSystem.prototype.addBody = function(body) {};

/**
 * Removes a PhysicsBody from the simulation.
 * @param {SB.PhysicsBody} body The body to remove from the simulation.
 */
SB.PhysicsSystem.prototype.removeBody = function(body) {};

/**
 * Updates the PhysicsSystem.
 */
SB.PhysicsSystem.prototype.update = function() {};/**
 *
 */
goog.require('SB.Service');
goog.provide('SB.PhysicsService');

/**
 * Interface for a PhysicsService.
 *
 * Allows multiple different backends for physics.
 * @interface
 * @extends {SB.Service}
 */
SB.PhysicsService = function() {};

goog.inherits(SB.PhysicsService, SB.Service);

//---------------------------------------------------------------------
// Initialization/Termination
//---------------------------------------------------------------------

/**
 * Initializes the physics world.
 */
SB.PhysicsService.prototype.initialize = function(param) {};

/**
 * Terminates the physics world.
 */
SB.PhysicsService.prototype.terminate = function() {};

//---------------------------------------------------------------------
// Properties
//---------------------------------------------------------------------

/**
 * Sets the gravity of the simulation.
 * @param {number} x Gravity in the x direction.
 * @param {number} y Gravity in the y direction.
 * @param {number} z Gravity in the z direction.
 */
SB.PhysicsService.prototype.setGravity = function(x, y, z) {};

/**
 * Sets the bounds of the simulation.
 * @param {number} minX The minimum x value.
 * @param {number} maxX The maximum x value.
 * @param {number} minY The minimum y value.
 * @param {number} maxY The maximum y value.
 * @param {number] minZ The minimum z value.
 * @param {number} maxZ The maximum z value.
 */
SB.PhysicsService.prototype.setBounds = function(minX, maxX, minY, maxY, minZ, maxZ) {};

//---------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------

/**
 * Adds a PhysicsBody to the simulation.
 * @param {SB.PhysicsBody} body The body to add to the simulation.
 */
SB.PhysicsService.prototype.addBody = function(body) {};

/**
 * Removes a PhysicsBody from the simulation.
 * @param {SB.PhysicsBody} body The body to remove from the simulation.
 */
SB.PhysicsService.prototype.removeBody = function(body) {};

/**
 * Updates the PhysicsService.
 */
SB.PhysicsService.prototype.update = function() {};/**
 * @fileoverview
 */
goog.provide('SB.PhysicsSystemBox2D');
goog.require('SB.PhysicsService');

/**
 * Implementation of a PhysicsSystem using Box2D.
 *
 * @constructor
 * @implements {PhysicsService}
 */
SB.PhysicsSystemBox2D = function()
{
    /**
     * @type {b2World}
     */
    this._world = null;

    /**
     * @type {b2AABB}
     */
    //this.worldBounds_ = new b2AABB();

    /**
     * @type {b2Vec2}
     */
    this._gravity = new b2Vec2(0, 0);

} ;

/**
 * @inheritDoc
 */
SB.PhysicsSystemBox2D.prototype.setGravity = function(x, y, z)
{
    // Ignore the y, treat z as y
    this._gravity.x = x;
    this._gravity.y = z;
} ;

/**
 * @inheritDoc
 */
SB.PhysicsSystemBox2D.prototype.setBounds = function(minX, maxX, minY, maxY, minZ, maxZ)
{
    // Ignore the y, treat z as y
    //this.worldBounds_.minVertex.Set(minX, minZ);
    //this.worldBounds_.maxVertex.Set(maxX, maxZ);
} ;

/**
 * @inheritDoc
 */
SB.PhysicsSystemBox2D.prototype.initialize = function(param)
{
    if (this._world)
    {
        throw new Error('Cannot initialize the physics system twice');
    }

    // Create the world
    this._world = new b2World(this._gravity, true);
    this._world.SetWarmStarting(true);

    this.setGravity(0, 0, 0);

} ;

/**
 * @inheritDoc
 */
SB.PhysicsSystemBox2D.prototype.terminate = function()
{
    if (!this._world)
    {
        throw new Error('Cannot terminate the physics system before its initialized');
    }

    // Destroy the world
    this._world = null;
} ;

/**
 * @inheritDoc
 */
SB.PhysicsSystemBox2D.prototype.update = function() {
	
    var elapsed = 1 / 60;

    this._world.ClearForces();
    this._world.Step(elapsed, 6, 2);
} ;

SB.PhysicsSystemBox2D.prototype.addBody = function(body) {
    return this._world.CreateBody(body);
}
/**
 * @fileoverview Entity collects a group of Components that define a game object and its behaviors
 * 
 * @author Tony Parisi
 */
goog.provide('SB.Entity');
goog.require('SB.PubSub');

/**
 * Creates a new Entity.
 * @constructor
 * @extends {SB.PubSub}
 */
SB.Entity = function() {
    SB.PubSub.call(this);
    
    /**
     * @type {number}
     * @private
     */
    this._id = SB.Entity.nextId++;

    /**
     * @type {SB.Entity}
     * @private
     */
    this._parent = null;

    /**
     * @type {Array.<SB.Entity>}
     * @private
     */
    this._children = [];

    /**
     * @type {Array}
     * @private
     */
    this._components = [];
    
    
    /**
     * @type {Boolean}
     * @private
     */
    this._realized = false;
}

goog.inherits(SB.Entity, SB.PubSub);

/**
 * The next identifier to hand out.
 * @type {number}
 * @private
 */
SB.Entity.nextId = 0;

SB.Entity.prototype.getID = function() {
    return this._id;
}

//---------------------------------------------------------------------
// Hierarchy methods
//---------------------------------------------------------------------

/**
 * Sets the parent of the Entity.
 * @param {SB.Entity} parent The parent of the Entity.
 * @private
 */
SB.Entity.prototype.setParent = function(parent) {
    this._parent = parent;
}

/**
 * Adds a child to the Entity.
 * @param {SB.Entity} child The child to add.
 */
SB.Entity.prototype.addChild = function(child) {
    if (!child)
    {
        throw new Error('Cannot add a null child');
    }

    if (child._parent)
    {
        throw new Error('Child is already attached to an Entity');
    }

    child.setParent(this);
    this._children.push(child);

    if (this._realized && !child._realized)
    {
    	child.realize();
    }

}

/**
 * Removes a child from the Entity
 * @param {SB.Entity} child The child to remove.
 */
SB.Entity.prototype.removeChild = function(child) {
    var i = this._children.indexOf(child);

    if (i != -1)
    {
        this._children.splice(i, 1);
        child.setParent(null);
    }
}

/**
 * Removes a child from the Entity
 * @param {SB.Entity} child The child to remove.
 */
SB.Entity.prototype.getChild = function(index) {
	if (index >= this._children.length)
		return null;
	
	return this._children[index];
}

//---------------------------------------------------------------------
// Component methods
//---------------------------------------------------------------------

/**
 * Adds a Component to the Entity.
 * @param {SB.Component} component.
 */
SB.Entity.prototype.addComponent = function(component) {
    if (!component)
    {
        throw new Error('Cannot add a null component');
    }
    
    if (component._entity)
    {
        throw new Error('Component is already attached to an Entity')
    }

    if (component instanceof SB.Transform)
    {
    	if (this.transform != null && component != this.transform)
    	{
            throw new Error('Entity already has a Transform component')
    	}
    	
    	this.transform = component;
    }
    
    this._components.push(component);
    component.setEntity(this);
    
    if (this._realized && !component._realized)
    {
    	component.realize();
    }
}

/**
 * Removes a Component from the Entity.
 * @param {SB.Component} component.
 */
SB.Entity.prototype.removeComponent = function(component) {
    var i = this._components.indexOf(component);

    if (i != -1)
    {
    	if (component.removeFromScene);
    	{
    		component.removeFromScene();
    	}
    	
        this._components.splice(i, 1);
        component.setEntity(null);
    }
}

/**
 * Retrieves a Component of a given type in the Entity.
 * @param {Object} type.
 */
SB.Entity.prototype.getComponent = function(type) {
	var i, len = this._components.length;
	
	for (i = 0; i < len; i++)
	{
		var component = this._components[i];
		if (component instanceof type)
		{
			return component;
		}
	}
	
	return null;
}

//---------------------------------------------------------------------
//Initialize methods
//---------------------------------------------------------------------

SB.Entity.prototype.realize = function() {
    this.realizeComponents();
    this.realizeChildren();
        
    this._realized = true;
}

/**
 * @private
 */
SB.Entity.prototype.realizeComponents = function() {
    var component;
    var count = this._components.length;
    var i = 0;

    for (; i < count; ++i)
    {
        this._components[i].realize();
    }
}

/**
 * @private
 */
SB.Entity.prototype.realizeChildren = function() {
    var child;
    var count = this._children.length;
    var i = 0;

    for (; i < count; ++i)
    {
        this._children[i].realize();
    }
}

//---------------------------------------------------------------------
// Update methods
//---------------------------------------------------------------------

SB.Entity.prototype.update = function() {
    this.handleMessages();
    this.updateComponents();
    this.updateChildren();
}

/**
 * @private
 */
SB.Entity.prototype.updateComponents = function() {
    var component;
    var count = this._components.length;
    var i = 0;

    for (; i < count; ++i)
    {
        this._components[i].update();
    }
}

/**
 * @private
 */
SB.Entity.prototype.updateChildren = function() {
    var child;
    var count = this._children.length;
    var i = 0;

    for (; i < count; ++i)
    {
        this._children[i].update();
    }
}
goog.provide('SB.Viewer');
goog.require('SB.Entity');

SB.Viewer = function(param)
{
	SB.Entity.call(this, param);

	param = param || {};
	
	this.transform = new SB.Transform;
	this.addComponent(this.transform);
	this.transform.position.set(0, 0, 5);
	
	this.viewpoint = new SB.Entity;
	var transform = new SB.Transform;
	var camera = new SB.Camera({active:true});
	this.viewpoint.addComponent(transform);
	this.viewpoint.addComponent(camera);
	this.viewpoint.transform = transform;
	this.viewpoint.camera = camera;

	this.addChild(this.viewpoint);

	if (param.headlight)
	{
		this.headlight = new SB.DirectionalLight({ color : 0xFFFFFF, intensity : 1});
		this.addComponent(this.headlight);
	}
	
	this.directionMatrix = new THREE.Matrix4;
}

goog.inherits(SB.Viewer, SB.Entity);

SB.Viewer.prototype.realize = function() 
{
	SB.Entity.prototype.realize.call(this);
}

SB.Viewer.prototype.update = function() 
{
	SB.Entity.prototype.update.call(this);
}

SB.Viewer.prototype.move = function(dir)
{
	this.directionMatrix.identity();
	this.directionMatrix.setRotationFromEuler(this.transform.rotation);
	dir = this.directionMatrix.multiplyVector3(dir);
	this.transform.position.addSelf(dir);
}

SB.Viewer.prototype.turn = function(dir)
{
	this.transform.rotation.addSelf(dir);
}
goog.provide('SB.PhysicsBody');

/**
 * Interface for a PhysicsBody
 * @interface
 */
SB.PhysicsBody = function() {};

/**
 * Sets the PhysicsMaterial for the body.
 * @param {SB.PhysicsMaterial} material The material to attach to the body.
 */
SB.PhysicsBody.prototype.setMaterial = function(material) {};
goog.provide('SB.DirectionalLight');
goog.require('SB.SceneComponent');

SB.DirectionalLight = function(param)
{
	param = param || {};
	this.color = param.color;
	this.intensity = param.intensity;
	this.dirMatrix = new THREE.Matrix4;
	SB.SceneComponent.call(this, param);
}

goog.inherits(SB.DirectionalLight, SB.SceneComponent);

SB.DirectionalLight.prototype.realize = function() 
{
	SB.SceneComponent.prototype.realize.call(this);
	this.object = new THREE.DirectionalLight(this.color, this.intensity, 0);
	this.position.set(0, 0, 1);
	this.addToScene();
}

SB.DirectionalLight.prototype.update = function() 
{
	// D'oh Three.js doesn't seem to transform directional light positions automatically
	this.position.set(0, 0, 1);
	this.dirMatrix.identity();
	this.dirMatrix.extractRotation(this.object.parent.matrixWorld);
	this.position = this.dirMatrix.multiplyVector3(this.position);
	SB.SceneComponent.prototype.update.call(this);
}
/**
 * @fileoverview Tracker - converts x,y mouse motion into rotation about an axis (event-driven)
 * 
 * @author Tony Parisi
 */
goog.provide('SB.Tracker');
goog.require('SB.Component');

SB.Tracker = function(param)
{
	this.param = param || {};
	
    SB.Component.call(this);
    this.running = false;
}

goog.inherits(SB.Tracker, SB.Component);

SB.Tracker.prototype.realize = function()
{
    // Track our position based on the transform component and passed-in reference object
    this.object = this._entity.transform.object;
    this.reference = this.param.reference;
    	
	SB.Component.prototype.realize.call(this);
}

SB.Tracker.prototype.start = function()
{
	this.position = this.calcPosition();

    this.running = true;
}

SB.Tracker.prototype.stop = function(x, y)
{
    this.running = false;
}

SB.Tracker.prototype.update = function()
{	
    if (!this.running)
    {
        return;
    }

    var pos = this.calcPosition();
	if (this.position.x != pos.x ||
			this.position.y != pos.y ||
			this.position.z != pos.z)
	{
		//console.log("Object position: " + pos.x + ", " + pos.y + ", " + pos.z);

	    this.publish("position", pos);
	    this.position = pos;
	}
}

SB.Tracker.prototype.calcPosition = function()
{
	// Get reference object position world space
	var refpos = this.reference.position.clone();
	var refmat = this.reference.matrixWorld;
	refpos = refmat.multiplyVector3(refpos);
	
	// Transform reference world space position into my model space
	var mymat = this.object.matrixWorld;
	var myinv = THREE.Matrix4.makeInvert(mymat);
	refpos = myinv.multiplyVector3(refpos);

	return refpos;
}/**
 *
 */
goog.provide('SB.View');
goog.require('SB.PubSub');

SB.View = function(param)
{
	SB.PubSub.call(this);
	
	this.id = (param && param.id) ? param.id : "";
	this.closebox = (param && param.closebox) ? param.closebox : "";
	var style = (param && param.style) ? param.style : "";
	var elt = $('<div class="view ' + style + '" id = "' + this.id + '">');
	this.dom = elt[0];
	var sb = { object: this };
	this.dom.SB = sb;
	document.body.appendChild(this.dom);

}
        
goog.inherits(SB.View, SB.PubSub);

SB.View.prototype.handleLoaded = function(html)
{
	this.dom.innerHTML = html;
	this.build();
},

SB.View.prototype.build = function()
{
	if (this.closebox)
	{
    	var closeboxwidget = $(
    	"<div class='closebox'><img id='closebox' src='./images/closebox-gray.png' width='16px' height='16px'></img></div>");
	 
    	var closeboxdiv;
    	
    	if (closeboxwidget)
    	{
    		closeboxdiv = closeboxwidget[0];
    	}
	
    	if (closeboxdiv)
    	{
    		var firstchild = this.dom.firstChild;
    		if (firstchild)
    		{
    			this.dom.insertBefore(closeboxdiv, firstchild);
    		}
    		else
    		{
    			this.dom.appendChild(closeboxdiv);
    		}
    		
    		var that = this;
    		closeboxdiv.addEventListener('click', function(event) { that.onCloseBoxClick(); }, false);
    	}	
	}
}

SB.View.prototype.show  = function()
{
	this.dom.style.display = 'block';

	var width = $(this.dom).width();
	var left = (window.innerWidth - width) / 2;

	this.dom.style.left = left + 'px';
	
}

SB.View.prototype.hide  = function()
{
	this.dom.style.display = 'none';
}

SB.View.prototype.onCloseBoxClick = function()
{
	this.hide();
}
        
/* statics */        
        
SB.View.close = function(target)
{
	var elt = SB.View.findViewFromElement(target);
	if (elt)
	{
		var view = elt.SB.object;
		view.hide();
	}
}
    	
SB.View.findViewFromElement = function(target)
{
	if (target.SB)
		return target;
	else if (target.parentNode)
		return  SB.View.findViewFromElement(target.parentNode);
	else
		return null;
}/**
 *
 */
goog.provide('SB.Popup');
goog.require('SB.View');

SB.Popup = function(param)
{
	param.style = "popup";
    SB.View.call(this, param);
	
	SB.Popup.stack = [];
}

goog.inherits(SB.Popup, SB.View);

SB.Popup.prototype.show = function()
{
	SB.View.prototype.show.call(this);
	
	SB.Popup.push(this);
}

SB.Popup.prototype.hide = function()
{
	SB.View.prototype.hide.call(this);
	
	SB.Popup.pop(this);
}        

SB.Popup.stack = null;
    	
SB.Popup.push = function(popup)
{
	SB.Popup.stack.push(popup);
}

SB.Popup.pop = function(popup)
{
	var len = SB.Popup.stack.length;
	if (len)
	{
		var top = SB.Popup.stack[len - 1];
		if (top && top == popup)
		{
        	return SB.Popup.stack.pop();
		}
	}
}
/**
 * @fileoverview PollingRotator - converts x,y mouse motion into rotation about an axis (polling)
 * 
 * @author Tony Parisi
 */
goog.provide('SB.PollingRotator');
goog.require('SB.Component');

SB.PollingRotator = function(param)
{
    SB.Component.call(this, param);
}

goog.inherits(SB.PollingRotator, SB.Component);

SB.PollingRotator.prototype.realize = function()
{
	this.lastState = SB.Mouse.instance.getState();
	this.target = (this.param && this.param.target) ? this.param.target : null;
}

SB.PollingRotator.prototype.update = function()
{
    var state = SB.Mouse.instance.getState();

    if (state.buttons.left)
    {
        var dx = state.x - this.lastState.x;
        var dy = state.y - this.lastState.y;

        this.target.rotation.y += dx * 0.01;
    }
    else
    {
    }

    this.lastState =
    {
        x : state.x, y: state.y,
        buttons : { left : state.buttons.left, middle : state.buttons.middle, right : state.buttons.right },
        scroll : state.scroll
    };
}
/**
 *
 */
goog.provide('SB.Transform');
goog.require('SB.Component');

SB.Transform = function(param)
{
    SB.Component.call(this);
    
    this.position = new THREE.Vector3();
    this.rotation = new THREE.Vector3();
    this.scale = new THREE.Vector3(1, 1, 1);
} ;

goog.inherits(SB.Transform, SB.Component);

SB.Transform.prototype.realize = function()
{
	this.object = new THREE.Object3D();
	this.addToScene();

	SB.Component.prototype.realize.call(this);
}

SB.Transform.prototype.update = function()
{
    this.object.position.x = this.position.x;
    this.object.position.y = this.position.y;
    this.object.position.z = this.position.z;
    this.object.rotation.x = this.rotation.x;
    this.object.rotation.y = this.rotation.y;
    this.object.rotation.z = this.rotation.z;
    this.object.scale.x = this.scale.x;
    this.object.scale.y = this.scale.y;
    this.object.scale.z = this.scale.z;
}

SB.Transform.prototype.addToScene = function() {
	if (this._entity)
	{
		var parent = (this._entity._parent && this._entity._parent.transform) ? this._entity._parent.transform.object : SB.Graphics.instance.scene;
		if (parent)
		{
		    parent.add(this.object);
		    this.object.data = this; // backpointer for picking and such
		}
		else
		{
			// N.B.: throw something?
		}
	}
	else
	{
		// N.B.: throw something?
	}
}

SB.Transform.prototype.removeFromScene = function() {
	if (this._entity)
	{
		var parent = (this._entity._parent && this._entity._parent.transform) ? this._entity._parent.transform.object : SB.Graphics.instance.scene;
		if (parent)
		{
			this.object.data = null;
		    parent.remove(this.object);
		}
		else
		{
			// N.B.: throw something?
		}
	}
	else
	{
		// N.B.: throw something?
	}
}
/**
 * @fileoverview File Manager - load game assets using Ajax
 * 
 * @author Tony Parisi
 */

goog.provide('SB.File');
goog.require('SB.PubSub');

/**
 * @constructor
 * @extends {SB.PubSub}
 */
SB.File = function()
{
    SB.PubSub.call(this);	
}

goog.inherits(SB.File, SB.PubSub);
        
SB.File.onReadyStateChange = function(xmlhttp, callback)
{
    if (xmlhttp.readyState == 4)
    {
        if (xmlhttp.status == 200)
        {
    		callback(xmlhttp.responseText);
        }    		
    }
}
    	
SB.File.loadFile = function(url, callback)
{
    xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () { SB.File.onReadyStateChange(xmlhttp, callback); } ;

    xmlhttp.open('GET', url, true);
    xmlhttp.send(null);
    
}

goog.require('SB.Prefabs');

SB.Prefabs.WalkthroughController = function(param)
{
	var controller = new SB.Entity(param);
	var transform = new SB.Transform;
	controller.addComponent(transform);
	controller.transform.position.set(0, 0, 5);
	var controllerScript = new SB.WalkthroughControllerScript;
	controller.addComponent(controllerScript);

	var dragger = new SB.Dragger();
	var rotator = new SB.Rotator();
	var timer = new SB.Timer( { duration : 3333 } );
	
	controller.addComponent(dragger);
	controller.addComponent(rotator);
	controller.addComponent(timer);

	dragger.subscribe("move", controllerScript, controllerScript.onDraggerMove);
	rotator.subscribe("rotate", controllerScript, controllerScript.onRotatorRotate);
	timer.subscribe("time", controllerScript, controllerScript.onTimeChanged);
	timer.subscribe("fraction", controllerScript, controllerScript.onTimeFractionChanged);	
	
	var viewpoint = new SB.Entity;
	var transform = new SB.Transform;
	var camera = new SB.Camera({active:true});
	viewpoint.addComponent(transform);
	viewpoint.addComponent(camera);
	viewpoint.transform = transform;
	viewpoint.camera = camera;

	controller.addChild(viewpoint);

	var intensity = param.headlight ? 1 : 0;
	var color = param.headlight ? 0xFFFFFF : 0;
	
	var headlight = new SB.DirectionalLight({ color : color, intensity : intensity });
	controller.addComponent(headlight);
	
	return controller;
}

goog.provide('SB.WalkthroughControllerScript');
goog.require('SB.Component');

SB.WalkthroughControllerScript = function(param)
{
	SB.Component.call(this, param);

	this.directionMatrix = new THREE.Matrix4;
	this.moveDir = new THREE.Vector3;
	this.turnDir = new THREE.Vector3;
	this.cameraPos = null;
	
	this.lastdy = 0;
	this.dragging = false;
}

goog.inherits(SB.WalkthroughControllerScript, SB.Component);

SB.WalkthroughControllerScript.prototype.realize = function()
{
	this.dragger = this._entity.getComponent(SB.Dragger);
	this.rotator = this._entity.getComponent(SB.Rotator);
	this.timer = this._entity.getComponent(SB.Timer);
	this.viewpoint = this._entity.getChild(0);
	
	SB.Game.instance.mouseDelegate = this;
	SB.Game.instance.keyboardDelegate = this;
}

SB.WalkthroughControllerScript.prototype.update = function()
{
	if (this.cameraPos)
	{
		this._entity.transform.position.copy(this.cameraPos);
		this.cameraPos = null;
	}
}

SB.WalkthroughControllerScript.prototype.setCameraPos = function(pos)
{
	if (this.cameraPos)
	{
		this.cameraPos.copy(pos);
	}
	else
	{
		this.cameraPos = pos.clone();
	}
}

SB.WalkthroughControllerScript.prototype.move = function(dir)
{
	this.directionMatrix.identity();
	this.directionMatrix.setRotationFromEuler(this._entity.transform.rotation);
	dir = this.directionMatrix.multiplyVector3(dir);
	this._entity.transform.position.addSelf(dir);
}

SB.WalkthroughControllerScript.prototype.turn = function(dir)
{
	this._entity.transform.rotation.addSelf(dir);
}


SB.WalkthroughControllerScript.prototype.onMouseMove = function(x, y)
{
	this.dragger.set(x, y);
	this.rotator.set(x, y);
}

SB.WalkthroughControllerScript.prototype.onMouseDown = function(x, y)
{
	this.dragger.start(x, y);
	this.rotator.start(x, y);
	this.dragging = true;
}

SB.WalkthroughControllerScript.prototype.onMouseUp = function(x, y)
{
	this.dragger.stop(x, y);
	this.rotator.stop(x, y);
	this.dragging = false;
	this.lastdy = 0;
}

SB.WalkthroughControllerScript.prototype.onMouseScroll = function(delta)
{
	this.moveDir.set(0, 0, -delta);
	this.move(this.moveDir);
}

SB.WalkthroughControllerScript.prototype.onKeyDown = function(keyCode, charCode)
{
	this.whichKeyDown = keyCode;
	
	this.timer.start();
}

SB.WalkthroughControllerScript.prototype.onKeyUp = function(keyCode, charCode)
{
	this.lastdy = 0;
	this.whichKeyDown = 0;
	this.turnFraction = 0;
	
	this.timer.stop();
}

SB.WalkthroughControllerScript.prototype.onKeyPress = function(keyCode, charCode)
{
}


SB.WalkthroughControllerScript.prototype.onRotatorRotate = function(axis, delta)
{
	delta *= .666;
	
	if (delta != 0)
	{
		// this.controllerScript.transform.rotation.y -= delta;
		this.turnDir.set(0, -delta, 0);
		this.turn(this.turnDir);
		this.lastrotate = delta;
	}
}

SB.WalkthroughControllerScript.prototype.onDraggerMove = function(dx, dy)
{
	if (Math.abs(dy) <= 2)
		dy = 0;
	
	dy *= .02;
	
	if (dy)
	{
		this.lastdy = dy;
	}
	else if (this.lastdy && this.dragging)
	{
		dy = this.lastdy;
	}

	if (dy != 0)
	{
		// this.controllerScript.transform.position.z -= dy;
		this.moveDir.set(0, 0, -dy);
		this.move(this.moveDir);
	}
}

SB.WalkthroughControllerScript.prototype.onTimeChanged = function(t)
{
	var turnfraction = .0416;
	var movefraction = .1666;
	var turnamount = 0;
	var moveamount = 0;
	var handled = false;
	
	switch (this.whichKeyDown)
	{
    	case SB.Keyboard.KEY_LEFT : 
    		turnamount = +1 * turnfraction;
			handled = true;
    		break;
    	case SB.Keyboard.KEY_UP : 
    		moveamount = -1 * movefraction;
			handled = true;
    		break;
    	case SB.Keyboard.KEY_RIGHT : 
    		turnamount = -1 * turnfraction;
			handled = true;
    		break;
    	case SB.Keyboard.KEY_DOWN : 
    		moveamount = +1 * movefraction;
			handled = true;
    		break;
	}

	if (!handled)
	{
		switch (String.fromCharCode(this.whichKeyDown))
		{
	    	case 'A' :
	    		turnamount = +1 * turnfraction;
	    		handled = true;
	    		break;
	    		
	    	case 'W' :
	    		moveamount = -1 * movefraction;
	    		handled = true;
	    		break;
	    	case 'D' :
	    		turnamount = -1 * turnfraction;
				handled = true;
	    		break;
	    	case 'S' :
	    		moveamount = +1 * movefraction;
				handled = true;
	    		break;
	    		
	    	default : 
	    		break;
		}
	}

	if (moveamount)
	{
		this.moveDir.set(0, 0, moveamount);
		this.move(this.moveDir);
	}
	
	if (turnamount)
	{
		this.turnDir.set(0, turnamount, 0);
		this.turn(this.turnDir);
	}
}

SB.WalkthroughControllerScript.prototype.onTimeFractionChanged = function(fraction)
{
	this.turnFraction = fraction;
}


/**
 * @fileoverview
 */
goog.provide('SB.RigidBodyBox2D');
goog.require('SB.Component');
goog.require('SB.PhysicsBody');

/**
 * Component representing a rigid body.
 * @constructor
 * @extends {SB.Component}
 * @implements {SB.PhysicsBody}
 */
SB.RigidBodyBox2D = function()
{
    SB.Component.call(this);

    /**
     * @type {b2BodyDef}
     * @protected
     */
    this.body = new b2BodyDef();
} ;

goog.inherits(SB.RigidBodyBox2D, SB.Component);

//---------------------------------------------------------------------
// Initialization/Termination
//---------------------------------------------------------------------

/**
 * Initializes the RigidBody component.
 */
SB.RigidBodyBox2D.prototype.realize = function()
{
    // Set the position based on the transform
    var transform = this._entity.transform;

    this.body.SetPosition(new b2Vec2(transform.position.x, transform.position.z));
	SB.Component.prototype.realize.call(this);
} ;

/**
 * Terminates the RigidBody component.
 */
SB.RigidBodyBox2D.prototype.terminate = function()
{

} ;

//---------------------------------------------------------------------
// PhysicsBody methods
//---------------------------------------------------------------------

SB.RigidBodyBox2D.prototype.setMaterial = function(material)
{

} ;

SB.RigidBodyBox2D.prototype.update = function()
{
    var position = this.body.GetPosition();

    // Set the position
    var transform = this._entity.transform;
    transform.position.x = position.x;
    transform.position.z = position.y;

    // \todo ROTATIONS
} ;

SB.RigidBodyBox2D.prototype.applyForce = function(x, y, z)
{
    var force = new b2Vec2(x, z);
    var position = this.body.GetPosition();

    this.body.ApplyImpulse(force, position);
//    this.body.ApplyForce(force, position);
}
/**
 * @fileoverview A wire grid floor plane
 * @author Tony Parisi
 */

goog.provide('SB.Grid');
goog.require('SB.Visual');

SB.Grid = function(param)
{
	SB.Visual.call(this, param);
	param = param || {};
	this.size = param.size || 10;
	this.stepSize = param.stepSize || 1;
	this.color = (param.color === undefined) ? 0xcccccc : param.color;
}

goog.inherits(SB.Grid, SB.Visual);

SB.Grid.prototype.realize = function()
{
	SB.Visual.prototype.realize.call(this);
	
	var line_material = new THREE.LineBasicMaterial( { color: this.color, opacity: 0.2 } ),
		geometry = new THREE.Geometry(),
		floor = -0.04, step = this.stepSize, size = this.size;

	for ( var i = 0; i <= size / step * 2; i ++ )
	{
		geometry.vertices.push( new THREE.Vector3( - size, floor, i * step - size ) );
		geometry.vertices.push( new THREE.Vector3(   size, floor, i * step - size ) );

		geometry.vertices.push( new THREE.Vector3( i * step - size, floor, -size ) );
		geometry.vertices.push( new THREE.Vector3( i * step - size, floor,  size ) );
	}

	this.object = new THREE.Line( geometry, line_material, THREE.LinePieces );
    
    this.addToScene();
}

/**
 * @fileoverview Dragger - converts x,y mouse motion into x, y object position output
 * 
 * @author Tony Parisi
 */
goog.provide('SB.Dragger');
goog.require('SB.Component');

SB.Dragger = function(param)
{
    SB.Component.call(this);
    this.target = (param && param.target) ? param.target : null;
    this.lastx = SB.Mouse.NO_POSITION;
    this.lasty = SB.Mouse.NO_POSITION;
    this.x = SB.Mouse.NO_POSITION;
    this.y = SB.Mouse.NO_POSITION;
    this.running = false;
}

goog.inherits(SB.Dragger, SB.Component);

SB.Dragger.prototype.start = function(x, y)
{
    this.lastx = x;
    this.lasty = y;
    this.x = this.lastx;
    this.y = this.lasty;
    this.running = true;
}

SB.Dragger.prototype.set = function(x, y)
{
    this.x = x;
    this.y = y;
}

SB.Dragger.prototype.stop = function(x, y)
{
    this.x = x;
    this.y = y;

    this.running = false;
}

SB.Dragger.prototype.update = function()
{
    if (!this.running)
    {
        return;
    }

    var dx = this.x - this.lastx;
    var dy = this.y - this.lasty;

    this.publish("move", dx, -dy);

    this.lastx = this.x;
    this.lasty = this.y;
}
/**
 * @fileoverview
 */
goog.provide('SB.PhysicsBodyBox2D');

/**
 * Implementation of a PhysicsBody using Box2D.
 *
 * @implements {SB.PhysicsBody}
 * @constructor
 */
SB.PhysicsBodyBox2D = function()
{
    /**
     * Internal representation of the body.
     * @type {b2BodyDef}
     */
    this._body = new b2BodyDef();
} ;

/**
 * @inheritDoc
 */
SB.PhysicsBodyBox2D.prototype.setMaterial = function(material)
{
    
} ;

/**
 * @protected
 * @inheritDoc
 */
SB.PhysicsBodyBox2D.prototype.setShape = function(shape)
{
    this._body.addShape(shape);
} ;
/**
 * @fileoverview A visual containing a model in JSON format
 * @author Tony Parisi
 */
goog.provide('SB.JsonModel');
goog.require('SB.Model');
goog.require('SB.Shaders');
 
/**
 * @constructor
 * @extends {SB.Model}
 */
SB.JsonModel = function(param)
{
	SB.Model.call(this, param);
}

goog.inherits(SB.JsonModel, SB.Model);
	       
SB.JsonModel.prototype.handleLoaded = function(data)
{
	var material = new THREE.MeshFaceMaterial(); // data.materials ? data.materials[0] : null;
	
	this.object = new THREE.Mesh(data, material);

	this.addToScene();
}

/**
 * @fileoverview Timer - component that generates time events
 * 
 * @author Tony Parisi
 */
goog.provide('SB.Timer');
goog.require('SB.Component');

SB.Timer = function(param)
{
    SB.Component.call(this);
    this.currentTime = SB.Time.instance.currentTime;
    this.running = false;
    this.duration = (param && param.duration) ? param.duration : 0;
}

goog.inherits(SB.Timer, SB.Component);

SB.Timer.prototype.update = function()
{
	if (!this.running)
		return;
	
	var now = SB.Time.instance.currentTime;
	var deltat = now - this.currentTime;
	
	if (deltat)
	{
	    this.publish("time", now);		
	}
	
	if (this.duration)
	{
		var mod = now % this.duration;
		var fract = mod / this.duration;
		
		this.publish("fraction", fract);
	}
	
	this.currentTime = now;
	
}

SB.Timer.prototype.start = function()
{
	this.running = true;
}

SB.Timer.prototype.stop = function()
{
	this.running = false;
}

/**
 * @fileoverview A visual containing a cylinder mesh.
 * @author Tony Parisi
 */
goog.provide('SB.CylinderVisual');
goog.require('SB.Visual');

/**
 * @param {Object} param supports the following options:
 *   radiusTop (number): The top radius of the cylinder
 *   radiusBottom (number): The bottom radius of the cylinder
 *   height (number): The height of the cylinder
 *   segmentsRadius (number): The radius of the segments
 *   segmentsHeight (number): The height of the segments
 *   openEnded (boolean): Whether the cylinder is open ended
 * @constructor
 * @extends {SB.Visual}
 */
SB.CylinderVisual = function(param) {
    SB.Visual.call(this, param);

    this.param = param || {};
}

goog.inherits(SB.CylinderVisual, SB.Visual);

SB.CylinderVisual.prototype.realize = function()
{
	SB.Visual.prototype.realize.call(this);
	
    var radiusTop = this.param.radiusTop || 1.0;
    var radiusBottom = this.param.radiusBottom || 1.0;
    var height = this.param.height || 1.0;
    var segmentsRadius = this.param.segmentsRadius || 100;
    var segmentsHeight = this.param.segmentsHeight || 100;
    var openEnded = this.param.openEnded || false;
    var color = this.param.color || 0xFFFFFF;
    var ambient = this.param.ambient || 0;
    
	var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segmentsRadius, segmentsHeight, openEnded);
	this.object = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color : color }));
	
    this.addToScene();
}
/**
 * @fileoverview A visual containing an arbitrary mesh.
 * @author Tony Parisi
 */
goog.provide('SB.Mesh');
goog.require('SB.Visual');

/**
 * @param {Object} param supports the following options:
 * @constructor
 * @extends {SB.Visual}
 */
SB.Mesh = function(param) {
    SB.Visual.call(this, param);

    this.param = param || {};
    this.param.color = this.param.color || 0;
    this.param.wireframe = this.param.wireframe || false;
}

goog.inherits(SB.Mesh, SB.Visual);

SB.Mesh.prototype.realize = function()
{
	SB.Visual.prototype.realize.call(this);
	
	this.geometry = new THREE.Geometry();
	this.geometry.dynamic = true;
	this.material = new THREE.MeshPhongMaterial({wireframe:this.param.wireframe, color: this.param.color});
	
	this.object = new THREE.Mesh(this.geometry, this.material);
	
    this.addToScene();
}

SB.Mesh.prototype.rebuild = function()
{
	this.geometry.computeCentroids();
	this.geometry.computeFaceNormals();
	this.geometry.computeBoundingBox();
	this.geometry.computeBoundingSphere();
	this.removeFromScene();
	
	this.object = new THREE.Mesh(this.geometry, this.material);
	this.addToScene();
}/**
 * @fileoverview FSM - Finite State Machine class
 * 
 * @author Tony Parisi
 */

goog.provide('SB.FSM');

SB.FSM = function(param)
{
    this._currentState = null;
    if (param)
    {
        this._currentState = param.state;
    }
}
	        
SB.FSM.prototype.update = function(object)
{
    if (this._currentState)
    {
        this._currentState.execute(object);
    }
}

SB.FSM.prototype.changeState = function(state, object)
{
    if (this._currentState == state)
    {
        return;
    }

    if (this._currentState)
    {
        this._currentState.exit(object);
    }

    if (state)
    {
        state.enter(object);
        this._currentState = state;
    }
}

goog.require('SB.Prefabs');

SB.Prefabs.FPSController = function(param)
{
	var controller = new SB.Entity(param);
	var transform = new SB.Transform;
	controller.addComponent(transform);
	controller.transform.position.set(0, 0, 5);
	var controllerScript = new SB.FPSControllerScript;
	controller.addComponent(controllerScript);

	var dragger = new SB.Dragger();
	var rotator = new SB.Rotator();
	var timer = new SB.Timer( { duration : 3333 } );
	
	controller.addComponent(dragger);
	controller.addComponent(rotator);
	controller.addComponent(timer);

	dragger.subscribe("move", controllerScript, controllerScript.onDraggerMove);
	rotator.subscribe("rotate", controllerScript, controllerScript.onRotatorRotate);
	timer.subscribe("time", controllerScript, controllerScript.onTimeChanged);
	timer.subscribe("fraction", controllerScript, controllerScript.onTimeFractionChanged);	
	
	var viewpoint = new SB.Entity;
	var transform = new SB.Transform;
	var camera = new SB.Camera({active:true});
	viewpoint.addComponent(transform);
	viewpoint.addComponent(camera);
	viewpoint.transform = transform;
	viewpoint.camera = camera;

	controller.addChild(viewpoint);

	var intensity = param.headlight ? 1 : 0;
	var color = param.headlight ? 0xFFFFFF : 0;
	
	var headlight = new SB.DirectionalLight({ color : color, intensity : intensity });
	controller.addComponent(headlight);
	
	return controller;
}

goog.provide('SB.FPSControllerScript');
goog.require('SB.Component');

SB.FPSControllerScript = function(param)
{
	SB.Component.call(this, param);

	this.directionMatrix = new THREE.Matrix4;
	this.moveDir = new THREE.Vector3;
	this.turnDir = new THREE.Vector3;
	this.lookDir = new THREE.Vector3;
	this.cameraPos = null;
	
	this.lastdy = 0;
	this.dragging = false;
}

goog.inherits(SB.FPSControllerScript, SB.Component);

SB.FPSControllerScript.prototype.realize = function()
{
	this.dragger = this._entity.getComponent(SB.Dragger);
	this.rotator = this._entity.getComponent(SB.Rotator);
	this.timer = this._entity.getComponent(SB.Timer);
	this.viewpoint = this._entity.getChild(0);
	
	SB.Game.instance.mouseDelegate = this;
	SB.Game.instance.keyboardDelegate = this;
}

SB.FPSControllerScript.prototype.update = function()
{
	if (this.cameraPos)
	{
		this._entity.transform.position.copy(this.cameraPos);
		this.cameraPos = null;
	}
}

SB.FPSControllerScript.prototype.setCameraPos = function(pos)
{
	if (this.cameraPos)
	{
		this.cameraPos.copy(pos);
	}
	else
	{
		this.cameraPos = pos.clone();
	}
}

SB.FPSControllerScript.prototype.move = function(dir)
{
	this.directionMatrix.identity();
	this.directionMatrix.setRotationFromEuler(this._entity.transform.rotation);
	dir = this.directionMatrix.multiplyVector3(dir);
	this._entity.transform.position.addSelf(dir);
}

SB.FPSControllerScript.prototype.turn = function(dir)
{
	this._entity.transform.rotation.addSelf(dir);
}

SB.FPSControllerScript.prototype.mouseLook = function(dir)
{
	this.viewpoint.transform.rotation.addSelf(dir);
}


SB.FPSControllerScript.prototype.onMouseMove = function(x, y)
{
	this.dragger.set(x, y);
	this.rotator.set(x, y);
}

SB.FPSControllerScript.prototype.onMouseDown = function(x, y)
{
	this.dragger.start(x, y);
	this.rotator.start(x, y);
	this.dragging = true;
}

SB.FPSControllerScript.prototype.onMouseUp = function(x, y)
{
	this.dragger.stop(x, y);
	this.rotator.stop(x, y);
	this.dragging = false;
	this.lastdy = 0;
}

SB.FPSControllerScript.prototype.onMouseScroll = function(delta)
{
	this.moveDir.set(0, 0, -delta);
	this.move(this.moveDir);
}

SB.FPSControllerScript.prototype.onKeyDown = function(keyCode, charCode)
{
	this.whichKeyDown = keyCode;
	
	this.timer.start();
}

SB.FPSControllerScript.prototype.onKeyUp = function(keyCode, charCode)
{
	this.lastdy = 0;
	this.whichKeyDown = 0;
	this.turnFraction = 0;
	
	this.timer.stop();
}

SB.FPSControllerScript.prototype.onKeyPress = function(keyCode, charCode)
{
}


SB.FPSControllerScript.prototype.onRotatorRotate = function(axis, delta)
{
	return; // this don' work yet
	
	delta *= .666;
	
	if (delta != 0)
	{
		// this.controllerScript.transform.rotation.y -= delta;
		this.lookDir.set(0, -delta, 0);
		this.mouseLook(this.lookDir);
	}
}

SB.FPSControllerScript.prototype.onDraggerMove = function(dx, dy)
{
	if (Math.abs(dy) <= 2)
		dy = 0;
	
	dy *= .002;
	
	if (dy)
	{
		this.lastdy = dy;
	}
	else if (this.lastdy && this.dragging)
	{
		dy = this.lastdy;
	}

	if (dy != 0)
	{
		// this.controllerScript.transform.position.z -= dy;
		this.lookDir.set(dy, 0, 0);
		this.mouseLook(this.lookDir);
	}	
}

SB.FPSControllerScript.prototype.onTimeChanged = function(t)
{
	var turnfraction = .0416;
	var movefraction = .1666;
	var turnamount = 0;
	var moveamount = 0;
	var handled = false;
	
	switch (this.whichKeyDown)
	{
    	case SB.Keyboard.KEY_LEFT : 
    		turnamount = +1 * turnfraction;
			handled = true;
    		break;
    	case SB.Keyboard.KEY_UP : 
    		moveamount = -1 * movefraction;
			handled = true;
    		break;
    	case SB.Keyboard.KEY_RIGHT : 
    		turnamount = -1 * turnfraction;
			handled = true;
    		break;
    	case SB.Keyboard.KEY_DOWN : 
    		moveamount = +1 * movefraction;
			handled = true;
    		break;
	}

	if (!handled)
	{
		switch (String.fromCharCode(this.whichKeyDown))
		{
	    	case 'A' :
	    		turnamount = +1 * turnfraction;
	    		handled = true;
	    		break;
	    		
	    	case 'W' :
	    		moveamount = -1 * movefraction;
	    		handled = true;
	    		break;
	    	case 'D' :
	    		turnamount = -1 * turnfraction;
				handled = true;
	    		break;
	    	case 'S' :
	    		moveamount = +1 * movefraction;
				handled = true;
	    		break;
	    		
	    	default : 
	    		break;
		}
	}

	if (moveamount)
	{
		this.moveDir.set(0, 0, moveamount);
		this.move(this.moveDir);
	}
	
	if (turnamount)
	{
		this.turnDir.set(0, turnamount, 0);
		this.turn(this.turnDir);
	}
}

SB.FPSControllerScript.prototype.onTimeFractionChanged = function(fraction)
{
	this.turnFraction = fraction;
}

/**
 * @fileoverview A rectangle visual
 * @author Tony Parisi
 */

goog.provide('SB.Pane');
goog.require('SB.Visual');

SB.Pane = function(param) {

    SB.Visual.call(this, param);

    this.param = param || {};
}

goog.inherits(SB.Pane, SB.Visual)

SB.Pane.prototype.realize = function()
{
	SB.Visual.prototype.realize.call(this);
	
    var width = this.param.width || 1;
    var height = this.param.height || 1;
    var segmentsWidth = 8;
    var segmentsHeight = 8; // N.B.: do these ever need to be a soft setting?
    
    var material = this.param.material || new THREE.MeshBasicMaterial( { color: 0x80aaaa, opacity: 1, transparent: false, wireframe: false } );
    material.side = THREE.DoubleSide;
	
	var geometry = new THREE.PlaneGeometry( width, height, segmentsWidth, segmentsHeight );
	
    this.object = new THREE.Mesh(geometry, material);

    this.addToScene();
}

/**
 * @fileoverview
 */

goog.provide('SB.PhysicsMaterial');

/**
 * Interface for a PhysicsMaterial.
 * @interface
 */
SB.PhysicsMaterial = function() {};
goog.provide('SB.Picker');
goog.require('SB.Component');

SB.Picker = function(param) {
    SB.Component.call(this, param);

    // this.post = true; // these messages get posted to sim queue since they're async, kinda
}

goog.inherits(SB.Picker, SB.Component);

SB.Picker.prototype.realize = function()
{
	SB.Component.prototype.realize.call(this);
	
	this.overCursor = this.param.overCursor;
	
	if (this._entity)
	{
		var object = this._entity.transform;
		if (object)
		{
			object.picker = this;
		}
	}
}

SB.Picker.prototype.update = function()
{
}

SB.Picker.prototype.onMouseOver = function(x, y)
{
    this.publish("mouseOver", x, y);
}

SB.Picker.prototype.onMouseOut = function(x, y)
{
    this.publish("mouseOut", x, y);
}
	        	        
SB.Picker.prototype.onMouseMove = function(x, y)
{
    this.publish("mouseMove", x, y);
}

SB.Picker.prototype.onMouseDown = function(x, y)
{
    this.publish("mouseDown", x, y);
}

SB.Picker.prototype.onMouseUp = function(x, y)
{
    this.publish("mouseUp", x, y);
}
	        
SB.Picker.prototype.onMouseScroll = function(delta)
{
    this.publish("mouseScroll", delta);
}

SB.Picker.handleMouseMove = function(x, y)
{
    // console.log("PICKER Mouse move " + x + ", " + y);

    if (SB.Picker.clickedObject && SB.Picker.clickedObject.onMouseMove)
    {
        SB.Picker.clickedObject.onMouseMove(x, y);
    }
    else
    {
        var oldObj = SB.Picker.overObject;
        SB.Picker.overObject = SB.Picker.objectFromMouse(x, y);

        if (SB.Picker.overObject != oldObj)
        {
    		if (oldObj)
    		{
    			SB.Graphics.instance.setCursor('auto');
    			
    			if (oldObj.onMouseOut)
                {
                    oldObj.onMouseOut(x, y);
                }
    		}

            if (SB.Picker.overObject)
            {            	
	        	if (SB.Picker.overObject.overCursor)
	        	{
	        		SB.Graphics.instance.setCursor(SB.Picker.overObject.overCursor);
	        	}
	        	
	        	if (SB.Picker.overObject.onMouseOver)
	        	{
	        		SB.Picker.overObject.onMouseOver(x, y);
	        	}
            }
        }
    }
}

SB.Picker.handleMouseDown = function(x, y)
{
    // console.log("PICKER Mouse down " + x + ", " + y);

    SB.Picker.clickedObject = SB.Picker.objectFromMouse(x, y);
    if (SB.Picker.clickedObject && SB.Picker.clickedObject.onMouseDown)
    {
        SB.Picker.clickedObject.onMouseDown(x, y);
    }
}

SB.Picker.handleMouseUp = function(x, y)
{
    // console.log("PICKER Mouse up " + x + ", " + y);

    if (SB.Picker.clickedObject && SB.Picker.clickedObject.onMouseUp)
    {
        SB.Picker.clickedObject.onMouseUp(x, y);
    }

    SB.Picker.clickedObject = null;
}

SB.Picker.handleMouseScroll = function(delta)
{
    // console.log("PICKER Mouse up " + x + ", " + y);

    if (SB.Picker.overObject && SB.Picker.overObject.onMouseScroll)
    {
        SB.Picker.overObject.onMouseScroll(delta);
    }

    SB.Picker.clickedObject = null;
}

SB.Picker.objectFromMouse = function(x, y)
{
	var intersected = SB.Graphics.instance.objectFromMouse(x, y);
	if (intersected.object)
	{
    	if (intersected.object.picker)
    	{
    		return intersected.object.picker;
    	}
    	else
    	{
    		return SB.Picker.findObjectPicker(intersected.object.object);
    	}
	}
	else
	{
		return null;
	}
}

SB.Picker.findObjectPicker = function(object)
{
	while (object)
	{
		if (object.data && object.data.picker)
		{
			return object.data.picker;
		}
		else
		{
			object = object.parent;
		}
	}
	
	return null;
}


SB.Picker.clickedObject = null;
SB.Picker.overObject  =  null;
/**
 * @fileoverview A visual containing a model in Collada format
 * @author Tony Parisi
 */
goog.provide('SB.ColladaModel');
goog.require('SB.Model');

SB.ColladaModel = function(param) 
{
    SB.Model.call(this, param);
}

goog.inherits(SB.ColladaModel, SB.Model);
	       
SB.ColladaModel.prototype.handleLoaded = function(data)
{
	this.object = data.scene;
    this.skin = data.skins[0];
    
    this.addToScene();
}
	        
SB.ColladaModel.prototype.update = function()
{
	SB.Model.prototype.update.call(this);
	
	if (!this.animating)
		return;
	
	if ( this.skin )
	{
    	var now = Date.now();
    	var deltat = (now - this.startTime) / 1000;
    	var fract = deltat - Math.floor(deltat);
    	this.frame = fract * this.frameRate;
		
		for ( var i = 0; i < this.skin.morphTargetInfluences.length; i++ )
		{
			this.skin.morphTargetInfluences[ i ] = 0;
		}

		this.skin.morphTargetInfluences[ Math.floor( this.frame ) ] = 1;
	}
}
/**
 *
 */
goog.provide('SB.Annotation');
goog.require('SB.PubSub');

SB.Annotation = function(param)
{
	SB.PubSub.call(this);
	
	this.id = (param && param.id) ? param.id : "";
	var style = (param && param.style) ? param.style : "";
	var elt = $('<div class="annotation ' + style + '" id = "' + this.id + '">');
	this.dom = elt[0];
	document.body.appendChild(this.dom);

	param = param || {};
	if (param.html)
	{
		this.setHTML(html);
	}
	
	this.visible = param.visible || false;
	if (this.visible)
	{
		this.show();
	}
}
        
goog.inherits(SB.Annotation, SB.PubSub);

SB.Annotation.prototype.setHTML = function(html)
{
	this.dom.innerHTML = html;
}

SB.Annotation.prototype.setPosition = function(pos)
{
	var width = this.dom.offsetWidth;
	var height = this.dom.offsetHeight;
	
	var newpos = pos.clone();
	newpos.x -= width / 2;
	newpos.y -= height / 2;
	
	this.dom.style.left = newpos.x + "px";
	this.dom.style.top = newpos.y + "px";
}

SB.Annotation.prototype.show  = function()
{
	this.dom.style.display = 'block';
	this.visible = true;
}

SB.Annotation.prototype.hide  = function()
{
	this.dom.style.display = 'none';
	this.visible = false;
}

/**
 * @fileoverview General-purpose key frame animation
 * @author Tony Parisi
 */
goog.provide('SB.KeyFrameAnimator');
goog.require('SB.Component');

// KeyFrameAnimator class
// Construction/initialization
SB.KeyFrameAnimator = function(param) 
{
    SB.Component.call(this, param);
	    		
	param = param || {};
	
	this.interpdata = param.interps || [];
	this.running = false;
	this.duration = param.duration ? param.duration : SB.KeyFrameAnimator.default_duration;
	this.loop = param.loop ? param.loop : false;
}

goog.inherits(SB.KeyFrameAnimator, SB.Component);
	
SB.KeyFrameAnimator.prototype.realize = function()
{
	SB.Component.prototype.realize.call(this);
	
	if (this.interpdata)
	{
		this.createInterpolators(this.interpdata);
	}	    		
}

SB.KeyFrameAnimator.prototype.createInterpolators = function(interpdata)
{
	this.interps = [];
	
	var i, len = interpdata.length;
	for (i = 0; i < len; i++)
	{
		var data = interpdata[i];
		var interp = new SB.Interpolator({ keys: data.keys, values: data.values, target: data.target });
		interp.realize();
		this.interps.push(interp);
	}
}

// Start/stop
SB.KeyFrameAnimator.prototype.start = function()
{
	if (this.running)
		return;
	
	this.startTime = Date.now();
	this.running = true;
}

SB.KeyFrameAnimator.prototype.stop = function()
{
	this.running = false;
	this.publish("complete");
}

// Update - drive key frame evaluation
SB.KeyFrameAnimator.prototype.update = function()
{
	if (!this.running)
		return;
	
	var now = Date.now();
	var deltat = (now - this.startTime) % this.duration;
	var nCycles = Math.floor((now - this.startTime) / this.duration);
	var fract = deltat / this.duration;

	if (nCycles >= 1 && !this.loop)
	{
		this.running = false;
		this.publish("complete");
		var i, len = this.interps.length;
		for (i = 0; i < len; i++)
		{
			this.interps[i].interp(1);
		}
		return;
	}
	else
	{
		var i, len = this.interps.length;
		for (i = 0; i < len; i++)
		{
			this.interps[i].interp(fract);
		}
	}
}
// Statics
SB.KeyFrameAnimator.default_duration = 1000;
/**
 * @fileoverview A visual containing a cylinder mesh.
 * @author Tony Parisi
 */
goog.provide('SB.CubeVisual');
goog.require('SB.Visual');

/**
 * @param {Object} param supports the following options:
 *   radiusTop (number): The top radius of the cylinder
 *   radiusBottom (number): The bottom radius of the cylinder
 *   height (number): The height of the cylinder
 *   segmentsRadius (number): The radius of the segments
 *   segmentsHeight (number): The height of the segments
 *   openEnded (boolean): Whether the cylinder is open ended
 * @constructor
 * @extends {SB.Visual}
 */
SB.CubeVisual = function(param) {
    SB.Visual.call(this, param);

    this.param = param || {};
}

goog.inherits(SB.CubeVisual, SB.Visual);

SB.CubeVisual.prototype.realize = function()
{
	SB.Visual.prototype.realize.call(this);
	
    var width = this.param.width || 2.0;
    var height = this.param.height || 2.0;
    var depth = this.param.depth || 2.0;
    var color;
    if (this.param.color === null)
    {
    	color = 0x808080;
    }
    else
    {
    	color = this.param.color;
    }
    
    var map = this.param.map;
    
    var ambient = this.param.ambient || 0;
    
	var geometry = new THREE.CubeGeometry(width, height, depth);
	this.object = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial( { color: color, map:map, opacity: 1, ambient: ambient, transparent: false, wireframe: false } ));
	
    this.addToScene();
}

/**
 * @fileoverview General-purpose key frame animation
 * @author Tony Parisi
 */
goog.provide('SB.Interpolator');
goog.require('SB.PubSub');

//Interpolator class
//Construction/initialization
SB.Interpolator = function(param) 
{
	SB.PubSub.call(param);
	    		
	param = param || {};
	
	this.keys = param.keys || [];
	this.values = param.values || [];
	this.target = param.target ? param.target : null;
	this.running = false;
}

goog.inherits(SB.Interpolator, SB.PubSub);
	
SB.Interpolator.prototype.realize = function()
{
	if (this.keys && this.values)
	{
		this.setValue(this.keys, this.values);
	}	    		
}

SB.Interpolator.prototype.setValue = function(keys, values)
{
	this.keys = [];
	this.values = [];
	if (keys && keys.length && values && values.length)
	{
		this.copyKeys(keys, this.keys);
		this.copyValues(values, this.values);
	}
}

//Copying helper functions
SB.Interpolator.prototype.copyKeys = function(from, to)
{
	var i = 0, len = from.length;
	for (i = 0; i < len; i++)
	{
		to[i] = from[i];
	}
}

SB.Interpolator.prototype.copyValues = function(from, to)
{
	var i = 0, len = from.length;
	for (i = 0; i < len; i++)
	{
		var val = {};
		this.copyValue(from[i], val);
		to[i] = val;
	}
}

SB.Interpolator.prototype.copyValue = function(from, to)
{
	for ( var property in from ) {
		
		if ( from[ property ] === null ) {		
		continue;		
		}

		to[ property ] = from[ property ];
	}
}

//Interpolation and tweening methods
SB.Interpolator.prototype.interp = function(fract)
{
	var value;
	var i, len = this.keys.length;
	if (fract == this.keys[0])
	{
		value = this.values[0];
	}
	else if (fract >= this.keys[len - 1])
	{
		value = this.values[len - 1];
	}

	for (i = 0; i < len - 1; i++)
	{
		var key1 = this.keys[i];
		var key2 = this.keys[i + 1];

		if (fract >= key1 && fract <= key2)
		{
			var val1 = this.values[i];
			var val2 = this.values[i + 1];
			value = this.tween(val1, val2, (fract - key1) / (key2 - key1));
		}
	}
	
	if (this.target)
	{
		this.copyValue(value, this.target);
	}
	else
	{
		this.publish("value", value);
	}
}

SB.Interpolator.prototype.tween = function(from, to, fract)
{
	var value = {};
	for ( var property in from ) {
		
		if ( from[ property ] === null ) {		
		continue;		
		}

		var range = to[property] - from[property];
		var delta = range * fract;
		value[ property ] = from[ property ] + delta;
	}
	
	return value;
}
/**
 * @fileoverview Rotator - converts x,y mouse motion into rotation about an axis (event-driven)
 * 
 * @author Tony Parisi
 */
goog.provide('SB.Rotator');
goog.require('SB.Component');

SB.Rotator = function(param)
{
    SB.Component.call(this);
    this.target = (param && param.target) ? param.target : null;
    this.axis = (param && param.axis) ? param.axis : 'y';
    this.lastx = SB.Mouse.NO_POSITION;
    this.lasty = SB.Mouse.NO_POSITION;
    this.x = SB.Mouse.NO_POSITION;
    this.y = SB.Mouse.NO_POSITION;
    this.running = false;
}

goog.inherits(SB.Rotator, SB.Component);
	        
SB.Rotator.prototype.start = function(x, y)
{
    this.lastx = x;
    this.lasty = y;
    this.x = this.lastx;
    this.y = this.lasty;
    this.running = true;
}

SB.Rotator.prototype.set = function(x, y)
{
    this.x = x;
    this.y = y;
}

SB.Rotator.prototype.stop = function(x, y)
{
    this.x = x;
    this.y = y;

    this.running = false;
}

SB.Rotator.prototype.update = function()
{
    if (!this.running)
    {
        return;
    }

    var dx = this.x - this.lastx;
    var dy = this.y - this.lasty;

    this.publish("rotate", this.axis, dx * 0.01);

    this.lastx = this.x;
    this.lasty = this.y;
}
/**
 * @fileoverview ScreenTracker - converts x,y mouse motion into rotation about an axis (event-driven)
 * 
 * @author Tony Parisi
 */
goog.provide('SB.ScreenTracker');
goog.require('SB.Component');

SB.ScreenTracker = function(param)
{
	this.param = param || {};
	this.referencePosition = param.referencePosition ? param.referencePosition : new THREE.Vector3();
	
    SB.Component.call(this);
    this.running = false;
}

goog.inherits(SB.ScreenTracker, SB.Component);

SB.ScreenTracker.prototype.realize = function()
{
    // Track our position based on the transform component and camera matrix
    this.object = this._entity.transform.object;
    var instance = SB.Graphics.instance;
	this.camera = instance.camera;
	this.projector = instance.projector;
	this.container = instance.container;
	this.renderer = instance.renderer;

    SB.Component.prototype.realize.call(this);
}

SB.ScreenTracker.prototype.start = function()
{
	this.position = this.calcPosition();
    this.running = true;
}

SB.ScreenTracker.prototype.stop = function(x, y)
{
    this.running = false;
}

SB.ScreenTracker.prototype.update = function()
{
	this.camera = SB.Graphics.instance.camera;
	
    if (!this.running)
    {
        return;
    }

    var pos = this.calcPosition();
	if (this.position.x != pos.x ||
			this.position.y != pos.y ||
			this.position.z != pos.z)
	{
	    this.publish("position", pos);
	    this.position = pos;
	}
}

SB.ScreenTracker.prototype.calcPosition = function()
{
	// Get object position in screen space
	var mat = this.object.matrixWorld;
	var pos = this.referencePosition.clone();
	pos = mat.multiplyVector3(pos);

	var projected = pos.clone();
	this.projector.projectVector(projected, this.camera);
	
	var eltx = (1 + projected.x) * this.container.offsetWidth / 2 ;
	var elty = (1 - projected.y) * this.container.offsetHeight / 2;

	var offset = $(this.renderer.domElement).offset();	
	eltx += offset.left;
	elty += offset.top;

	var cameramat = this.camera.matrixWorldInverse;
	var cameraspacepos = cameramat.multiplyVector3(pos);
	
	return new THREE.Vector3(eltx, elty, -cameraspacepos.z);
}
/**
 * @fileoverview PlaneDragger - converts x,y mouse motion into x, y object position output
 * 
 * @author Tony Parisi
 */

goog.provide('SB.PlaneDragger');
goog.require('SB.Component');

SB.PlaneDragger = function(param)
{
	SB.Component.call(this, param);	
}

goog.inherits(SB.PlaneDragger, SB.Component);

SB.PlaneDragger.prototype.realize = function(object)
{
	// Connect us to the object to drag
    this.object = this._entity.transform.object;
    
    // Squirrel away some info
    var instance = SB.Graphics.instance;
	this.projector = instance.projector;
	this.container = instance.container;
	this.renderer = instance.renderer;
	
    // And some helpers
	this.dragOffset = new THREE.Vector3;
	this.dragHitPoint = new THREE.Vector3;
	this.dragStartPoint = new THREE.Vector3;
	this.dragPlane = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0x000000 } ) );
}

SB.PlaneDragger.prototype.beginDrag = function(x, y)
{
	var planeIntersects = this.getPlaneIntersection(x, y);
	
	if (planeIntersects.length)
	{
		this.dragOffset.copy( planeIntersects[ 0 ].point.subSelf( this.dragPlane.position ));
		this.dragStartPoint = this.object.position.clone();
	}
}

SB.PlaneDragger.prototype.drag = function(x, y)
{
	var planeIntersects = this.getPlaneIntersection(x, y);
	
	if (planeIntersects.length)
	{
		this.dragHitPoint.copy(planeIntersects[ 0 ].point.subSelf( this.dragOffset ) );
		this.dragHitPoint.addSelf(this.dragStartPoint);
		this.publish("drag", this.dragHitPoint);
	}			
}

SB.PlaneDragger.prototype.endDrag = function(x, y)
{
	// Nothing to do, just here for completeness
}

SB.PlaneDragger.prototype.getPlaneIntersection = function(x, y)
{
	var camera = SB.Graphics.instance.camera;
	
	// Translate page coords to element coords
	var offset = $(this.renderer.domElement).offset();	
	var eltx = x - offset.left;
	var elty = y - offset.top;
	
	// Translate client coords into viewport x,y
	var vpx = ( eltx / this.container.offsetWidth ) * 2 - 1;
	var vpy = - ( elty / this.container.offsetHeight ) * 2 + 1;
	
	var vector = new THREE.Vector3( vpx, vpy, 0.5 );
	
	this.projector.unprojectVector( vector, camera );
	
    var cameraPos = new THREE.Vector3;
    cameraPos = camera.matrixWorld.multiplyVector3(cameraPos);
    
	var ray = new THREE.Ray( cameraPos, vector.subSelf( cameraPos ).normalize() );
	
	return ray.intersectObject( this.dragPlane );
}

goog.provide('SB.SceneUtils');

SB.SceneUtils.computeBoundingBox = function(scene)
{
	function compute(obj, boundingBox)
	{
		if (obj instanceof THREE.Mesh)
		{
			var geometry = obj.geometry;
			if (geometry)
			{
				if (!geometry.boundingBox)
				{
					geometry.computeBoundingBox();
				}
				
				var geometryBBox = geometry.boundingBox;
				var bboxMin = geometryBBox.min.clone();
				var bboxMax = geometryBBox.max.clone();
				var matrix = obj.matrixWorld;
				
				matrix.multiplyVector3(bboxMin);
				matrix.multiplyVector3(bboxMax);
				
				if ( bboxMin.x < boundingBox.min.x ) {

					boundingBox.min.x = bboxMin.x;

				}
				
				if ( bboxMax.x > boundingBox.max.x ) {

					boundingBox.max.x = bboxMax.x;

				}

				if ( bboxMin.y < boundingBox.min.y ) {

					boundingBox.min.y = bboxMin.y;

				}
				
				if ( bboxMax.y > boundingBox.max.y ) {

					boundingBox.max.y = bboxMax.y;

				}

				if ( bboxMin.z < boundingBox.min.z ) {

					boundingBox.min.z = bboxMin.z;

				}
				
				if ( bboxMax.z > boundingBox.max.z ) {

					boundingBox.max.z = bboxMax.z;

				}
				
			}
		}
		else
		{
			var i, len = obj.children.length;
			for (i = 0; i < len; i++)
			{
				compute(obj.children[i], boundingBox);
			}
		}
	}
	
	var boundingBox = { min: new THREE.Vector3(), max: new THREE.Vector3() };
	
	compute(scene, boundingBox);
	
	return boundingBox;
}

/**
 * @fileoverview NetworkClient - Broadcast/listen on network
 * 
 * @author Tony Parisi
 */
goog.provide('SB.NetworkClient');
goog.require('SB.Component');

SB.NetworkClient = function(param)
{
	this.param = param || {};
	
    SB.Component.call(this);
    this.running = false;
}

goog.inherits(SB.NetworkClient, SB.Component);

SB.NetworkClient.prototype.realize = function()
{
	SB.Component.prototype.realize.call(this);
}

SB.NetworkClient.prototype.start = function()
{
    this.running = true;
}

SB.NetworkClient.prototype.stop = function(x, y)
{
    this.running = false;
}

SB.NetworkClient.prototype.update = function()
{	
    if (!this.running)
    {
        return;
    }
}
/**
 * @fileoverview A PointSet visual
 * @author Tony Parisi
 */

goog.provide('SB.PointSet');
goog.require('SB.Visual');

SB.PointSet = function(param) {

    SB.Visual.call(this, param);

    this.param = param || {};
    this.param.color = this.param.color || 0;
    this.param.opacity = this.param.opacity || 1;
    this.param.size = this.param.size || 1;
}

goog.inherits(SB.PointSet, SB.Visual)

SB.PointSet.prototype.realize = function()
{
	SB.Visual.prototype.realize.call(this);
	
	// Create a group to hold our particles
	var group = new THREE.Object3D();

	var i;
	var geometry = new THREE.Geometry();

	var nVerts = this.param.points.length;
	
	for ( i = 0; i < nVerts; i++)
	{		
		geometry.vertices.push( new THREE.Vertex( this.param.points[i] ) );
	}

	var material = new THREE.ParticleBasicMaterial( { color: this.param.color, 
		opacity : this.param.opacity,
		size: this.param.size, 
		sizeAttenuation: false } );
	
	var particles = new THREE.ParticleSystem( geometry, material );

	group.add( particles );

	this.object = group;
	    
    this.addToScene();
}

/**
 * @fileoverview Zoomer - converts scalar input to x,y,z scale output
 * 
 * @author Tony Parisi
 */

goog.provide('SB.Zoomer');
goog.require('SB.Component');

SB.Zoomer = function(param)
{
    SB.Component.call(this);
    this.target = (param && param.target) ? param.target : null;
    this.scale = (param && param.scale) ? param.scale :{ x : 1, y : 1, z : 1 };
    this.oldScale = { x : this.scale.x, y : this.scale.y, z : this.scale.z };
}

goog.inherits(SB.Zoomer, SB.Component);
	        
SB.Zoomer.prototype.zoom = function(ds)
{
    this.scale.x *= ds;
    this.scale.y *= ds;
    this.scale.z *= ds;
}

SB.Zoomer.prototype.update = function()
{
    if (this.scale.x != this.oldScale.x || this.scale.y != this.oldScale.y || this.scale.z != this.oldScale.z)
    {
        this.publish("scale", this.scale.x, this.scale.y, this.scale.z);

        this.oldScale.x = this.scale.x;
        this.oldScale.y = this.scale.y;
        this.oldScale.z = this.scale.z;
    }
}
goog.provide('SB.LightComponent');
goog.require('SB.SceneComponent');

SB.LightComponent = function(param)
{
	SB.SceneComponent.call(this, param);
}

goog.inherits(SB.LightComponent, SB.SceneComponent);

SB.LightComponent.prototype.realize = function()
{
	SB.SceneComponent.prototype.realize.call(this);
	
	this.object = new THREE.DirectionalLight(0xffffff);
    this.object.position.set(1, 0, 0).normalize();
	
	this.addToScene();
}
goog.provide('SB.RigidBodyCircleBox2D');
goog.require('SB.RigidBodyBox2D');

SB.RigidBodyCircleBox2D = function(radius)
{
    SB.RigidBodyBox2D.call(this);

    // Create the fixture definition
    var fixtureDef = new b2FixtureDef();
	fixtureDef.shape = new b2CircleShape(radius);
	fixtureDef.friction = 0.4;
	fixtureDef.restitution = 0.6;
	fixtureDef.density = 1.0;

    // Create the body definition
	var ballBd = new b2BodyDef();
	ballBd.type = b2Body.b2_dynamicBody;
	ballBd.position.Set(0,0);

    // Create the body
	this.body = SB.Services.physics.addBody(ballBd);

    // Create the fixture
	this.fixture = this.body.CreateFixture(fixtureDef);
} ;

goog.inherits(SB.RigidBodyCircleBox2D, SB.RigidBodyBox2D);
/**
 * @fileoverview File Manager - load game assets using Ajax
 * 
 * @author Tony Parisi
 */

goog.provide('SB.Modules');
goog.require('SB.Config');
goog.require('SB.Interpolator');
goog.require('SB.KeyFrame');
goog.require('SB.KeyFrameAnimator');
goog.require('SB.Camera');
goog.require('SB.WalkthroughControllerScript');
goog.require('SB.FPSControllerScript');
goog.require('SB.Component');
goog.require('SB.Entity');
goog.require('SB.FSM');
goog.require('SB.Game');
goog.require('SB.Service');
goog.require('SB.Services');
goog.require('SB.PubSub');
goog.require('SB.Dragger');
goog.require('SB.PlaneDragger');
goog.require('SB.PollingRotator');
goog.require('SB.Rotator');
goog.require('SB.Zoomer');
goog.require('SB.EventService');
goog.require('SB.File');
goog.require('SB.Graphics');
goog.require('SB.Input');
goog.require('SB.Keyboard');
goog.require('SB.Mouse');
goog.require('SB.Picker');
goog.require('SB.DirectionalLight');
goog.require('SB.Loader');
goog.require('SB.NetworkClient');
goog.require('SB.PhysicsBody');
goog.require('SB.PhysicsBodyBox2D');
goog.require('SB.PhysicsMaterial');
goog.require('SB.PhysicsSystem');
goog.require('SB.PhysicsSystemBox2D');
goog.require('SB.RigidBodyCircleBox2D');
goog.require('SB.RigidBodyBox2D');
goog.require('SB.Prefabs');
goog.require('SB.SceneComponent');
goog.require('SB.Transform');
goog.require('SB.Time');
goog.require('SB.Timer');
goog.require('SB.Annotation');
goog.require('SB.Popup');
goog.require('SB.View');
goog.require('SB.SceneUtils');
goog.require('SB.ScreenTracker');
goog.require('SB.Tracker');
goog.require('SB.Viewer');
goog.require('SB.ColladaModel');
goog.require('SB.JsonModel');
goog.require('SB.JsonScene');
goog.require('SB.CubeVisual');
goog.require('SB.CylinderVisual');
goog.require('SB.Grid');
goog.require('SB.Mesh');
goog.require('SB.Model');
goog.require('SB.Pane');
goog.require('SB.PointSet');
goog.require('SB.Visual');

goog.require('SB.Shaders');
goog.require('SB.LightComponent');

/**
 * @constructor
 */
SB.Modules = function()
{
}

        
