import proxy from "express-http-proxy";

const proxtWithHeader = (serviceUrl) => {
  try {
    return proxy(serviceUrl, {
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        if (srcReq.user) {
          proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        }
      },
    });
  } catch (error) {
    console.log("Error in ProxyWithHeader:", error);
  }
};

export default proxtWithHeader;
