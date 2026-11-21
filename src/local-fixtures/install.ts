// TCW-5: engancha la API simulada en memoria a una instancia de axios. Sin service worker ni red.
import type { AxiosInstance } from 'axios';
import { createAdapter } from './adapter';
import { createFixtureState } from './data';

export const installLocalFixtures = (api: AxiosInstance): void => {
  api.defaults.adapter = createAdapter(createFixtureState());
};
