var passes = exports;

/*!
 * Array of passes.
 *
 * A `pass` is just a function that is executed on `req, res, options`
 * so that you can easily add new checks while still keeping the base
 * flexible.
 */

[ // <--

  /**
   * If is a HTTP 1.0 request, remove chunk headers
   *
   * @param {ClientRequest} Req Request object
   * @param {IncomingMessage} Res Response object
   * @param {proxyResponse} Res Response object from the proxy request
   *
   * @api private
   */
  function removeChunked(req, res, proxyRes) {
    if(req.httpVersion === '1.0') {
      delete proxyRes.headers['transfer-encoding'];
    }
  },

  /**
   * If is a HTTP 1.0 request, set the correct connection header
   * or if connection header not present, then use `keep-alive`
   *
   * @param {ClientRequest} Req Request object
   * @param {IncomingMessage} Res Response object
   * @param {proxyResponse} Res Response object from the proxy request
   *
   * @api private
   */
  function setConnection(req, res, proxyRes) {
    if (req.httpVersion === '1.0') {
      proxyRes.headers.connection = req.headers.connection || 'close';
    } else if (!proxyRes.headers.connection) {
      proxyRes.headers.connection = req.headers.connection || 'keep-alive';
    }
  },

  /**
   * Copy headers from proxyResponse to response
   * set each header in response object.
   *
   * If the x-forwarded-host header is set, cookies will be updated to use the
   * host url instead of the target url.
   *
   * @param {ClientRequest} Req Request object
   * @param {IncomingMessage} Res Response object
   * @param {proxyResponse} Res Response object from the proxy request
   *
   * @api private
   */
  function writeHeaders(req, res, proxyRes) {
    var source = req.headers.host,
        target = req.headers['x-forwarded-host'],
        cookies = proxyRes.headers['set-cookie'],
        count = (cookies && cookies.length) || 0,
        portRe,
        targetRe;

    if (source && target && count) {
      portRe = /:\d+$/;
      source = source.replace(portRe, '');
      target = target.replace(portRe, '');

      targetRe = new RegExp(target, 'g');

      while (count--) {
        cookies[count] = cookies[count].replace(targetRe, source);
      }
    }

    Object.keys(proxyRes.headers).forEach(function(key) {
      res.setHeader(key, proxyRes.headers[key]);
    });
  },

  /**
   * Set the statusCode from the proxyResponse
   *
   * @param {ClientRequest} Req Request object
   * @param {IncomingMessage} Res Response object
   * @param {proxyResponse} Res Response object from the proxy request
   *
   * @api private
   */
  function writeStatusCode(req, res, proxyRes) {
    res.writeHead(proxyRes.statusCode);
  }

] // <--
  .forEach(function(func) {
    passes[func.name] = func;
  });
