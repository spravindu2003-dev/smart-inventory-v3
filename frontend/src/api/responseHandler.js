export function getData(response) {
  if (response?.data && Array.isArray(response.data)) return response.data;
  if (Array.isArray(response?.activities)) return response.activities;
  if (Array.isArray(response?.products)) return response.products;
  if (Array.isArray(response?.sales)) return response.sales;
  return [];
}

export function getPagination(response) {
  return response?.pagination || {};
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}
