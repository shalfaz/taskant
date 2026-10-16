const timeoutMs = 5000;

async function loadDependencies() {
  const [dotenv, dns, net, tls, mongodb] = await Promise.all([
    import('dotenv'),
    import('node:dns'),
    import('node:net'),
    import('node:tls'),
    import('mongodb'),
  ]);

  dotenv.config();
  return {
    dns: dns.promises,
    net,
    tls,
    MongoClient: mongodb.MongoClient,
  };
}

const dependencies = loadDependencies();

function errorCode(error) {
  return error?.code || error?.name || 'unknown error';
}

function getErrorChain(error) {
  const errors = [];
  const seen = new Set();

  while (error && !seen.has(error)) {
    errors.push(error);
    seen.add(error);
    error = error.cause;
  }

  return errors;
}

function sanitizeMessage(message, uri, parsedUri) {
  let sanitized = String(message).replace(
    /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi,
    '[redacted MongoDB URI]'
  );

  const credentials = [parsedUri?.username, parsedUri?.password]
    .filter(Boolean)
    .flatMap((credential) => {
      try {
        return [credential, decodeURIComponent(credential)];
      } catch {
        return [credential];
      }
    });

  for (const secret of [uri, ...credentials]) {
    if (secret) sanitized = sanitized.split(secret).join('[redacted]');
  }

  return sanitized;
}

function classifyMongoError(errors) {
  const codes = errors.map((error) => error.code);
  const details = errors
    .map((error) => `${error.name || ''} ${error.message || ''}`)
    .join(' ')
    .toLowerCase();

  if (
    codes.includes(18) ||
    errors.some((error) => error.name === 'MongoAuthenticationError') ||
    /authentication failed|bad auth|auth failed/.test(details)
  ) {
    return 'Authentication failed; check the Atlas database user and password.';
  }

  if (
    codes.some((code) => ['ENOTFOUND', 'EAI_AGAIN', 'ESERVFAIL'].includes(code)) ||
    /getaddrinfo|dns lookup/.test(details)
  ) {
    return 'DNS resolution failed.';
  }

  if (
    codes.some((code) =>
      ['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENETUNREACH'].includes(code)
    ) ||
    /timed out|timeout|ip address.*not allowed|not whitelisted|network access/.test(details)
  ) {
    return 'Network access or connection timeout; check the firewall and Atlas IP access list.';
  }

  if (/ssl|tls|handshake/.test(details)) {
    return 'TLS handshake failed; check network/firewall TLS inspection and Atlas cluster availability.';
  }

  return 'MongoDB connection or ping failed; check Atlas cluster status and connection settings.';
}

function testTcp(host, port, net) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let finished = false;

    const finish = (result) => {
      if (!finished) {
        finished = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.setTimeout(timeoutMs, () => finish({ ok: false, code: 'ETIMEDOUT' }));
    socket.once('connect', () => finish({ ok: true }));
    socket.once('error', (error) => finish({ ok: false, code: errorCode(error) }));
  });
}

function testTls(host, port, tls) {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host,
      port,
      servername: host,
      rejectUnauthorized: true,
      timeout: timeoutMs,
    });
    let finished = false;

    const finish = (result) => {
      if (!finished) {
        finished = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.once('secureConnect', () =>
      finish({ ok: socket.authorized, code: socket.authorized ? undefined : 'CERT_NOT_AUTHORIZED' })
    );
    socket.once('timeout', () => finish({ ok: false, code: 'ETIMEDOUT' }));
    socket.once('error', (error) => finish({ ok: false, code: errorCode(error) }));
  });
}

function printEndpointResults(label, results) {
  const passed = results.filter((result) => result.ok).length;
  const codes = [...new Set(results.filter((result) => !result.ok).map((result) => result.code))];
  console.log(`${label}: ${passed}/${results.length} endpoints passed.`);

  results.forEach((result, index) => {
    console.log(
      `  endpoint ${index + 1}: ${result.ok ? 'passed' : `failed (${result.code})`}`
    );
  });

  if (codes.length) {
    console.log(`${label} error codes: ${codes.join(', ')}`);
  }
}

async function testMongoConnection() {
  const { dns, net, tls, MongoClient } = await dependencies;
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri || uri === 'PASTE_YOUR_MONGODB_ATLAS_CONNECTION_STRING_HERE') {
    console.log('MongoDB test stopped: MONGODB_URI is missing or is still the placeholder.');
    process.exitCode = 1;
    return;
  }

  let parsedUri;
  try {
    parsedUri = new URL(uri);
    if (!['mongodb+srv:', 'mongodb:'].includes(parsedUri.protocol) || !parsedUri.hostname) {
      throw new Error('Unsupported MongoDB URI format.');
    }
    if (parsedUri.protocol === 'mongodb+srv:' && parsedUri.port) {
      throw new Error('mongodb+srv URIs must not specify a port.');
    }
  } catch {
    console.log('MongoDB test stopped: MONGODB_URI has an invalid MongoDB URI format.');
    process.exitCode = 1;
    return;
  }

  console.log(`URI format: valid (${parsedUri.protocol.slice(0, -1)}).`);

  let endpoints;
  if (parsedUri.protocol === 'mongodb+srv:') {
    try {
      endpoints = await dns.resolveSrv(`_mongodb._tcp.${parsedUri.hostname}`);
      if (!endpoints.length) throw new Error('No SRV records found.');
      console.log(`DNS SRV: passed (${endpoints.length} endpoints found).`);
    } catch (error) {
      console.log(`DNS SRV: failed (${errorCode(error)}).`);
      console.log('MongoDB authentication/ping: not tested because DNS SRV lookup failed.');
      process.exitCode = 1;
      return;
    }

    try {
      const txtRecords = await dns.resolveTxt(parsedUri.hostname);
      console.log(`DNS TXT: passed (${txtRecords.length} records found; values hidden).`);
    } catch (error) {
      console.log(`DNS TXT: ${error.code === 'ENODATA' ? 'no TXT records found' : `lookup failed (${errorCode(error)})`}; values hidden.`);
    }
  } else {
    endpoints = [{ name: parsedUri.hostname, port: Number(parsedUri.port) || 27017 }];
    console.log('DNS SRV: skipped (URI uses mongodb://, not mongodb+srv://).');
  }

  const tcpResults = await Promise.all(
    endpoints.map((endpoint) =>
      testTcp(endpoint.name.replace(/\.$/, ''), endpoint.port, net)
    )
  );
  printEndpointResults('TCP', tcpResults);

  const tlsRequested =
    parsedUri.protocol === 'mongodb+srv:' ||
    ['true', '1'].includes(parsedUri.searchParams.get('tls')?.toLowerCase()) ||
    ['true', '1'].includes(parsedUri.searchParams.get('ssl')?.toLowerCase());

  let tlsResults = [];
  if (tlsRequested) {
    tlsResults = await Promise.all(
      endpoints.map((endpoint) =>
        testTls(endpoint.name.replace(/\.$/, ''), endpoint.port, tls)
      )
    );
    printEndpointResults('TLS (certificate verification enabled)', tlsResults);
  } else {
    console.log('TLS: skipped (URI does not request TLS).');
  }

  if (tlsRequested && !tlsResults.some((result) => result.ok)) {
    console.log('MongoDB authentication/ping: not tested because TLS did not succeed.');
    process.exitCode = 1;
    return;
  }

  let client;
  try {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    await client.db().command({ ping: 1 });
    console.log('MongoDB authentication/ping: passed.');
  } catch (error) {
    const errors = getErrorChain(error);
    const primaryError = errors[0];
    const code = errors.find((item) => item.code !== undefined)?.code;
    const message = errors
      .map((item) => item.message)
      .filter(Boolean)
      .join(' | ');

    const likelyCause = classifyMongoError(errors);
    console.log('MongoDB driver connection/ping: failed.');
    console.log(`Likely cause: ${likelyCause}`);
    if (likelyCause.startsWith('TLS handshake failed')) {
      console.log('MongoDB authentication: not reached; the TLS handshake failed first.');
    }
    console.log(`Error name: ${primaryError?.name || 'Unknown'}`);
    console.log(`Error code: ${code === undefined ? 'unavailable' : code}`);
    console.log(
      `Sanitized message: ${sanitizeMessage(message || 'No error message available.', uri, parsedUri)}`
    );
    process.exitCode = 1;
  } finally {
    if (client) {
      await client.close().catch(() => {});
    }
  }
}

testMongoConnection().catch(() => {
  console.log('MongoDB diagnostic failed unexpectedly; no error details were printed to protect credentials.');
  process.exitCode = 1;
});
