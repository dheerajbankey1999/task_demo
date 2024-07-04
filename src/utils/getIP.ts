import { Request } from 'express';

const getIP = (req: Request): string => {
  const forwardedIpsStr = req.header('x-forwarded-for');
   console.log("THis is x-forwarded-for", forwardedIpsStr);

  if (forwardedIpsStr) {
    const forwardedIps = forwardedIpsStr.split(',');
    return forwardedIps[0];
  }

  return req.socket.remoteAddress ? req.socket.remoteAddress : '';
};

export default getIP;
