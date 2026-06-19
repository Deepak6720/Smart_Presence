import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      if (!token) {
        navigate('/login?error=true');
        return;
      }
      
      try {
        const data = await authService.getMe(token);
        login(data.user, token);
        if (data.user.role === 'admin') navigate('/admin');
        else if (data.user.role === 'teacher') navigate('/teacher');
        else navigate('/student');
        
      } catch (error) {
        navigate('/login?error=true');
      }
    };
    
    handleCallback();
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Completing login...</p>
      </div>
    </div>
  );
};

export default AuthCallback;