/** Legge site e base da astro.config.mjs (unica fonte) per gli strumenti Node. */
import config from '../astro.config.mjs';

export const SITE = config.site;
export const BASE = `${config.base ?? ''}/`.replace(/\/+$/, '/').replace(/^(?!\/)/, '/');
