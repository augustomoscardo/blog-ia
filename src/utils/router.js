function compilePath(path) {
  const paramNames = [];
  const pattern = path
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        paramNames.push(segment.slice(1));
        return "([^/]+)";
      }

      return segment;
    })
    .join("/");

  return {
    paramNames,
    matcher: new RegExp(`^${pattern || "/"}$`),
  };
}

export function createRouter() {
  const routes = [];

  function addRoute(method, path, handler) {
    routes.push({ method, handler, ...compilePath(path) });
  }

  async function handle(request, response) {
    const requestUrl = new URL(request.url || "/", "http://localhost");
    const route = routes.find((candidate) => {
      return candidate.method === request.method && candidate.matcher.test(requestUrl.pathname);
    });

    if (!route) {
      return false;
    }

    const match = route.matcher.exec(requestUrl.pathname);
    request.params = Object.fromEntries(
      route.paramNames.map((name, index) => [name, decodeURIComponent(match[index + 1])]),
    );

    await route.handler(request, response);
    return true;
  }

  return {
    get: (path, handler) => addRoute("GET", path, handler),
    post: (path, handler) => addRoute("POST", path, handler),
    handle,
  };
}
