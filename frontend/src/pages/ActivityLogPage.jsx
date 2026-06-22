import { useState, useEffect, useCallback } from 'react';
import { getActivities } from '../api/activities';

const actionLabels = {
  LOGIN_SUCCESS: 'Login',
  LOGIN_FAILED: 'Failed Login',
  REGISTER_USER: 'Register',
  CREATE_PRODUCT: 'Created Product',
  UPDATE_PRODUCT: 'Updated Product',
  DELETE_PRODUCT: 'Deleted Product',
  REMOVE_PRODUCT: 'Removed Product',
};

export default function ActivityLogPage() {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch = useCallback(async (p) => {
    setLoading(true);
    setError('');
    try {
      const data = await getActivities(p, 50);
      setActivities(data.activities);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(page); }, [fetch, page]);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Activity Log</h2>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="table-wrapper">
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
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : activities.length === 0 ? (
              <tr>
                <td colSpan={4} className="table__empty">No activities recorded</td>
              </tr>
            ) : (
              activities.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className={`badge badge--action badge--${a.action.toLowerCase()}`}>
                      {actionLabels[a.action] || a.action}
                    </span>
                  </td>
                  <td>{a.description || '\u2014'}</td>
                  <td>{a.user?.username || 'System'}</td>
                  <td className="table__date">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn--sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="pagination__info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="btn btn--sm"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
