import { useState, useEffect, useCallback, useRef } from 'react';
import { getData, getPagination, safeArray } from '../api/safeResponse';
import { getActivities, getActivitySummary } from '../api/activities';
import { useFetch } from '../hooks/useFetch';
import { Events, on } from '../utils/eventBus';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

const actionLabels = {
  LOGIN_SUCCESS: 'Login',
  LOGIN_FAILED: 'Failed Login',
  REGISTER_USER: 'Register',
  CREATE_PRODUCT: 'Created Product',
  UPDATE_PRODUCT: 'Updated Product',
  DELETE_PRODUCT: 'Deleted Product',
  REMOVE_PRODUCT: 'Removed Product',
  SALE_CREATED: 'Sale Created',
  SALE_UPDATED: 'Sale Updated',
  SALE_UNDONE: 'Sale Undone',
  USER_CREATED: 'User Created',
  USER_UPDATED: 'User Updated',
  USER_DEACTIVATED: 'User Deactivated',
  USER_ACTIVATED: 'User Activated',
  DELETE_USER: 'User Deleted',
  PROFILE_UPDATED: 'Profile Updated',
  PASSWORD_CHANGED: 'Password Changed',
  PASSWORD_RESET_REQUESTED: 'Reset Requested',
  PASSWORD_RESET_COMPLETED: 'Reset Completed',
  EMAIL_CHANGED: 'Email Changed',
};

const actionOptions = [
  { value: '', label: 'All Actions' },
  ...Object.entries(actionLabels).map(([value, label]) => ({ value, label })),
];

export default function ActivityLogPage() {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);

  const { loading, error, run } = useFetch();
  const { run: runSummary } = useFetch();
  const pollRef = useRef(null);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const buildParams = useCallback((p) => ({
    page: p,
    limit: 50,
    ...(actionFilter && { action: actionFilter }),
    ...(search && { search }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  }), [actionFilter, search, startDate, endDate]);

  function fetchData(p) {
    run(async (signal) => {
      const params = { ...buildParams(p), signal };
      const res = await getActivities(params);
      setActivities(getData(res));
      setPagination(getPagination(res));
    });
  }

  function fetchSummary() {
    runSummary(async (signal) => {
      const res = await getActivitySummary(signal);
      setSummary(res.data);
    });
  }

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchData(page);
  }, [page, buildParams]);

  // Real-time polling every 10 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchData(page);
      fetchSummary();
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, [page]);

  // Listen for activity events
  useEffect(() => {
    const unsub = on(Events.ACTIVITY_UPDATED, () => { fetchData(page); fetchSummary(); });
    return unsub;
  }, [page]);

  function handleSearch() {
    setPage(1);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  function handleReset() {
    setSearch('');
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Activity Log</h2>
      </div>

      {summary && (
        <div className="insights-grid" style={{ marginBottom: '1.25rem' }}>
          <StatCard value={summary.totalActivities} label="Total Activities" />
          <StatCard value={summary.todayActivities} label="Today" />
          <StatCard value={summary.loginActivitiesToday} label="Logins Today" />
          <StatCard value={summary.salesActivitiesToday} label="Sales Today" />
        </div>
      )}

      <div className="filters-bar">
        <input
          className="filters-bar__input"
          type="text"
          placeholder="Search name, action, description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <select
          className="filters-bar__select"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          {actionOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          className="filters-bar__input filters-bar__input--date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          title="Start date"
        />
        <input
          className="filters-bar__input filters-bar__input--date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          title="End date"
        />
        <button className="btn btn--sm" onClick={handleSearch}>Search</button>
        <button className="btn btn--sm btn--danger" onClick={handleReset}>Reset</button>
      </div>

      {error && <div className="alert alert--error" style={{ marginTop: '1rem' }}>{error}</div>}

      <div className="table-wrapper" style={{ marginTop: '0.75rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Description</th>
              <th>User</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="table__empty">
                  <Skeleton width="60%" height={16} />
                </td>
              </tr>
            ) : safeArray(activities).length === 0 ? (
              <tr>
                <td colSpan={4} className="table__empty">
                  <EmptyState message="No activities recorded" />
                </td>
              </tr>
            ) : (
              safeArray(activities).map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className={`badge badge--action badge--${a.action.toLowerCase()}`}>
                      {actionLabels[a.action] || a.action}
                    </span>
                  </td>
                  <td>{a.description || '\u2014'}</td>
                  <td>{a.user?.name || 'System'}</td>
                  <td className="table__date">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn--sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="pagination__info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="btn btn--sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
