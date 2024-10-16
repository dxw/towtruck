const pathParamRegex = /^\{(\w+)\}$/;

const pathSegments = (path) => {
  return path.split("/").filter(part => !!part);
};

const getPathParamFromSegment = (segment) => segment.match(pathParamRegex)?.[1];

const pathMatches = (pathA, pathB) => {
  const pathSegmentsA = pathSegments(pathA);
  const pathSegmentsB = pathSegments(pathB);

  const params = {};
  for (let i = 0; i < Math.max(pathSegmentsA.length, pathSegmentsB.length); i++) {
    const a = pathSegmentsA[i];
    const b = pathSegmentsB[i];

    if (!a || !b) {
      return [false, undefined, undefined];
    }

    const param = getPathParamFromSegment(a);
    if (param) {
      params[param] = b;
    } else if (a !== b) {
      return [false, undefined, undefined];
    }
  }

  return [true, pathA, params];
};

export const match = (handlers, pathName) => {
  const match = Object
    .keys(handlers)
    .map(handlerPath => pathMatches(handlerPath, pathName))
    .filter(([matches]) => matches)
    .reduce(
      (best, [, path, params]) => best?.params?.length > params.length ? best : { path, params },
      null
    );

  return [handlers[match?.path], match?.params];
};
