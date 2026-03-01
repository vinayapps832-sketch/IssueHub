import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    key: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/projects', form);
      toast.success('Project created!');

      setShowModal(false);
      setForm({
        name: '',
        key: '',
        description: '',
      });

      fetchProjects();
    } catch (err) {
      toast.error(
        err.response?.data?.detail || 'Failed to create project'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <h1>Projects</h1>

        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          + New Project
        </button>
      </div>

      {/* Empty State */}
      {projects.length === 0 ? (
        <div className="card">
          <p>
            No projects yet. Create your first project to get started!
          </p>
        </div>
      ) : (
        <div>
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                className="card"
                style={{ cursor: 'pointer' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>
                      {p.name}
                    </h2>
                    <span
                      className="badge"
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        marginRight: '0.5rem',
                      }}
                    >
                      {p.key}
                    </span>
                    {p.description && (
                      <span
                        style={{
                          fontSize: '0.85rem',
                          color: '#64748b',
                        }}
                      >
                        {p.description}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: '#94a3b8',
                    }}
                  >
                    {new Date(
                      p.created_at
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>New Project</h2>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="My Project"
                />
              </div>

              <div className="form-group">
                <label>Key (2–10 uppercase chars)</label>
                <input
                  required
                  value={form.key}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      key: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="PROJ"
                  maxLength={10}
                  pattern="^[A-Z0-9]+$"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="Optional description..."
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="spinner" />
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}