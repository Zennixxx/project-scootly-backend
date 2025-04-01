import nodeCache from "node-cache";

const cache = new nodeCache({
  stdTTL: 5,
  checkperiod: 5,
});

export default cache;
