import { Link } from 'react-router-dom';

export default function AuthLayout({ title, subtitle, children, backTo, backLabel }) {
  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg__glow auth-bg__glow--1" />
        <div className="auth-bg__glow auth-bg__glow--2" />
      </div>

      <div className="auth-container">
        <Link to="/" className="auth-brand">
          <span className="auth-brand__icon">{'\u25C8'}</span>
          <span className="auth-brand__title">Smart Inventory</span>
        </Link>

        <div className="auth-card">
          <div className="auth-card__header">
            <h1 className="auth-card__title">{title}</h1>
            {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
          </div>
          {children}
        </div>

        {backTo && backLabel && (
          <div className="auth-back">
            <Link to={backTo}>{backLabel}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
