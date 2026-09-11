import 'react';

/**
 * React 18 does not know the `fetchpriority` image attribute — camelCase
 * `fetchPriority` support only arrived in React 19, and passing it here logs
 * "React does not recognize the fetchPriority prop on a DOM element".
 *
 * The attribute itself is real and useful: it tells the browser to fetch the
 * hero photo ahead of the below-the-fold ones. Declaring the lowercase DOM
 * spelling lets us pass it the way React 18 forwards without complaint.
 *
 * Remove this file when the project moves to React 19 and switch the call site
 * back to `fetchPriority`.
 */
declare module 'react' {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}
