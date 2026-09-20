import { yali } from './yali.js';

export const BRANDS = { yali };
export const getBrand = (id) => BRANDS[id] || null;
