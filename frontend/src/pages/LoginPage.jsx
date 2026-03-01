import { useState} from "react";
import {Link, Navigate} from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import toast from 'react-hot-toast';

export default function LoginPage() {
    const {user, login} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        return <Navigate to="/" />;
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        }finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
            <h1>Sign In</h1>
            <p className="subtitle">Welcome back to IssueHub</p>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                <label>Email</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                />
                </div>

                <div className="form-group">
                <label>Password</label>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                />
                </div>

                <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={submitting}
                >
                {submitting ? <span className="spinner" /> : 'Sign In'}
                </button>
            </form>

            <div className="auth-footer">
                Don’t have an account? <Link to="/signup">Sign Up</Link>
            </div>
        </div>
    </div>
    );
}
