
<img src="https://i.imgur.com/f92HlAo.png" width="100%">


### URL routing inspired by express for the frontend!

Aviation helps you build simple javascript apps that **run right in the browser**.
No server side processing needed.

<br />

Aviation **automatically tracks link clicks, history events and page loads**, and invokes your functions.

<br />

+ Create dynamic websites (especially dashboards) easily.
+ In-built response functions for stuff like changing content and setting cookies.
+ Parses URLs, queries, cookies and parameters for you.

<br />

# Getting Started

First include Aviation in your code

```html
<script src="https://cdn.jsdelivr.net/npm/aviation"></script>
```

Let's create a simple app that shows a welcome message on page load!

```javascript

var app = Aviation()

app.use(function(req, res, next) {
  res.html("<h1>Welcome Home</h1>")
})
```

<br />
Now, let's unleash Aviation's capabilities with a dynamic example.

In this example, we'll create a menu on page load.


We'll be able to **browse to different pages, without actually reloading the page**.

```javascript

var app = Aviation()

app.on("/", function(req, res, next) {
  res.page("Home").html("<h1>Welcome Home</h1> <a href='/news'>View News</a>")
})

app.on("/news", function(req, res, next) {
  res.page("News").html("<h1>News</h1> <h3>Aviation takes flight</h3> <a href='/'>Back Home</a>'")
})
```

Here's the result:

![gif](https://media.giphy.com/media/28LM3yKnqjuY6I7zbn/giphy.gif)
<br />


# Functions

## Aviation(options)

This creates a new instance of Aviation with the supplied options.
Possible options are:
+ contentWrapper (String) This is the element res.html() will update with content. Defaults to `body`.
+ onError (Function) This is the function that will be called when an error occurs. It's provided with the err, req, res, next arguments. Defaults to `console.error`.
+ caseSensitive - (Boolean) Should /app and /App not be considered the same? Defaults to false.
+ strict - (Boolean) Should /app and /app/ not be considered the same? Defaults to false.
+ removeFromPath - (String or Regex) Removes the string or matching regex from all paths. Useful for running local projects, or anything inside a directory.
+ event - (String) The event type to listen for. Defaults to `click`.
+ source - (String) The source types to listen for. Defaults to `a[href]:not([target='_blank'])`.


 Returns the `.use() `and `.handle()` functions.


<br />

## .use(callback) or .use(path, callback)

This function registers a callback that Aviation will call when a request that matches its path is received. It also has an alias, `.on(path, callback)`.

**The path can be an array of paths, or a simple string, or a regex.**
When a path isn't supplied, all requests are routed to that callback.


### Advanced Paths

You can specify parameters in the path. Aviation will expose these using `req.params`.

```javascript
app.use("/users/:user/orders/:order", function(req) { console.log(req.params) })
```


You can also specify wildcards.
For example, Aviation will send a request for /users/dev/orders to the following function.

```javascript
app.use("/users/*", function(req) { console.log(req.url) })
```


<br />

## .handle(url)

This function handles loading a new URL.
It can also handle events. Advanced usages can directly call this when they want to use Aviation rather than waiting for someone to click a link.


<br />

## Callback Functions

Whenever Aviation invokes a callback, it provides three functions as arguments.

```javascript
function myCallback(request, response, next) {
}
```

### Request
+ url - This is the URL of the request.
+ hostname - This is the hostname (domain) of the request.
+ pathname - This is the path of the request, like /app.
+ protocol - This is the protocol of the request.
+ secure - Boolean, whether the request is over HTTPS.
+ query - Key-value object, this is the parsed query string of the URL.
+ params - Key-value object, these are the parameters for URL requests.
+ cookies - Key-value object, these are the parsed browser cookies.
+ aviation - A reference to the Aviation instance.


### Response
+ **cookie(key, value, options)** - Saves a cookie in the browser. Options can have: `maxAge`, `expires`, `path`, `domain`, `secure` or `sameSite`.

<br />

+ **clearCookie(key, options)** - Deletes a cookie from the browser. Options other than `maxAge` and `expires` must be the same or cookie deletion won't work.

<br />

+ **redirect(url)** - Redirects to this URL. If Aviation has a callback for this URL, it'll be called, else a real redirection will occur. It also has an alias, `location(url)`.

<br />

+ **page(title, url)** - Updates the page title and creates a history event. If no URL is specified, the request URL will be used.

<br />

+ **html(content)** - Essentially a wrapper for jQuery's .html(). Updates the content of the page.


<br />


### Next()

Invoking `next()` makes Aviation run the next matching function for this request.


```javascript

app.use(function(req, res, next) {
  //Some error occured, skip to next function.
  next()
})

app.use(function(req, res, next) {
  console.log("Running backup function")
})

```


<br />


## Aviation.element(type, [props], ...children)
Writing HTML as strings in JS is hard. So just write pure HTML, JSX helps you with that. And this function, when set as the pragma for JSX instead of React.createElement, turns that JSX into safe JS that can be used on any browser.
Returns a jQuery element.


#### Using Aviation.element through JSX via Babel:

```javascript
const jsxCode = 'var el = <div></div>; console.log(el)' //OR: fs.readFileSync("./app.jsx")
const babel = require("@babel/core")

var result = babel.transformSync(jsxCode, {presets: [["@babel/preset-react", {pragma: "Aviation.element"}]]})

//JS: result.code
```


#### Using Aviation.element directly:

```javascript
var el = Aviation.element("div", {class: "test-div"}, "text inside div")

console.log(el)
```

