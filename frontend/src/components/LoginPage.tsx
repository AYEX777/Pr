import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Shield, Mail, Lock, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import ocpLogo from 'figma:asset/552359b3b863782cc2ece06d4ed88f723b463399.png';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLogin: (...args: any[]) => Promise<void> | void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Email validation
  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return 'L\'adresse email est requise';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Format d\'email invalide';
    }
    return undefined;
  };

  // Password validation (relaxed for mock mode)
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Le mot de passe est requis';
    }
    // Removed minimum length requirement for mock mode
    if (password.length > 128) {
      return 'Le mot de passe est trop long';
    }
    return undefined;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    // Clear password error when user starts typing
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    // Attempt login
    setIsLoading(true);
    try {
      await onLogin(email.trim().toLowerCase(), password);
    } catch (error: any) {
      // Handle login errors
      const errorMessage = error?.message || 'Erreur de connexion. Veuillez réessayer.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Visual Section */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#00843D] via-[#006B32] to-[#005A29] relative overflow-hidden"
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1619253861799-039aa3201fae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwZmFjdG9yeSUyMGdyZWVuJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjI1NTIwNzF8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Industrial Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#00843D]/90 via-[#006B32]/90 to-[#005A29]/90"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo & Branding */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <motion.img 
                src={ocpLogo} 
                alt="OCP Logo" 
                className="w-20 h-20 object-contain"
                style={{ 
                  filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5)) drop-shadow(0 6px 15px rgba(0, 0, 0, 0.3)) drop-shadow(0 3px 8px rgba(255, 255, 255, 0.1))'
                }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <h1 className="tracking-tight" style={{ fontSize: '28px', fontWeight: '700' }}>
                  Groupe OCP
                </h1>
                <p className="opacity-90" style={{ fontSize: '14px' }}>
                  Leader mondial du phosphate
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            className="space-y-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div>
              <h2 className="mb-4" style={{ fontSize: '42px', fontWeight: '700', lineHeight: '1.1' }}>
                Plateforme PRISK
              </h2>
              <p className="opacity-90 max-w-md" style={{ fontSize: '18px', lineHeight: '1.6' }}>
                Système de monitoring industriel en temps réel pour la gestion des risques et la supervision des compensateurs.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { text: 'Monitoring temps réel des capteurs', delay: 0.7 },
                { text: 'Alertes intelligentes et prédictives', delay: 0.8 },
                { text: 'Historique complet des interventions', delay: 0.9 }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: feature.delay, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span style={{ fontSize: '16px' }}>{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div 
            className="opacity-75" 
            style={{ fontSize: '13px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <p>© 2024 Groupe OCP. Tous droits réservés.</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-[#0c0c0c]"
      >
        <style>{`
          .dark .login-connexion-title {
            color: rgb(255, 255, 255) !important;
          }
          .dark .login-form-container button[type="submit"],
          .dark .login-form-container button[type="submit"] span,
          .dark .login-form-container button[type="submit"] *,
          .dark .login-form-container [data-slot="button"],
          .dark .login-form-container [data-slot="button"] span,
          .dark .login-form-container [data-slot="button"] * {
            color: rgb(255, 255, 255) !important;
          }
          .dark .login-form-container .text-gray-900 {
            color: rgb(255, 255, 255) !important;
          }
          .dark .login-form-container .text-gray-700 {
            color: rgb(244, 244, 245) !important;
          }
          .dark .login-form-container .text-gray-600 {
            color: rgb(212, 212, 216) !important;
          }
          .dark .login-form-container .text-gray-500 {
            color: rgb(161, 161, 170) !important;
          }
          .dark .login-form-container label {
            color: rgb(244, 244, 245) !important;
          }
          .dark .login-form-container .bg-zinc-900 {
            background-color: rgb(24, 24, 27) !important;
            border-color: rgb(63, 63, 70) !important;
          }
          .dark .login-form-container .bg-zinc-900 p,
          .dark .login-form-container .bg-zinc-900 div p,
          .dark .login-form-container .bg-zinc-900 span:not([style*="rgb(34"]) {
            color: rgb(255, 255, 255) !important;
          }
          .dark .login-form-container .bg-zinc-900 svg {
            color: rgb(255, 255, 255) !important;
          }
          .dark .login-form-container .bg-zinc-900 span[style*="rgb(34"] {
            color: rgb(34, 197, 94) !important;
          }
          .dark .login-form-container .security-title,
          .dark .login-form-container .security-title * {
            color: rgb(255, 255, 255) !important;
          }
          .dark .login-form-container p.security-title {
            color: rgb(255, 255, 255) !important;
          }
        `}</style>
        <div className="w-full max-w-md login-form-container">
          {/* Mobile Logo */}
          <motion.div 
            className="lg:hidden flex justify-center mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.img 
              src={ocpLogo} 
              alt="OCP Logo" 
              className="w-24 h-24 object-contain"
              style={{ 
                filter: 'drop-shadow(0 10px 25px rgba(0, 132, 61, 0.5)) drop-shadow(0 6px 15px rgba(0, 132, 61, 0.3)) drop-shadow(0 3px 8px rgba(0, 0, 0, 0.1))' 
              }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          </motion.div>

          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 
              className="mb-2 text-gray-900 dark:text-white login-connexion-title" 
              style={{ 
                fontSize: '32px', 
                fontWeight: '700'
              }}
            >
              Connexion
            </h2>
            <p className="text-gray-600 dark:text-zinc-400" style={{ fontSize: '15px' }}>
              Accédez à votre tableau de bord PRISK
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {/* General Error Message */}
            {errors.general && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{errors.general}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-zinc-300" style={{ fontSize: '14px', fontWeight: '600' }}>
                Adresse email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500 transition-colors group-focus-within:text-[#00843D] dark:group-focus-within:text-green-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="operateur@ocp.ma"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  disabled={isLoading}
                  className={`pl-10 h-12 bg-gray-50 dark:bg-zinc-900 border transition-all rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 ${
                    errors.email 
                      ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-gray-300 dark:border-zinc-700 focus:border-[#00843D] focus:ring-2 focus:ring-[#00843D]/20'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ fontSize: '15px' }}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-zinc-300" style={{ fontSize: '14px', fontWeight: '600' }}>
                Mot de passe
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500 transition-colors group-focus-within:text-[#00843D] dark:group-focus-within:text-green-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  disabled={isLoading}
                  className={`pl-10 h-12 bg-gray-50 dark:bg-zinc-900 border transition-all rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 ${
                    errors.password 
                      ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-gray-300 dark:border-zinc-700 focus:border-[#00843D] focus:ring-2 focus:ring-[#00843D]/20'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ fontSize: '15px' }}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#00843D] focus:ring-[#00843D] focus:ring-offset-0 cursor-pointer transition-all"
                />
                <span className="text-gray-700 dark:text-zinc-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" style={{ fontSize: '14px' }}>
                  Se souvenir de moi
                </span>
              </label>
              <button
                type="button"
                className="text-[#00843D] hover:text-[#006B32] transition-colors hover:underline"
                style={{ fontSize: '14px', fontWeight: '500' }}
                onClick={() => alert('Contactez votre administrateur système')}
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Submit Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-12 bg-gradient-to-r from-[#00843D] to-[#006B32] hover:from-[#006B32] hover:to-[#005A29] text-white dark:text-white shadow-md hover:shadow-lg transition-all rounded-lg group ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ fontSize: '15px', fontWeight: '600', color: 'rgb(255, 255, 255)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.form>

          {/* Divider */}
          <motion.div 
            className="relative my-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white dark:bg-[#0c0c0c] text-gray-500 dark:text-zinc-400" style={{ fontSize: '13px' }}>
                Système sécurisé
              </span>
            </div>
          </motion.div>

          {/* Security Info */}
          <motion.div 
            className="bg-green-50 dark:bg-zinc-900 border border-green-200 dark:border-zinc-600 rounded-lg p-4 hover:shadow-md transition-shadow"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            style={{
              backgroundColor: 'var(--tw-bg-green-50)'
            }}
          >
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#00843D] dark:text-white flex-shrink-0 mt-0.5" style={{ color: 'rgb(34, 197, 94)' }} />
              <div>
                <p 
                  className="mb-1 security-title text-gray-900 dark:text-white" 
                  style={{ 
                    fontSize: '14px', 
                    fontWeight: '600'
                  }}
                >
                  Connexion sécurisée
                </p>
                <p 
                  style={{ 
                    fontSize: '13px', 
                    lineHeight: '1.5',
                    color: 'rgb(75, 85, 99)'
                  }}
                >
                  Vos données sont protégées par un chiffrement de bout en bout. 
                  Pour toute assistance, contactez <span className="font-medium" style={{ color: 'rgb(34, 197, 94)' }}>support@ocp.ma</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Version Info */}
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <p className="text-gray-500 dark:text-zinc-400" style={{ fontSize: '13px' }}>
              Version 1.0.0 • <span className="inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#00843D] dark:bg-green-400 rounded-full animate-pulse-subtle"></span>
                Système opérationnel
              </span>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}