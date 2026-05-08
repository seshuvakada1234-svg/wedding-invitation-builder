/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const calculateFreeViews = (price: number) => {
  if (price >= 9999) return 10000;
  if (price >= 4999) return 5000;
  if (price >= 1999) return 2000;
  if (price >= 1499) return 1500;
  if (price >= 999) return 1000;
  return 500;
};
