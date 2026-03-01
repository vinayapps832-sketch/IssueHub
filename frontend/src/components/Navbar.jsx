import {Link} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';

export default function Navbar() {
    const {user, logout} = useAuth();
    return (
        <nav className="navbar">
            <Link to="/" className="brand">IssueHub</Link>
            <div className="nav-right">
                <span>{user?.name}</span>
                <button onClick={logout} className="btn-logout">Logout</button>
            </div>
        </nav>
    );
}
