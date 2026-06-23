export default function EmptyState({ icon = '\u2139\uFE0F', message = 'No data available', children }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <p className="empty-state__message">{message}</p>
      {children}
    </div>
  );
}
