import countriesData from './countries.json';
import continentsData from './continents.json';
import { ApplicationError } from './errors';

export type Country = `country:${string}` & { __brand?: 'country' };
export type Continent = `continent:${string}` & { __brand?: 'continent' };
export type Region = Country | Continent;

const countryOptions = countriesData.map(({ name, 'alpha-2': alpha2 }) => ({
  group: 'Country',
  label: name,
  value: `country:${alpha2}` as Country
}));

const continentOptions = continentsData.map(({ name, 'alpha-2': alpha2 }) => ({
  group: 'Continent',
  label: name,
  value: `continent:${alpha2}` as Continent
}));

const countriesInContinent = (continent: Continent): Country[] => {
  const code = continent.split(':')[1];

  return countriesData
    .filter((country) => country['continent-code'] === code)
    .map((country) => toCountry(country['alpha-2']));
};

const toCountry = (code: string): Country => {
  return `country:${code}` as Country;
};

export { countryOptions, continentOptions, countriesInContinent };

export const isRegion = (region: string): region is Region => {
  return region.startsWith('country:') || region.startsWith('continent:');
};

export const isContinent = (region: Region): region is Continent => {
  return region.startsWith('continent:');
};

export const isCountry = (region: Region): region is Country => {
  return region.startsWith('country:');
};

export const toRegion = (region: string): Region => {
  if (isRegion(region)) return region;
  throw new ApplicationError({
    code: 'BAD_REQUEST',
    message: `Invalid region: ${region}`
  });
};

export const expandCountries = (unknown: string[]) => {
  const regions = unknown.map(toRegion);
  const countries: Country[] = [];

  regions.forEach((region) => {
    if (isContinent(region)) {
      countries.push(...countriesInContinent(region));
    } else if (isCountry(region)) {
      countries.push(region);
    }
  });

  return countries;
};

export const includesCountryCode = (
  countries: Country[],
  countryCode: string | null
) => {
  if (!countryCode) return false;
  const country = toCountry(countryCode);
  return countries.includes(country);
};
