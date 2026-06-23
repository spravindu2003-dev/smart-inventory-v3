const bus = new EventTarget();

const Events = {
  PRODUCT_UPDATED: 'product_updated',
  SALE_UPDATED: 'sale_updated',
  ACTIVITY_UPDATED: 'activity_updated',
  DASHBOARD_REFRESH: 'dashboard_refresh',
};

function emit(event, detail) {
  bus.dispatchEvent(new CustomEvent(event, { detail }));
}

function on(event, handler) {
  bus.addEventListener(event, handler);
  return () => bus.removeEventListener(event, handler);
}

export { bus, Events, emit, on };
export default { bus, Events, emit, on };
