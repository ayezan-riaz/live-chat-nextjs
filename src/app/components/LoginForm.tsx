
'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { userApi } from '../services/api';
import { useChat } from '../context/ChatContext';
import { User, MessageCircle, Phone } from 'lucide-react';

interface LoginFormData {
  phoneNumber: string;
  name: string;
}

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setCurrentUser } = useChat();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login - get existing user
        const response:any = await userApi.getUserByPhone(data.phoneNumber);
        setCurrentUser(response.data );
        onLoginSuccess();
      } else {
        // Register - create new user
        const response:any = await userApi.createUser(data);
        setCurrentUser(response.data);
        onLoginSuccess();
      }
    } catch (err: any) {
      if (err.response?.status === 404 && isLogin) {
        setError('User not found. Please register first.');
      } else if (err.response?.status === 409) {
        setError('User already exists. Please login.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-whatsapp-bg">
      <div className="bg-whatsapp-sidebar p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold text-white">Live Chat</h1>
          <p className="text-gray-400 mt-2">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                {...register('phoneNumber', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^\+?[1-9]\d{1,14}$/,
                    message: 'Invalid phone number format'
                  }
                })}
                className="w-full pl-10 pr-4 py-3 bg-whatsapp-input border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                placeholder="+1234567890"
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-red-400 text-sm mt-1">{errors.phoneNumber.message}</p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  {...register('name', {
                    required: !isLogin ? 'Name is required' : false,
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-whatsapp-input border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  placeholder="Enter your name"
                />
              </div>
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={toggleMode}
            className="text-green-400 hover:text-green-300 text-sm"
          >
            {isLogin 
              ? "Don't have an account? Register here" 
              : "Already have an account? Login here"
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;