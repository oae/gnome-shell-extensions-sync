// Copyright (C) 2018 O. Alperen Elhan
//
// This file is part of Extensions Sync.
//
// Extensions Sync is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 2 of the License, or
// (at your option) any later version.
//
// Extensions Sync is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Extensions Sync.  If not, see <http://www.gnu.org/licenses/>.
//

const GLib = imports.gi.GLib;

var setTimeout = (func, millis) => {
  return GLib.timeout_add(GLib.PRIORITY_DEFAULT, millis, () => {
    func();

    return false;
  });
};

var clearTimeout = id => GLib.Source.remove(id);

var setInterval = (func, millis) => {
  let id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, millis, () => {
    func();

    return true;
  });

  return id;
};

var clearInterval = id => GLib.Source.remove(id);

var logger = prefix => content => extensionsSync.debug && log(`[extensions-sync] [${prefix}] ${content}`);

function isObject(value) {
  const type = typeof value
  return value != null && (type == 'object' || type == 'function')
}

function debounce(func, wait, options) {
  let lastArgs,
    lastThis,
    maxWait,
    result,
    timerId,
    lastCallTime

  let lastInvokeTime = 0
  let leading = false
  let maxing = false
  let trailing = true

  if (typeof func != 'function') {
    throw new TypeError('Expected a function')
  }
  wait = +wait || 0
  if (isObject(options)) {
    leading = !!options.leading
    maxing = 'maxWait' in options
    maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait
    trailing = 'trailing' in options ? !!options.trailing : trailing
  }

  function invokeFunc(time) {
    const args = lastArgs
    const thisArg = lastThis

    lastArgs = lastThis = undefined
    lastInvokeTime = time
    result = func.apply(thisArg, args)
    return result
  }

  function startTimer(pendingFunc, wait) {
    return setTimeout(pendingFunc, wait)
  }

  function cancelTimer(id) {
    clearTimeout(id)
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time
    // Start the timer for the trailing edge.
    timerId = startTimer(timerExpired, wait)
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall

    return maxing
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait))
  }

  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    // Restart the timer.
    timerId = startTimer(timerExpired, remainingWait(time))
  }

  function trailingEdge(time) {
    timerId = undefined

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = lastThis = undefined
    return result
  }

  function cancel() {
    if (timerId !== undefined) {
      cancelTimer(timerId)
    }
    lastInvokeTime = 0
    lastArgs = lastCallTime = lastThis = timerId = undefined
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(Date.now())
  }

  function pending() {
    return timerId !== undefined
  }

  function debounced(...args) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime)
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = startTimer(timerExpired, wait)
        return invokeFunc(lastCallTime)
      }
    }
    if (timerId === undefined) {
      timerId = startTimer(timerExpired, wait)
    }
    return result
  }
  debounced.cancel = cancel
  debounced.flush = flush
  debounced.pending = pending
  return debounced
}

// This parser is take from https://github.com/kawanet/from-xml. Credits to from-xml developers.
function xmlParser(text, reviver) {
  var UNESCAPE = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&apos;": "'",
    "&quot;": '"'
  };

  var ATTRIBUTE_KEY = "@";
  var CHILD_NODE_KEY = "#";

  function parseXML(text) {
    var list = String.prototype.split.call(text, /<([^!<>?](?:'[\S\s]*?'|"[\S\s]*?"|[^'"<>])*|!(?:--[\S\s]*?--|\[[^\[\]'"<>]+\[[\S\s]*?]]|DOCTYPE[^\[<>]*?\[[\S\s]*?]|(?:ENTITY[^"<>]*?"[\S\s]*?")?[\S\s]*?)|\?[\S\s]*?\?)>/);
    var length = list.length;

    // root element
    var root = {f: []};
    var elem = root;

    // dom tree stack
    var stack = [];

    for (var i = 0; i < length;) {
      // text node
      var str = list[i++];
      if (str) appendText(str);

      // child node
      var tag = list[i++];
      if (tag) parseNode(tag);
    }

    return root;

    function parseNode(tag) {
      var tagLength = tag.length;
      var firstChar = tag[0];
      if (firstChar === "/") {
        // close tag
        var closed = tag.replace(/^\/|[\s\/].*$/g, "").toLowerCase();
        while (stack.length) {
          var tagName = elem.n && elem.n.toLowerCase();
          elem = stack.pop();
          if (tagName === closed) break;
        }
      } else if (firstChar === "?") {
        // XML declaration
        appendChild({n: "?", r: tag.substr(1, tagLength - 2)});
      } else if (firstChar === "!") {
        if (tag.substr(1, 7) === "[CDATA[" && tag.substr(-2) === "]]") {
          // CDATA section
          appendText(tag.substr(8, tagLength - 10));
        } else {
          // comment
          appendChild({n: "!", r: tag.substr(1)});
        }
      } else {
        var child = openTag(tag);
        appendChild(child);
        if (tag[tagLength - 1] === "/") {
          child.c = 1; // emptyTag
        } else {
          stack.push(elem); // openTag
          elem = child;
        }
      }
    }

    function appendChild(child) {
      elem.f.push(child);
    }

    function appendText(str) {
      str = removeSpaces(str);
      if (str) appendChild(unescapeXML(str));
    }
  }

  function openTag(tag) {
    var elem = {f: []};
    tag = tag.replace(/\s*\/?$/, "");
    var pos = tag.search(/[\s='"\/]/);
    if (pos < 0) {
      elem.n = tag;
    } else {
      elem.n = tag.substr(0, pos);
      elem.t = tag.substr(pos);
    }
    return elem;
  }

  function parseAttribute(elem, reviver) {
    if (!elem.t) return;
    var list = elem.t.split(/([^\s='"]+(?:\s*=\s*(?:'[\S\s]*?'|"[\S\s]*?"|[^\s'"]*))?)/);
    var length = list.length;
    var attributes, val;

    for (var i = 0; i < length; i++) {
      var str = removeSpaces(list[i]);
      if (!str) continue;

      if (!attributes) {
        attributes = {};
      }

      var pos = str.indexOf("=");
      if (pos < 0) {
        // bare attribute
        str = ATTRIBUTE_KEY + str;
        val = null;
      } else {
        // attribute key/value pair
        val = str.substr(pos + 1).replace(/^\s+/, "");
        str = ATTRIBUTE_KEY + str.substr(0, pos).replace(/\s+$/, "");

        // quote: foo="FOO" bar='BAR'
        var firstChar = val[0];
        var lastChar = val[val.length - 1];
        if (firstChar === lastChar && (firstChar === "'" || firstChar === '"')) {
          val = val.substr(1, val.length - 2);
        }

        val = unescapeXML(val);
      }
      if (reviver) {
        val = reviver(str, val);
      }
      addObject(attributes, str, val);
    }

    return attributes;
  }

  function removeSpaces(str) {
    return str && str.replace(/^\s+|\s+$/g, "");
  }

  function unescapeXML(str) {
    return str.replace(/(&(?:lt|gt|amp|apos|quot|#(?:\d{1,6}|x[0-9a-fA-F]{1,5}));)/g, function(str) {
      if (str[1] === "#") {
        var code = (str[2] === "x") ? parseInt(str.substr(3), 16) : parseInt(str.substr(2), 10);
        if (code > -1) return String.fromCharCode(code);
      }
      return UNESCAPE[str] || str;
    });
  }

  function toObject(elem, reviver) {
    if ("string" === typeof elem) return elem;

    var raw = elem.r;
    if (raw) return raw;

    var attributes = parseAttribute(elem, reviver);
    var object;
    var childList = elem.f;
    var childLength = childList.length;

    if (attributes || childLength > 1) {
      // merge attributes and child nodes
      object = attributes || {};
      childList.forEach(function(child) {
        if ("string" === typeof child) {
          addObject(object, CHILD_NODE_KEY, child);
        } else {
          addObject(object, child.n, toObject(child, reviver));
        }
      });
    } else if (childLength) {
      // the node has single child node but no attribute
      var child = childList[0];
      object = toObject(child, reviver);
      if (child.n) {
        var wrap = {};
        wrap[child.n] = object;
        object = wrap;
      }
    } else {
      // the node has no attribute nor child node
      object = elem.c ? null : "";
    }

    if (reviver) {
      object = reviver(elem.n || "", object);
    }

    return object;
  }

  function addObject(object, key, val) {
    if ("undefined" === typeof val) return;
    var prev = object[key];
    if (prev instanceof Array) {
      prev.push(val);
    } else if (key in object) {
      object[key] = [prev, val];
    } else {
      object[key] = val;
    }
  }

  return toObject(parseXML(text), reviver);
}
