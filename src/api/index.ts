/**
 * Api — typed API client surface.
 *
 * Usage:
 *   import { Api } from '@/api';
 *
 * Resource modules live in ./Api/<resource>/<resource>.ts and are written by
 * hand today; the layout matches Orval output so a generated client can drop in
 * unchanged once an OpenAPI spec exists.
 */
export * as Api from "./Api";
