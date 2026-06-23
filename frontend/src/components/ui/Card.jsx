export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={`card${padding ? '' : ' card--no-pad'} ${className}`}>
      {children}
    </div>
  );
}
