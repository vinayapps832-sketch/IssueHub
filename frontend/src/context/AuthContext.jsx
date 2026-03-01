import { createContext,useContext,useState,useEffect} from 'react';
import api from '../api'

const AuthContext = createContext(null);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const {data}=await api.get('/auth/me');
            setUser(data);
        } catch (error) {
            setUser(null);
            localStorage.removeItem('token');
        }finally{
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
        fetchUser();}
        else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
            const {data} = await api.post('/auth/login', {email, password});
            localStorage.setItem('token', data.access_token);
            await fetchUser();
        };

    const signup = async (name, email, password) => {
            await api.post('/auth/signup', {name, email, password});
            await login(email, password);
        }; 
        
        
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{user, loading, login, signup, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
}
