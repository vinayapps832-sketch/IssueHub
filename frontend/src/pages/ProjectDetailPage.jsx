import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [issues, setIssues] = useState({
    items: [],
    total: 0,
    page: 1,
    per_page: 20,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Modals
  const [showNewIssue, setShowNewIssue] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee_id: '',
  });
  const [memberForm, setMemberForm] = useState({
    email: '',
    role: 'member',
  });
  const [submitting, setSubmitting] = useState(false);

  const myRole = members.find((m) => m.user?.id === user?.id)?.role;

  const fetchIssues = useCallback(async () => {
    try {
      const params = { page, per_page: 20, sort, order };
      if (q) params.q = q;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (assignee) params.assignee = assignee;

      const { data } = await api.get(
        `/projects/${projectId}/issues`,
        { params }
      );
      setIssues(data);
    } catch {
      toast.error('Failed to load issues');
    }
  }, [projectId, q, status, priority, assignee, sort, order, page]);

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, memRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/members`),
        ]);

        setProject(projRes.data);
        setMembers(memRes.data);
      } catch {
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId]);

  useEffect(() => {
    if (!loading) fetchIssues();
  }, [fetchIssues, loading]);

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = { ...issueForm };
      if (!payload.assignee_id) delete payload.assignee_id;
      else payload.assignee_id = Number(payload.assignee_id);

      await api.post(`/projects/${projectId}/issues`, payload);

      toast.success('Issue created');
      setShowNewIssue(false);
      setIssueForm({
        title: '',
        description: '',
        priority: 'medium',
        assignee_id: '',
      });
      fetchIssues();
    } catch (err) {
      toast.error(
        err.response?.data?.detail || 'Failed to create issue'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post(
        `/projects/${projectId}/members`,
        memberForm
      );
      toast.success('Member added');
      setShowAddMember(false);
      setMemberForm({ email: '', role: 'member' });

      const { data } = await api.get(
        `/projects/${projectId}/members`
      );
      setMembers(data);
    } catch (err) {
      toast.error(
        err.response?.data?.detail || 'Failed to add member'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(
    issues.total / issues.per_page
  );

  if (loading)
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );

  if (!project)
    return <div className="card">Project not found.</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/"
          style={{ fontSize: '0.85rem' }}
        >
          &larr; All Projects
        </Link>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem',
          }}
        >
          <div>
            <h1>{project.name}</h1>
            <span className="badge">
              {project.key}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {myRole === 'maintainer' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddMember(true)}
              >
                + Member
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowNewIssue(true)}
            >
              + New Issue
            </button>
          </div>
        </div>
      </div>

      {/* Issues List + Filters */}
      <div className="card">
        <div className="filter-bar">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search issues by title or description..."
            className="filter-input"
          />

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.filter(Boolean).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={assignee}
            onChange={(e) => { setAssignee(e.target.value); setPage(1); }}
          >
            <option value="">All Assignees</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setOrder(order === 'desc' ? 'asc' : 'desc'); setPage(1); }}
            title="Toggle sort order"
          >
            {order === 'desc' ? 'Newest' : 'Oldest'}
          </button>
        </div>

        {issues.items.length === 0 ? (
          <p style={{ padding: '1.5rem' }}>
            No issues found.
          </p>
        ) : (
          <ul className="issue-list">
            {issues.items.map((issue) => (
              <li
                key={issue.id}
                className="issue-item"
              >
                <Link
                  to={`/issues/${issue.id}`}
                  className="issue-title"
                >
                  {issue.title}
                </Link>

                <div className="issue-meta">
                  <span
                    className={`badge badge-${issue.status}`}
                  >
                    {issue.status.replace('_', ' ')}
                  </span>
                  <span
                    className={`badge badge-${issue.priority}`}
                  >
                    {issue.priority}
                  </span>
                  {issue.assignee && (
                    <span>
                      {issue.assignee.name}
                    </span>
                  )}
                  <span>
                    {new Date(
                      issue.created_at
                    ).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            &laquo; Prev
          </button>

          {Array.from(
            { length: totalPages },
            (_, i) => (
              <button
                key={i + 1}
                className={
                  page === i + 1
                    ? 'active'
                    : ''
                }
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            )
          )}

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next &raquo;
          </button>
        </div>
      )}

      {/* Modals */}
      {showNewIssue && (
        <div className="modal-backdrop" onClick={() => setShowNewIssue(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Issue</h3>
            <form onSubmit={handleCreateIssue}>
              <label>Title</label>
              <input
                value={issueForm.title}
                onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                required
              />

              <label>Description</label>
              <textarea
                value={issueForm.description}
                onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
              />

              <label>Priority</label>
              <select
                value={issueForm.priority}
                onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
              >
                {PRIORITIES.filter(Boolean).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <label>Assignee</label>
              <select
                value={issueForm.assignee_id}
                onChange={(e) => setIssueForm({ ...issueForm, assignee_id: e.target.value })}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create'}
                </button>
                <button type="button" className="btn" onClick={() => setShowNewIssue(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMember && (
        <div className="modal-backdrop" onClick={() => setShowAddMember(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Member</h3>
            <form onSubmit={handleAddMember}>
              <label>Email</label>
              <input
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                required
              />

              <label>Role</label>
              <select
                value={memberForm.role}
                onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
              >
                <option value="member">member</option>
                <option value="maintainer">maintainer</option>
              </select>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding…' : 'Add'}
                </button>
                <button type="button" className="btn" onClick={() => setShowAddMember(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}