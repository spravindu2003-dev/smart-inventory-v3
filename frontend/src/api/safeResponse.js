export function getData(res) {
  return res?.data?.data ||
         res?.data?.activities ||
         res?.data?.products ||
         res?.data?.sales ||
         [];
}

export function getPagination(res) {
  return res?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}
