function autoResolveRoutes(routes, basePath = "") {
  return new Proxy(routes, {
    get(target, prop) {
      if (prop === "Root") return basePath;
      if (prop in target) {
        const value = target[prop];
        if (typeof value === "string") {
          return basePath + value;
        } else {
          return autoResolveRoutes(value, basePath + (value.Root || ""));
        }
      }
      return undefined;
    },
  });
}

const routes = {
  v1: {
    Root: "/v1",
    auth: {
      Root: "/auth",
      signup: "/signup",
      signin: "/signin",
      signout: "/signout",
      verify: "/verify/:token",
      forget: "/forgetPassword",
      reset: "/resetPassword/:token",
      google: "/google",
      github: "/github",
      authenticated: "/authenticated",
    },
    users: {
      Root: "/users",
    },
    forms: {
      Root: "/forms",
    },
  },
};

module.exports = autoResolveRoutes(routes);
