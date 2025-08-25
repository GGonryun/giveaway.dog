import countries from 'i18n-iso-countries';
import { widetype } from './widetype';

countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

const continents = {
  AFR: 'Africa',
  ANT: 'Antarctica',
  ASI: 'Asia',
  EUR: 'Europe',
  OCE: 'Oceania',
  NOA: 'North America',
  SOA: 'South America'
};

const countryOptions = Object.keys(countries.getAlpha3Codes()).map((code) => ({
  group: 'Country',
  label: countries.getName(code, 'en'),
  value: code
}));

const continentOptions = widetype.entries(continents).map(([code, name]) => ({
  group: 'Continent',
  label: name,
  value: code
}));

export { countryOptions, continentOptions };
