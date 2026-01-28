
import React, { useState } from 'react';
import { Button, Input, Card } from './UI';
import { storage } from '../utils/storage';
import { User } from '../types';
import { ArrowLeft, Lock } from 'lucide-react';

interface LoginProps {
  onBack: () => void;
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onBack, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanEmail = email.trim().toLowerCase();
    const keys = await storage.list('user:');
    let foundUser: User | null = null;
    
    for (const key of keys) {
      const user = await storage.get(key);
      if (user && user.email.toLowerCase() === cleanEmail) {
        foundUser = user;
        break;
      }
    }

    if (foundUser && foundUser.password === password) {
      await storage.set('currentUser', foundUser);
      onLogin(foundUser);
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back</span>
        </button>
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-gray-500">Log in to manage your cleanings</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input 
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            required
          />
          
          {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}
          
          <div className="text-right">
            <button type="button" className="text-xs text-purple-600 font-bold hover:underline">
              Forgot Password? Contact Admin
            </button>
          </div>

          <Button type="submit" className="w-full mt-2">
            Login
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;
