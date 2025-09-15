import countriesData from './countries.json';
import continentsData from './continents.json';

const countryOptions = countriesData.map(({ n, a }) => ({
  group: 'Country',
  label: n,
  value: a
}));

const continentOptions = continentsData.map(({ a, n }) => ({
  group: 'Continent',
  label: n,
  value: a
}));

export { countryOptions, continentOptions };
