import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function IssueDetailPage() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRole, setMyRole] = useState(null);

  const fetchIssue = async () => {
    try {
      const { data } = await api.get(`/issues/${issueId}`);
      setIssue(data);
      return data;
    } catch {
      toast.error('Issue not found');
      navigate('/');
    }
  };

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/issues/${issueId}/comments`);
      setComments(data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    const load = async () => {
      const issueData = await fetchIssue();
      if (issueData) {
        await fetchComments();
        try {
          const { data: mems } = await api.get(
            `/projects/${issueData.project_id}/members`
          );
          setMembers(mems);
          const me = mems.find((m) => m.user?.id === user?.id);
          setMyRole(me?.role || null);
        } catch {
          // silent
        }
      }
      setLoading(false);
    };

    load();
  }, [issueId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;

    setSubmitting(true);
    try {
      await api.post(`/issues/${issueId}/comments`, {
        body: commentBody,
      });
      setCommentBody('');
      fetchComments();
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const { data } = await api.patch(`/issues/${issueId}`, {
        status: newStatus,
      });
      setIssue(data);
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAssigneeChange = async (newAssigneeId) => {
    try {
      const { data } = await api.patch(`/issues/${issueId}`, {
        assignee_id: newAssigneeId ? Number(newAssigneeId) : null,
      });
      setIssue(data);
      toast.success('Assignee updated');
    } catch {
      toast.error('Failed to update assignee');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this issue? This cannot be undone.')) return;

    try {
      await api.delete(`/issues/${issueId}`);
      toast.success('Issue deleted');
      navigate(-1);
    } catch {
      toast.error('Failed to delete issue');
    }
  };

  if (loading)
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );

  if (!issue) return null;

  const isMaintainer = myRole === 'maintainer';
  const isReporter = issue.reporter?.id === user?.id;
  const canEdit = isMaintainer || isReporter;

  return (
    <div>
      <Link
        to={`/projects/${issue.project_id}`}
        style={{ fontSize: '0.85rem' }}
      >
        &larr; Back to issues
      </Link>

      {/* Issue Header */}
      <div className="card" style={{ marginTop: '0.75rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <h1 style={{ fontSize: '1.4rem' }}>{issue.title}</h1>
          {canEdit && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            margin: '0.75rem 0',
          }}
        >
          <span className={`badge badge-${issue.status}`}>
            {issue.status.replace('_', ' ')}
          </span>
          <span className={`badge badge-${issue.priority}`}>
            {issue.priority}
          </span>
        </div>

        {issue.description && (
          <p
            style={{
              margin: '0.75rem 0',
              color: '#334155',
              whiteSpace: 'pre-wrap',
            }}
          >
            {issue.description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: '#64748b',
            marginTop: '1rem',
          }}
        >
          <div>
            <strong>Reporter:</strong> {issue.reporter?.name}
          </div>
          <div>
            <strong>Assignee:</strong>{' '}
            {issue.assignee?.name || 'Unassigned'}
          </div>
          <div>
            <strong>Created:</strong>{' '}
            {new Date(issue.created_at).toLocaleString()}
          </div>
          <div>
            <strong>Updated:</strong>{' '}
            {new Date(issue.updated_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Maintainer Controls */}
      {isMaintainer && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            Maintainer Controls
          </h3>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div className="form-group" style={{ minWidth: '180px' }}>
              <label>Status</label>
              <select
                value={issue.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value)
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: '180px' }}>
              <label>Assignee</label>
              <select
                value={issue.assignee?.id || ''}
                onChange={(e) =>
                  handleAssigneeChange(e.target.value)
                }
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
          Comments ({comments.length})
        </h3>

        {comments.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            No comments yet. Start the conversation!
          </p>
        )}

        {comments.map((c) => (
          <div key={c.id} className="comment">
            <div className="comment-header">
              <span className="comment-author">
                {c.author?.name}
              </span>
              <span className="comment-date">
                {new Date(c.created_at).toLocaleString()}
              </span>
            </div>
            <div className="comment-body">{c.body}</div>
          </div>
        ))}

        <form
          onSubmit={handleAddComment}
          style={{ marginTop: '1rem' }}
        >
          <div className="form-group">
            <textarea
              rows={3}
              value={commentBody}
              onChange={(e) =>
                setCommentBody(e.target.value)
              }
              placeholder="Add a comment..."
              required
            />
          </div>

          <button
            className="btn btn-primary btn-sm"
            disabled={submitting}
          >
            {submitting ? (
              <span className="spinner" />
            ) : (
              'Post Comment'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
