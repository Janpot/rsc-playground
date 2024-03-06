const keys = new WeakMap();
let nextKey = 1;

export function getObjectKey(obj: Function | Object) {
  let key = keys.get(obj);
  if (!key) {
    key = nextKey++;
    keys.set(obj, key);
  }
  return key;
}
