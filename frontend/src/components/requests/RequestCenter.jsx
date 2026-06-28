import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import * as requestsApi from '../../api/requests';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';
import styles from './RequestCenter.module.css';

const statusBadge = {
  PENDING: 'warn',
  APPROVED: 'ok',
  REJECTED: 'danger',
};

function RequestCard({ request, onApprove, onReject }) {
  const { user } = useAuth();
  const [approving, setApproving] = useState(false);
  const [rejectMsg, setRejectMsg] = useState('');
  const [showReject, setShowReject] = useState(false);

  async function handleApprove() {
    setApproving(true);
    try {
      await onApprove(request.id);
      toast.success('Request approved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    setApproving(true);
    try {
      await onReject(request.id, rejectMsg);
      toast.success('Request rejected');
      setShowReject(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setApproving(false);
    }
  }

  const isPending = request.status === 'PENDING';
  const canAct = isPending && (user?.role === 'owner' || user?.role === 'manager');

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardMeta}>
          <span className={styles.actionType}>{request.actionType}</span>
          <Badge variant={statusBadge[request.status]}>{request.status}</Badge>
        </div>
        <span className={styles.timestamp}>
          {new Date(request.createdAt).toLocaleString()}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.detail}>
          <span className={styles.detailLabel}>Requested by</span>
          <span className={styles.detailValue}>{request.requestedBy?.name}</span>
        </div>
        <div className={styles.detail}>
          <span className={styles.detailLabel}>Target</span>
          <span className={styles.detailValue}>{request.targetType} #{request.targetId}</span>
        </div>
        <div className={styles.detail}>
          <span className={styles.detailLabel}>Changes</span>
          <pre className={styles.payload}>{JSON.stringify(request.payload, null, 2)}</pre>
        </div>
        {request.reviewedBy && (
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Reviewed by</span>
            <span className={styles.detailValue}>{request.reviewedBy.name}</span>
          </div>
        )}
        {request.message && (
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Message</span>
            <span className={styles.detailValue}>{request.message}</span>
          </div>
        )}
      </div>

      {canAct && (
        <div className={styles.cardActions}>
          <Button size="sm" onClick={handleApprove} loading={approving}>
            Approve
          </Button>
          <Button size="sm" variant="danger" onClick={() => setShowReject(true)}>
            Reject
          </Button>
        </div>
      )}

      {showReject && (
        <div className={styles.rejectForm}>
          <textarea
            className={styles.rejectInput}
            placeholder="Reason for rejection (optional)"
            value={rejectMsg}
            onChange={(e) => setRejectMsg(e.target.value)}
            rows={2}
          />
          <div className={styles.rejectActions}>
            <Button size="sm" variant="danger" onClick={handleReject} loading={approving}>
              Confirm Reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RequestCenter() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING');

  const fetchRequests = useCallback(async (signal) => {
    setLoading(true);
    try {
      const params = tab === 'ALL' ? {} : { status: tab };
      const res = await requestsApi.getRequests(params, signal);
      setRequests(res.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchRequests(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchRequests]);

  async function handleApprove(id) {
    await requestsApi.approveRequest(id);
    fetchRequests();
  }

  async function handleReject(id, message) {
    await requestsApi.rejectRequest(id, message);
    fetchRequests();
  }

  const tabs = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];

  return (
    <div>
      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          <Skeleton width="100%" height={120} count={3} />
        </div>
      ) : requests.length === 0 ? (
        <div className={styles.empty}>
          <p>No {tab === 'PENDING' ? 'pending' : tab.toLowerCase()} requests</p>
        </div>
      ) : (
        <div className={styles.list}>
          {requests.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
