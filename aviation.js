/*
URL routing for frontend apps!
+ Inspired by express.


Written by Devang Srivastava ( https://github.com/SociallyDev )

MIT License ( https://opensource.org/licenses/MIT )
*/


/********************************************* PRIMARY FUNCTION **********************************************/


/*
The Aviation class.
*/
function Aviation(options) {
  if(!(this instanceof Aviation)) { return new Aviation(options) }
  if(typeof options !== "object") { options = {strict: false, caseSensitive: false} }
  var callbacks = [], aviation = this, contentWrapper = document.querySelector(options.contentWrapper || "body"), onError = options.onError || function(e) { console.error(e) }


  /******************************************** ROUTING FUNCTIONS **********************************************/


  /*
  Adds callbacks.
  */
  this.on = function(match, callback) {
    var path = match, fn = callback, keys = []
    if(path == "*") { path = /^.*$/ }
    if(!callback) { fn = match, path = /^.*$/ }

    //Convert path to regex.
    if(!(path instanceof RegExp)) {
      if(path.constructor == Array || path.constructor == Object) { for(var i in path) { aviation.use(path[i], callback) }; return aviation }
      else { path = String(path) }
      var flags = ""

      var a = document.createElement("a")
      a.href = path
      path = a.pathname
      if(!options.strict) { path = path.replace(/\/$/, "") }
      if(!options.caseSensitive) { flags = "i" }
      if(options.removeFromPath) { path = path.replace(options.removeFromPath, "") }

      //Handle params.
      if(/\:/.test(path)) {
        path = path.replace(/\*+/g, "").replace(/:([^\/]+)/g, function(a, key) { keys.push(key); return "([^\\/]+?)" })
        path = new RegExp("^" + path.split("([^\\/]+?)").map(function(p) { return p.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&") }).join("([^\\/]+?)") + "$", flags)
      }
      else {
        path = new RegExp("^" + path.split(/\*+/).map(function(p) { return p.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&") }).join(".*") + "$", flags)
      }
    }

    //Add to list of callbacks.
    callbacks.push({
      path: path,
      keys: keys,
      fn: fn
    })

    return aviation
  }
  this.use = this.on



  /*
  Handles requests.
  */
  this.handle = function(e, skipPushingHistory, realTarget) {
    //Get the URL & convert it to a link element.
    if(!realTarget) { realTarget = e.target }
    var url = typeof e == "string" ? e : (realTarget ? realTarget.getAttribute("href") : (e.href ? e.href : (this.href ? this.href : "")))
    var a = document.createElement("a")
    a.href = url
    var path = a.pathname

    //Handle any filtering.
    if(!options.strict) { path = path.replace(/\/$/, "") }
    if(options.removeFromPath) { path = path.replace(options.removeFromPath, "") }

    //Create a list of viable callbacks.
    var viableCbs = []
    for(var i in callbacks) {
      var cb = callbacks[i]
      if(cb.path && cb.path.test(path)) {
        var params = {}, vals = path.match(cb.path).slice(1)
        if(cb.keys.length) { for(var i in vals) { params[cb.keys[i]] = vals[i] } }
        viableCbs.push({fn: cb.fn, params: params})
      }
    }
    if(!viableCbs.length) { return aviation }

    //Create request, response and next functions.
    if(e.preventDefault) { e.preventDefault() }
    if(!path || path[0] !== "/") { path = "/" + (path || "") }
    var request = {
      url: a.href,
      hostname: a.hostname,
      path: path,
      protocol: (a.protocol ? a.protocol.replace(":", "") : null),
      secure: false,
      query: parseQuery(a.href),
      params: {},
      cookies: parseCookies(),
      aviation: aviation
    }
    if(request.protocol == "https") { request.secure = true }

    var response = {
      cookie: function(key, val, options) {
        if(!options) { options = {} }
        request.cookies[key] = val
        if(typeof options.maxAge == "undefined" && typeof options.expires == "undefined") { options.maxAge = 2.628e+6 }
        document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(val)
        + (options.maxAge ? ";max-age=" + encodeURIComponent(options.maxAge) : "")
        + (options.expires ? ";expires=" + encodeURIComponent(options.expires) : "")
        + (options.path ? ";path=" + encodeURIComponent(options.path) : ";path")
        + (options.domain ? ";domain=" + encodeURIComponent(options.domain) : "")
        + (options.secure ? ";secure=" + encodeURIComponent(options.secure) : "")
        + (options.sameSite ? ";samesite=" + encodeURIComponent(options.sameSite) : "")
        return this
      },

      clearCookie: function(key, options) {
        options.maxAge = -1
        this.cookie(key, null, options)
        delete request.cookies[key]
        return this
      },

      location: function(url) {
        var redirect = true
        aviation.handle({href: url, preventDefault: function() { redirect = false }})
        if(redirect) { window.location = url }
        return this
      },

      redirect: function(url) { return this.location(url) },

      page: function(title, url) {
        if(typeof history !== "undefined" && history.pushState && options.changeURL !== false && skipPushingHistory !== true) { history.pushState({url: url || request.url}, title, url || request.url) }
        document.querySelector("title").innerText = title
        return this
      },

      html: function(content) {
        contentWrapper.innerHTML = ''
        contentWrapper.append(content)
        return this
      }
    }

    var next = function(e) {
      try {
        if(e) { throw e }
        i++
        var cb = viableCbs[i]
        if(!cb) { return }
        request.params = cb.params
        var result = cb.fn(request, response, next)
        if(result && result.catch) { result.catch(function(e) { onError(e, request, response, next) }) }
      }
      catch(e) { onError(e, request, response, next) }
    }, i = -1

    //Start request.
    next()

    return aviation
  }



  //Setup calls.
  if(options.skipOnLoad !== true) { document.addEventListener(options.loadEvent || "DOMContentLoaded", function() { aviation.handle(window.location) }) }
  (options.eventWrapper || document).addEventListener(options.event || "click", function(e) {
    var matched = false
    for(var i in e.path) {
      if(e.path[i] && e.path[i].matches && e.path[i].matches(options.source || "a[href]:not([target='_blank'])")) {
        matched = e.path[i]
        break
      }
    }
    if(!matched) { return }
    aviation.handle(e, false, matched)
  })
  if(options.skipPopstate !== true && options.changeURL !== false) { window.addEventListener("popstate", function(e) { aviation.handle(e.state.url, true) }, false) }





  /********************************************* HELPER FUNCTIONS **********************************************/


  /*
  Parses query.
  */
  var parseQuery = function(qs) {
    if(!/\?/.test(qs)) { return {} }
    var query = {}, pairs = qs.split("?")[1].split("&")
    for(var i in pairs) { var pair = pairs[i].split("="); query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]) }
    return query
  }



  /*
  Parses cookies.
  */
  var parseCookies = function() {
    var cookies = {}, cookie = document.cookie.split(";")
    for(var i in cookie) { var pair = cookie[i].split("="); if(!pair[0] || !pair[1]) { continue }; cookies[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]) }
    return cookies
  }

}





/********************************************* BUILDER FUNCTIONS **********************************************/


/*
Writing HTML as strings in JS is hard.
So just write pure HTML, JSX helps you with that.
And this function, when set as the pragma for JSX instead of React.createElement,
turns that JSX into safe JS that can be used on any browser.
*/
Aviation.element = function() {
  //Get the type & props.
  var children = arguments, type = "div", props = false
  if(children[0] && typeof children[0] == "string") { type = children[0]; delete children[0] }
  if(children[1] && typeof children[1] == "object") { props = children[1]; delete children[1] }

  //Make this element.
  var el = document.createElement(type)
  if(props) {
    //Add properties.
    if(props.className) { props.class = props.className; delete props.className }
    if(props.style && props.style.constructor == Object) {
      for(var name in props.style) { el.style[name] = props.style[name] }
      delete props.style
    }
    for(var name in props) {
      if(props[name] === false) { continue }
      el.setAttribute(name, props[name])
    }
  }

  //Add children inside this element.
  for(var i in children) {
    if(!children[i]) { continue }
    if(!children[i].isAviationElement) { children[i] = String(children[i]) }
    el.append(children[i])
  }

  //Mark this element as an Aviation element to stop Aviation from converting this to text if it's a child.
  el.isAviationElement = true
  return el
}



/*
Escapes text for safe usage.
*/
Aviation.safe = function(text) {
  if(!text) { return "" }
  text = String(text).replace(/\&/gi, "&amp;").replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;").replace(/\"/gi, "&quot;").replace(/\'/gi, "&#x27;").replace(/\//gi, "&#x2F;")
  return text
}
