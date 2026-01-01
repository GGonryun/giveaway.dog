import _ from 'lodash';

export const replaceIdsDeep = <T>(value: T, generator: () => string): T => {
  const recurse = (val: any): any => {
    if (_.isArray(val)) {
      return val.map(recurse);
    }

    if (_.isPlainObject(val)) {
      return _.mapValues(val, (v, key) =>
        key === 'id' ? generator() : recurse(v)
      );
    }

    return val;
  };

  return recurse(value);
};
