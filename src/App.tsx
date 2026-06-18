import React, { useState, useEffect } from 'react'
import { 
  isFirebaseConfigured,
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot
} from './firebase'
import type { User } from './firebase'
import { 
  Building2, 
  Hammer, 
  Home, 
  MessagesSquare, 
  ClipboardList, 
  Wrench, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  ArrowLeft,
  Menu, 
  X, 
  Star,
  Zap,
  ShieldCheck,
  Search,
  Lock,
  LogOut,
  DollarSign,
  AlertCircle,
  TrendingUp,
  FileText,
  CheckSquare
} from 'lucide-react'

// TYPES DEFINITIONS
interface FAQItemProps {
  question: string;
  answer: string;
}

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface PackageCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
}

interface TenantTicket {
  id: number;
  title: string;
  category: string;
  status: 'resolved' | 'scheduled' | 'pending';
  date: string;
}

interface BuilderDoc {
  name: string;
  size: string;
  date: string;
}

export default function App() {
  // Hash Routing State
  const [hash, setHash] = useState(window.location.hash);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
      // Scroll to top when changing views
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Landing Page Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'pm' | 'landlord'>('builder');
  
  // Lead Form State
  const [submittedForm, setSubmittedForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    businessType: 'builder',
    phone: '',
    city: '',
    details: ''
  });

  // Login & Portal States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loginRole, setLoginRole] = useState<'tenant' | 'builder' | 'manager'>('tenant');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Dashboard Interactive States
  // 1. Tenant Tickets
  const [tenantTickets, setTenantTickets] = useState<TenantTicket[]>([]);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Plumbing');

  // 2. Builder Documents
  const [builderDocs, setBuilderDocs] = useState<BuilderDoc[]>([]);
  const [newDocName, setNewDocName] = useState('');

  // 3. Manager counts
  const [totalTicketsCount, setTotalTicketsCount] = useState(0);
  const [scheduledTicketsCount, setScheduledTicketsCount] = useState(0);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthorized(true);
        // Fetch role from Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setLoginRole(userSnap.data().role);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
      } else {
        setCurrentUser(null);
        setIsAuthorized(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Tenant Tickets
  useEffect(() => {
    if (!currentUser || loginRole !== 'tenant') return;
    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tickets: TenantTicket[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tickets.push({
          id: data.id || doc.id,
          title: data.title,
          category: data.category,
          status: data.status,
          date: data.date
        });
      });
      tickets.sort((a, b) => b.id - a.id);
      setTenantTickets(tickets);
    }, (error) => {
      console.error("Error listening to tickets:", error);
    });
    return () => unsubscribe();
  }, [currentUser, loginRole]);

  // Listen to Builder Documents
  useEffect(() => {
    if (!currentUser || loginRole !== 'builder') return;
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: BuilderDoc[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({
          name: data.name,
          size: data.size,
          date: data.date
        });
      });
      setBuilderDocs(docs);
    }, (error) => {
      console.error("Error listening to documents:", error);
    });
    return () => unsubscribe();
  }, [currentUser, loginRole]);

  // Listen to Manager stats
  useEffect(() => {
    if (!currentUser || loginRole !== 'manager') return;
    const q = query(collection(db, 'tickets'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTotalTicketsCount(snapshot.size);
      let scheduled = 0;
      snapshot.forEach((doc) => {
        if (doc.data().status === 'scheduled') {
          scheduled++;
        }
      });
      setScheduledTicketsCount(scheduled);
    }, (error) => {
      console.error("Error listening to all tickets:", error);
    });
    return () => unsubscribe();
  }, [currentUser, loginRole]);

  // Auto-redirect if trying to access portal without login
  useEffect(() => {
    if (authLoading) return;
    if (window.location.hash === '#/portal' && !isAuthorized) {
      window.location.hash = '#/login';
    }
  }, [hash, isAuthorized, authLoading]);

  // Lead Form Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted Lead Form:", formData);
    setSubmittedForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      businessName: '',
      businessType: 'builder',
      phone: '',
      city: '',
      details: ''
    });
    setSubmittedForm(false);
  };

  // Login Form Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      if (isSignUpMode) {
        // Sign Up Flow
        const cred = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: loginEmail,
          role: loginRole
        });
      } else {
        // Sign In Flow
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      }
      window.location.hash = '#/portal';
    } catch (error: any) {
      console.error("Authentication error: ", error);
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already in use. Try signing in instead.';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      }
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setLoginError('');
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email || '',
          role: loginRole
        });
      } else {
        setLoginRole(userSnap.data().role);
      }
      window.location.hash = '#/portal';
    } catch (error: any) {
      console.error("Google Sign-In error: ", error);
      let message = error.message;
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Login popup closed. Please try again.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Google sign-in is not enabled. Please enable it in your Firebase console under Auth -> Sign-in methods.';
      }
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Demo Login Bypass
  const triggerDemoLogin = async (role: 'tenant' | 'builder' | 'manager') => {
    const email = `${role}@propstudio.demo`;
    const password = 'demo1234';
    setIsLoggingIn(true);
    setLoginError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthorized(true);
      window.location.hash = '#/portal';
    } catch (error: any) {
      // Auto-register demo account if not found
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/code-expired') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', cred.user.uid), {
            email: email,
            role: role
          });
          setIsAuthorized(true);
          window.location.hash = '#/portal';
        } catch (signUpError: any) {
          console.error("Demo signup error: ", signUpError);
          // Try signin one more time in case it was a race condition or already exists
          try {
            await signInWithEmailAndPassword(auth, email, password);
            setIsAuthorized(true);
            window.location.hash = '#/portal';
          } catch (retryError: any) {
            setLoginError(`Demo Login failed: ${signUpError.message}`);
          }
        }
      } else {
        // Try creating account anyway to handle random failure
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', cred.user.uid), {
            email: email,
            role: role
          });
          setIsAuthorized(true);
          window.location.hash = '#/portal';
        } catch (anyError) {
          setLoginError(`Demo Login failed: ${error.message}`);
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.hash = '#/';
      setLoginEmail('');
      setLoginPassword('');
      setLoginError('');
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Tenant Ticket Add Handler
  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTicketTitle.trim() === '' || !currentUser) return;

    try {
      const ticketData = {
        id: Date.now(),
        title: newTicketTitle,
        category: newTicketCategory,
        status: 'pending',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
        userId: currentUser.uid,
        userEmail: currentUser.email || ''
      };

      await addDoc(collection(db, 'tickets'), ticketData);
      setNewTicketTitle('');
    } catch (error) {
      console.error("Error adding ticket: ", error);
      alert("Failed to submit ticket. Please try again.");
    }
  };

  // Builder Document Add Handler
  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDocName.trim() === '' || !currentUser) return;

    try {
      const docName = newDocName.endsWith('.pdf') ? newDocName : `${newDocName}.pdf`;
      const docData = {
        name: docName,
        size: `${(Math.random() * 8 + 1).toFixed(1)} MB`,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
        userId: currentUser.uid,
        userEmail: currentUser.email || ''
      };

      await addDoc(collection(db, 'documents'), docData);
      setNewDocName('');
    } catch (error) {
      console.error("Error adding doc: ", error);
      alert("Failed to add document metadata. Please try again.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-warm flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // VIEW RENDERS BASED ON HASH ROUTE
  
  // ==========================================
  // VIEW A: DEDICATED LOGIN PAGE (hash === '#/login')
  // ==========================================
  if (hash === '#/login') {
    return (
      <div className="min-h-screen bg-bg-warm flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-brand-primary selection:text-white antialiased">
        {/* Background visual decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-brand-accent/5 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-2 mb-8 select-none">
          <div className="p-2.5 bg-brand-primary rounded-xl text-white shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="block text-2xl font-black tracking-tight text-text-primary leading-none">PropStudio</span>
            <span className="text-xxs font-bold text-brand-accent uppercase tracking-wider">Client Portals</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-border-warm rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in relative z-10">
          
          {/* Top Bar with Home return */}
          <div className="bg-brand-primary p-5 text-white flex justify-between items-center">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Sign in to Portal
            </h2>
            <a 
              href="#/" 
              className="text-white/80 hover:text-white flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </a>
          </div>

          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-3 border-b border-border-warm bg-bg-warm/50 text-center">
            <button 
              onClick={() => setLoginRole('tenant')}
              className={`py-3 text-xs font-bold border-b-2 transition-all ${
                loginRole === 'tenant' 
                  ? 'border-brand-primary text-brand-primary bg-white' 
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Tenant Portal
            </button>
            <button 
              onClick={() => setLoginRole('builder')}
              className={`py-3 text-xs font-bold border-b-2 transition-all ${
                loginRole === 'builder' 
                  ? 'border-brand-primary text-brand-primary bg-white' 
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Builder Portal
            </button>
            <button 
              onClick={() => setLoginRole('manager')}
              className={`py-3 text-xs font-bold border-b-2 transition-all ${
                loginRole === 'manager' 
                  ? 'border-brand-primary text-brand-primary bg-white' 
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Owner Portal
            </button>
          </div>

          {/* Form Body */}
          <div className="p-8 text-left">
            <div className="flex gap-4 border-b border-border-warm pb-3 mb-5">
              <button
                type="button"
                onClick={() => { setIsSignUpMode(false); setLoginError(''); }}
                className={`text-sm font-bold pb-2 border-b-2 transition-all ${
                  !isSignUpMode 
                    ? 'border-brand-primary text-brand-primary' 
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUpMode(true); setLoginError(''); }}
                className={`text-sm font-bold pb-2 border-b-2 transition-all ${
                  isSignUpMode 
                    ? 'border-brand-primary text-brand-primary' 
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                Register
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              {isSignUpMode 
                ? `Create a secure credential below to register as a ${loginRole === 'tenant' ? 'Tenant' : loginRole === 'builder' ? 'Builder' : 'Property Manager'} in our portal database.`
                : 'Sign in to access your custom tenant, landlord, or builder dashboard and manage active listings.'}
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label htmlFor="loginEmail" className="block text-xs font-bold text-text-primary mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  id="loginEmail"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="e.g. yourname@domain.com"
                  className="w-full px-4 py-3 rounded-lg border border-border-warm focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm bg-bg-warm/10"
                />
              </div>
              <div>
                <label htmlFor="loginPassword" className="block text-xs font-bold text-text-primary mb-1.5">Password</label>
                <input 
                  type="password" 
                  id="loginPassword"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-border-warm focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm bg-bg-warm/10"
                />
              </div>

              {!isFirebaseConfigured && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex flex-col gap-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                    Firebase Configuration Required
                  </span>
                  <p className="font-normal text-[11px] text-amber-700 leading-relaxed">
                    This deployment is missing Firebase Environment Variables. Add them under **Settings → Environment Variables** in your Vercel Dashboard to enable authentication.
                  </p>
                </div>
              )}

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold py-3.5 rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  isSignUpMode ? 'Register & Access Portal' : 'Login to Portal'
                )}
              </button>
            </form>

            {/* Google Sign-In */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-warm/75" /></div>
              <span className="relative bg-white px-3 text-xxs font-extrabold uppercase tracking-wider text-text-secondary">Or Authenticate With</span>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="w-full bg-white hover:bg-bg-warm/30 text-text-primary border border-border-warm font-bold py-3 rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {/* Google Colored Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.527a5.99 5.99 0 0 1 5.99-5.99c1.613 0 3.08.63 4.184 1.65l3.11-3.11A9.97 9.97 0 0 0 13.99 2 9.99 9.99 0 0 0 4 12c0 5.523 4.477 10 9.99 10 5.767 0 10.01-4.05 10.01-10 0-.585-.05-1.17-.15-1.715H12.24Z"
                />
              </svg>
              {isSignUpMode ? 'Sign up with Google' : 'Continue with Google'}
            </button>

            {/* Instant Demo Bypass */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-warm/75" /></div>
              <span className="relative bg-white px-3 text-xxs font-extrabold uppercase tracking-wider text-text-secondary">Or Test Immediately</span>
            </div>

            <button 
              onClick={() => triggerDemoLogin(loginRole)}
              disabled={isLoggingIn}
              className="w-full bg-surface-green/45 border border-brand-primary/20 hover:bg-surface-green text-brand-primary font-bold py-3.5 rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-brand-primary fill-brand-primary/30" />
              Demo: Open {loginRole === 'tenant' ? 'Tenant' : loginRole === 'builder' ? 'Builder' : 'Owner'} Dashboard
            </button>
          </div>
        </div>

        <div className="mt-8 text-xxs text-text-secondary tracking-wide">
          PropStudio Website Solutions • Secure Sandbox
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW B: DEDICATED PORTAL DASHBOARD (hash === '#/portal')
  // ==========================================
  if (hash === '#/portal' && isAuthorized) {
    return (
      <div className="h-screen w-screen flex flex-col md:flex-row bg-bg-warm overflow-hidden selection:bg-brand-primary selection:text-white antialiased">
        
        {/* Sidebar Nav */}
        <div className="bg-brand-dark md:w-64 flex flex-col justify-between text-white p-6 shrink-0 z-10 border-r border-white/5">
          <div className="space-y-6">
            
            {/* Logo */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-primary rounded text-white shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-base font-bold tracking-tight text-white">PropStudio</span>
              </div>
              <a href="#/" className="md:hidden text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider">Home</a>
            </div>

            {/* Profile badge */}
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl text-left">
              <span className="block text-[10px] font-bold text-brand-accent uppercase tracking-wider">Active Connection</span>
              <span className="block text-sm font-bold truncate text-white mt-0.5" title={currentUser?.email || ''}>
                {currentUser?.email || (loginRole === 'tenant' ? 'Jane Doe (Unit 4B)' : loginRole === 'builder' ? 'Apex Construction' : 'Miller Properties')}
              </span>
              <span className="inline-block mt-2 px-2 py-0.5 bg-brand-primary text-white rounded text-[10px] font-bold uppercase tracking-wide">
                {loginRole === 'tenant' ? 'Tenant' : loginRole === 'builder' ? 'Builder / Client' : 'Owner / PM'}
              </span>
            </div>

            {/* Navigation options */}
            <nav className="space-y-1 pt-2 hidden md:block text-left">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-white/40 mb-2.5">Dashboard Pages</span>
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white/10 rounded-lg text-sm font-semibold text-white">
                <ClipboardList className="w-4 h-4 text-brand-accent" />
                Overview Status
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-sm font-semibold transition-colors">
                <MessagesSquare className="w-4 h-4" />
                Client Chat
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-sm font-semibold transition-colors">
                <ShieldCheck className="w-4 h-4" />
                Settings
              </button>
            </nav>
          </div>

          {/* Footer Actions in Sidebar */}
          <div className="space-y-3 pt-6 border-t border-white/10">
            <a 
              href="#/" 
              className="w-full bg-white/5 hover:bg-white/10 text-white text-center font-bold py-2.5 rounded-lg text-xs tracking-wide uppercase transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Main Site Home
            </a>
            <button 
              onClick={handleLogout}
              className="w-full bg-red-600/20 border border-red-500/20 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg text-xs tracking-wide uppercase transition-colors flex items-center justify-center gap-2 animate-pulse-subtle"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out Portal
            </button>
          </div>
        </div>

        {/* Dashboard Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          
          {/* Top Bar for Mobile navigation */}
          <div className="bg-brand-dark text-white p-4 flex justify-between items-center md:hidden border-b border-white/10 shrink-0">
            <span className="text-sm font-bold tracking-tight">PropStudio Workspace</span>
            <button 
              onClick={handleLogout}
              className="text-red-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>

          {/* Scrollable dashboard canvas */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto text-left flex flex-col justify-between">
            
            {/* Wrapper for pages content */}
            <div className="space-y-6">
              
              {/* Workspace Header */}
              <div className="flex justify-between items-start border-b border-border-warm/75 pb-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-text-primary">
                    {loginRole === 'tenant' && 'Tenant Maintenance Hub'}
                    {loginRole === 'builder' && 'Client Build Progress'}
                    {loginRole === 'manager' && 'Portfolio Command Center'}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary">
                    {loginRole === 'tenant' && 'Manage your rental payments and report active repairs.'}
                    {loginRole === 'builder' && 'Check stages, download technical blueprints, and track timelines.'}
                    {loginRole === 'manager' && 'Monitor occupancy rates, vacancy counts, and rental operations.'}
                  </p>
                </div>
              </div>

              {/* PORTAL VIEW 1: TENANT INTERACTIVE PORTAL */}
              {loginRole === 'tenant' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                  
                  {/* Left Column: Payments & Submitter */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Rent Status Card */}
                    <div className="bg-white border border-border-warm p-5 rounded-xl shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block text-xxs font-bold uppercase tracking-wider text-emerald-600">Rent Ledger Status</span>
                          <span className="block text-lg font-bold text-text-primary">Paid: $1,850.00 / month</span>
                          <span className="block text-xs text-text-secondary">Next rent schedule: July 01, 2026</span>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-xxs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Active</span>
                    </div>

                    {/* Ticket Submitter form */}
                    <div className="bg-white border border-border-warm p-6 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-brand-accent" />
                        Report Maintenance Issue
                      </h4>
                      <form onSubmit={handleAddTicket} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="newTicketTitle" className="block text-xs font-bold text-text-secondary mb-1">Issue Details</label>
                            <input 
                              type="text"
                              id="newTicketTitle"
                              value={newTicketTitle}
                              onChange={(e) => setNewTicketTitle(e.target.value)}
                              placeholder="e.g. Oven element malfunctioning"
                              required
                              className="w-full px-3 py-2 rounded-lg border border-border-warm text-xs bg-bg-warm/50 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                          </div>
                          <div>
                            <label htmlFor="newTicketCategory" className="block text-xs font-bold text-text-secondary mb-1">Repair Category</label>
                            <select 
                              id="newTicketCategory"
                              value={newTicketCategory}
                              onChange={(e) => setNewTicketCategory(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-border-warm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                            >
                              <option value="Plumbing">Plumbing</option>
                              <option value="HVAC / Cooling">HVAC / Cooling</option>
                              <option value="Electrical">Electrical</option>
                              <option value="Appliance">Appliance</option>
                              <option value="General Maintenance">General Maintenance</option>
                            </select>
                          </div>
                        </div>
                        <button 
                          type="submit" 
                          className="bg-brand-accent hover:bg-brand-accent/90 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors uppercase tracking-wider"
                        >
                          Submit Maintenance Ticket
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Active tickets list */}
                  <div className="lg:col-span-5 bg-white border border-border-warm p-5 rounded-xl shadow-sm flex flex-col">
                    <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border-warm pb-3">Active Tickets ({tenantTickets.length})</h4>
                    <div className="space-y-3 flex-1 max-h-[300px] overflow-y-auto pr-1">
                      {tenantTickets.map((t) => (
                        <div key={t.id} className="p-3.5 bg-bg-warm/50 border border-border-warm rounded-lg text-xs flex justify-between items-start">
                          <div>
                            <span className="block font-bold text-text-primary">{t.title}</span>
                            <span className="text-xxs block text-text-secondary mt-0.5">{t.category} • Logged: {t.date}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                            t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800 animate-fade-in' :
                            t.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* PORTAL VIEW 2: BUILDER PORTAL */}
              {loginRole === 'builder' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                  
                  {/* Left Column: Milestones */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Project timeline card */}
                    <div className="bg-white border border-border-warm p-6 rounded-xl shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Project Timeline Phase</h4>
                        <span className="bg-brand-primary text-white text-xs font-bold px-2 py-0.5 rounded">68% Complete</span>
                      </div>
                      <span className="block text-lg font-bold text-text-primary mb-4 font-black">Apex Custom Duplex Development</span>
                      
                      {/* Bar */}
                      <div className="w-full bg-border-warm/75 h-3 rounded-full mb-6 overflow-hidden">
                        <div className="bg-brand-primary h-full rounded-full transition-all duration-500" style={{ width: '68%' }} />
                      </div>

                      {/* Timeline list */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-brand-primary fill-brand-primary/10 shrink-0" />
                          <span className="font-semibold text-text-primary">Phase 1: Foundation Cast</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-brand-primary fill-brand-primary/10 shrink-0" />
                          <span className="font-semibold text-text-primary">Phase 2: Timber Framing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-brand-primary fill-brand-primary/10 shrink-0" />
                          <span className="font-semibold text-text-primary">Phase 3: HVAC Rough-in</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded border-2 border-brand-accent shrink-0 flex items-center justify-center text-[10px] font-bold text-brand-accent animate-pulse">/</span>
                          <span className="font-semibold text-brand-accent">Phase 4: Drywalling & Exterior</span>
                        </div>
                      </div>
                    </div>

                    {/* Blueprint uploader form */}
                    <div className="bg-white border border-border-warm p-6 rounded-xl shadow-sm">
                      <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Upload Technical Document</h4>
                      <form onSubmit={handleAddDoc} className="flex gap-2">
                        <input 
                          type="text" 
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          placeholder="e.g. Foundation_Detail_Sheet_A02"
                          required
                          className="flex-1 px-3 py-2.5 rounded-lg border border-border-warm text-xs bg-bg-warm/50 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                        <button 
                          type="submit"
                          className="bg-brand-accent hover:bg-brand-accent/90 text-white text-xs font-bold px-4 rounded-lg shadow-sm transition-colors uppercase tracking-wider"
                        >
                          Add PDF
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: uploaded files */}
                  <div className="lg:col-span-5 bg-white border border-border-warm p-5 rounded-xl shadow-sm flex flex-col">
                    <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border-warm pb-3 flex items-center gap-1">
                      <FileText className="w-4 h-4 text-brand-accent" />
                      Uploaded Blueprints ({builderDocs.length})
                    </h4>
                    <div className="space-y-3 flex-1 max-h-[300px] overflow-y-auto pr-1">
                      {builderDocs.map((d, idx) => (
                        <div key={idx} className="p-3 bg-bg-warm/50 border border-border-warm rounded-lg text-xs flex justify-between items-center">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="p-2 bg-white border border-border-warm/75 rounded text-brand-accent shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                              <span className="block font-bold text-text-primary truncate" title={d.name}>{d.name}</span>
                              <span className="block text-xxs text-text-secondary">{d.size} • {d.date}</span>
                            </div>
                          </div>
                          <a 
                            href={`#download-${idx}`}
                            onClick={(e) => { e.preventDefault(); alert(`Mock download triggered for: ${d.name}`); }}
                            className="text-brand-primary hover:text-brand-dark hover:underline font-bold text-xxs uppercase tracking-wider shrink-0"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* PORTAL VIEW 3: OWNER PORTAL */}
              {loginRole === 'manager' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Stats Cards grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-border-warm p-5 rounded-xl shadow-sm">
                      <span className="block text-xxs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Managed Units</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-text-primary">124</span>
                        <span className="text-xxs font-bold text-emerald-600">+8 this qtr</span>
                      </div>
                    </div>
                    <div className="bg-white border border-border-warm p-5 rounded-xl shadow-sm">
                      <span className="block text-xxs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Occupancy Rate</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-text-primary">96.8%</span>
                        <span className="text-xxs font-bold text-emerald-600">Stable</span>
                      </div>
                    </div>
                    <div className="bg-white border border-border-warm p-5 rounded-xl shadow-sm">
                      <span className="block text-xxs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Repair Tickets</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-brand-accent">{totalTicketsCount}</span>
                        <span className="text-xxs font-bold text-amber-600">{scheduledTicketsCount} scheduled</span>
                      </div>
                    </div>
                    <div className="bg-white border border-border-warm p-5 rounded-xl shadow-sm">
                      <span className="block text-xxs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Monthly Receipts</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-text-primary">$84.2K</span>
                        <span className="text-xxs font-bold text-emerald-600">+4.2% YoY</span>
                      </div>
                    </div>
                  </div>

                  {/* Vacancy units listing & financials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vacant units list */}
                    <div className="bg-white border border-border-warm p-6 rounded-xl shadow-sm text-left">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border-warm">
                        <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">Vacancies List (2)</h4>
                        <span className="text-xxs font-bold text-brand-primary uppercase tracking-wider">Listing active</span>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3.5 bg-bg-warm/50 border border-border-warm rounded-lg text-xs flex justify-between items-center">
                          <div>
                            <span className="block font-bold text-text-primary">Unit 14B Elm St (Duplex)</span>
                            <span className="text-xxs text-text-secondary block mt-0.5">2 Bed • 2 Bath • $1,950/mo</span>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Listed</span>
                        </div>
                        <div className="p-3.5 bg-bg-warm/50 border border-border-warm rounded-lg text-xs flex justify-between items-center">
                          <div>
                            <span className="block font-bold text-text-primary">Unit 204 Oakwood Res</span>
                            <span className="text-xxs text-text-secondary block mt-0.5">1 Bed • 1 Bath • $1,400/mo</span>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Listed</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial balance breakdown card */}
                    <div className="bg-white border border-border-warm p-6 rounded-xl shadow-sm flex flex-col justify-between text-left">
                      <div>
                        <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 pb-3 border-b border-border-warm">Financial Breakdown</h4>
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between items-center text-text-secondary">
                            <span>Gross Rental Receipts:</span>
                            <span className="font-bold text-text-primary">$84,200.00</span>
                          </div>
                          <div className="flex justify-between items-center text-text-secondary">
                            <span>Service / Maintenance Cost:</span>
                            <span className="font-bold text-brand-accent">-$3,450.00</span>
                          </div>
                          <div className="flex justify-between items-center text-text-secondary">
                            <span>Marketing & Ads Fee:</span>
                            <span className="font-bold text-text-primary">-$1,100.00</span>
                          </div>
                          <div className="h-px bg-border-warm my-2.5" />
                          <div className="flex justify-between items-center font-bold text-sm text-text-primary">
                            <span>Owner Net Earnings:</span>
                            <span className="text-brand-primary">$79,650.00</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 flex items-center gap-1.5 text-[10px] font-bold text-text-secondary border-t border-border-warm/50 mt-6 uppercase tracking-wide">
                        <TrendingUp className="w-4 h-4 text-brand-primary" />
                        <span>Payout scheduled: June 20, 2026</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Sandbox footer information */}
            <div className="border-t border-border-warm/75 pt-5 mt-8 text-[10px] text-text-secondary leading-relaxed flex flex-col sm:flex-row justify-between items-center gap-3">
              <span>© Sandbox Demo Portal environment. Ready for backend API integrations.</span>
              <span className="font-bold text-brand-primary">Built for Builders & Property Managers.</span>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW C: MAIN MARKETING LANDING SITE (default route)
  // ==========================================
  return (
    <div className="min-height-screen flex flex-col bg-bg-warm selection:bg-brand-primary selection:text-white antialiased">
      
      {!isFirebaseConfigured && (
        <div className="bg-amber-500 text-white text-xs font-semibold py-2.5 px-4 text-center flex items-center justify-center gap-2 relative z-50 shadow-md">
          <AlertCircle className="w-4 h-4 shrink-0 animate-pulse text-white" />
          <span>Firebase configuration is missing! Running in Demo Mode. Set your environment variables in Vercel to enable live databases.</span>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-bg-warm/95 backdrop-blur-md border-b border-border-warm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-primary rounded-lg text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-text-primary">PropStudio</span>
              <span className="hidden sm:inline text-xs block text-brand-accent font-semibold tracking-wider uppercase">Web Design</span>
            </div>
          </div>

          {/* Navigation Anchors */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-text-secondary">
            <a href="#services" className="hover:text-brand-primary transition-colors">Services</a>
            <a href="#use-cases" className="hover:text-brand-primary transition-colors">Use Cases</a>
            <a href="#packages" className="hover:text-brand-primary transition-colors">Packages</a>
            <a href="#process" className="hover:text-brand-primary transition-colors">Our Process</a>
            <a href="#testimonials" className="hover:text-brand-primary transition-colors">Outcomes</a>
            <a href="#faq" className="hover:text-brand-primary transition-colors">FAQ</a>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <a 
              href="#/login"
              className="text-sm font-semibold text-text-primary hover:text-brand-primary transition-colors flex items-center gap-1.5 border border-border-warm px-4 py-2 bg-white rounded-lg shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-text-secondary" />
              Client Login
            </a>
            <a 
              href="#contact" 
              className="bg-brand-primary hover:bg-brand-dark text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              Get Free Plan
            </a>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-text-primary p-2 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-bg-warm border-b border-border-warm py-4 px-6 animate-fade-in">
            <nav className="flex flex-col gap-4 text-base font-semibold text-text-secondary">
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary py-1.5 transition-colors">Services</a>
              <a href="#use-cases" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary py-1.5 transition-colors">Use Cases</a>
              <a href="#packages" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary py-1.5 transition-colors">Packages</a>
              <a href="#process" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary py-1.5 transition-colors">Our Process</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary py-1.5 transition-colors">Outcomes</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary py-1.5 transition-colors">FAQ</a>
              
              <div className="h-px bg-border-warm my-2" />
              
              <div className="flex flex-col gap-3 pt-2">
                <a 
                  href="#/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 text-sm font-semibold border border-border-warm bg-white text-text-primary py-2.5 rounded-lg hover:bg-bg-warm"
                >
                  <Lock className="w-4 h-4" />
                  Client Login Portal
                </a>
                <a 
                  href="#contact" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-brand-primary text-white text-center py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-brand-dark transition-colors"
                >
                  Get Free Plan
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <div className="lg:col-span-6 flex flex-col items-start text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-green text-brand-primary rounded-full text-xs font-bold tracking-wide uppercase mb-6 border border-brand-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-ping" />
              Tailored for Property Pros
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.1] mb-6">
              Websites That Bring <span className="text-brand-primary">More Leads</span> to Local Property Businesses
            </h1>
            
            <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-xl">
              I build fast, professional websites specifically for local builders, landlords, and property managers. With pre-integrated WhatsApp capture, project portfolios, and digital maintenance requests designed to convert interest into bookings.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a 
                href="#contact" 
                className="bg-brand-primary hover:bg-brand-dark text-white px-8 py-4 rounded-xl font-semibold shadow-md transition-all duration-200 text-center hover:-translate-y-0.5 active:translate-y-0"
              >
                Get a Free Website Plan
              </a>
              <a 
                href="#packages" 
                className="border border-border-warm bg-white hover:bg-surface-green text-text-primary px-8 py-4 rounded-xl font-semibold shadow-sm transition-all duration-200 text-center hover:-translate-y-0.5 active:translate-y-0"
              >
                View Packages
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border-warm/75 pt-8 w-full max-w-lg">
              <div>
                <span className="block text-2xl lg:text-3xl font-extrabold text-brand-primary">100%</span>
                <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">Mobile Optimized</span>
              </div>
              <div>
                <span className="block text-2xl lg:text-3xl font-extrabold text-brand-accent">14 Days</span>
                <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">Average Launch</span>
              </div>
              <div>
                <span className="block text-2xl lg:text-3xl font-extrabold text-brand-primary">2.5x</span>
                <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">Enquiry Growth</span>
              </div>
            </div>
          </div>

          {/* Right Visual element */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg aspect-square lg:aspect-auto lg:h-[520px] rounded-2xl overflow-hidden border border-border-warm shadow-xl bg-white">
              <img 
                src="/hero_property.png" 
                alt="Modern Residential Building Project"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-text-primary/10 to-transparent pointer-events-none" />

              {/* Floating tags */}
              <div className="absolute top-8 left-6 bg-white/90 backdrop-blur-md border border-border-warm/50 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-bounce-slow max-w-[260px]">
                <div className="p-2.5 bg-surface-green text-brand-primary rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xxs font-bold uppercase tracking-wider text-brand-primary">Lead Received</span>
                  <span className="block text-sm font-bold text-text-primary truncate">Apex Duplex Request</span>
                  <span className="block text-xs text-text-secondary">Enquiry form submitted</span>
                </div>
              </div>

              <div className="absolute top-1/2 right-6 -translate-y-1/2 bg-white/95 backdrop-blur-md border border-border-warm/50 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-float-slow max-w-[250px]">
                <div className="p-2.5 bg-green-100 text-green-600 rounded-lg">
                  <MessagesSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xxs font-bold uppercase tracking-wider text-green-600">WhatsApp Lead</span>
                  <span className="block text-sm font-bold text-text-primary">Landlord Consultation</span>
                  <span className="block text-xs text-text-secondary">Opened 2 mins ago</span>
                </div>
              </div>

              <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md border border-border-warm/50 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-bounce-slow max-w-[260px]">
                <div className="p-2.5 bg-surface-copper text-brand-accent rounded-lg">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xxs font-bold uppercase tracking-wider text-brand-accent">Tenant Ticket</span>
                  <span className="block text-sm font-bold text-text-primary">Unit 4B: Leak Reported</span>
                  <span className="block text-xs text-text-secondary">Logged in system</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-white border-y border-border-warm py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-y-6 gap-x-8">
          <p className="text-sm font-bold text-text-secondary uppercase tracking-wider w-full lg:w-auto text-center lg:text-left">
            Why Local Property Businesses Choose Us:
          </p>
          <div className="flex flex-wrap justify-center lg:justify-end gap-x-10 gap-y-4 w-full lg:w-auto text-sm font-semibold text-text-primary">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-accent" />
              <span>Mobile-First Formats</span>
            </div>
            <div className="flex items-center gap-2">
              <MessagesSquare className="w-4 h-4 text-brand-primary" />
              <span>WhatsApp Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-brand-primary" />
              <span>Local Google SEO Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-accent" />
              <span>Secure Managed Hosting</span>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-surface-green text-brand-primary rounded-full text-xs font-bold tracking-wide uppercase mb-4 border border-brand-primary/10">
            What We Do
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mb-4">
            Everything Your Property Website Needs
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-16">
            We don't build generic SaaS landing pages. We build features designed to handle local project galleries, capture WhatsApp interest, and organize tenant requests.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ServiceCard 
              icon={<Hammer className="w-6 h-6 text-brand-accent" />}
              title="Builder Portfolios"
              description="High-resolution project showcases, construction phase timelines, and technical material lists to show the quality of your builds."
            />
            <ServiceCard 
              icon={<Building2 className="w-6 h-6 text-brand-primary" />}
              title="Property Management Portals"
              description="Modern digital hubs with simple interfaces showing available local rentals, maps, and rental applications."
            />
            <ServiceCard 
              icon={<Wrench className="w-6 h-6 text-brand-accent" />}
              title="Maintenance Request Intake"
              description="Tenant-friendly online request systems that collect photo uploads of repairs and send details straight to your email."
            />
            <ServiceCard 
              icon={<MessagesSquare className="w-6 h-6 text-brand-primary" />}
              title="WhatsApp Lead Funnel"
              description="One-click buttons that start chats on WhatsApp, pre-populated with details of the project or property the user was viewing."
            />
            <ServiceCard 
              icon={<Search className="w-6 h-6 text-brand-primary" />}
              title="Local SEO Foundation"
              description="Built to rank for terms like 'builder near me' or 'rental manager in [city]' with optimized headers, local schema, and speed."
            />
            <ServiceCard 
              icon={<ClipboardList className="w-6 h-6 text-brand-accent" />}
              title="Managed Hosting & Support"
              description="Vite-powered ultra-fast website hosting and domain configuration, with unlimited monthly text edits included so you stay updated."
            />
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" className="py-20 lg:py-24 bg-white border-y border-border-warm px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 bg-surface-copper text-brand-accent rounded-full text-xs font-bold tracking-wide uppercase mb-4 border border-brand-accent/10">
              Designed For You
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mb-4">
              Designed Around Your Operations
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Select your business type to see how a professional website structure replaces manual WhatsApp messages and sheets.
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="bg-bg-warm p-1.5 rounded-xl border border-border-warm/75 flex gap-2">
              <button 
                onClick={() => setActiveTab('builder')}
                className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'builder' 
                    ? 'bg-brand-primary text-white shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Hammer className="w-4 h-4" />
                For Builders
              </button>
              <button 
                onClick={() => setActiveTab('pm')}
                className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'pm' 
                    ? 'bg-brand-primary text-white shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Wrench className="w-4 h-4" />
                For Property Managers
              </button>
              <button 
                onClick={() => setActiveTab('landlord')}
                className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'landlord' 
                    ? 'bg-brand-primary text-white shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Home className="w-4 h-4" />
                For Landlords
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 flex flex-col justify-center text-left">
              {activeTab === 'builder' && (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold text-text-primary mb-4">
                    Showcase Your Craft & Capture High-Value Contracts
                  </h3>
                  <p className="text-text-secondary leading-relaxed mb-6">
                    Builders lose clients when their online profile looks messy. We set up high-end project showcases that highlight before-and-after work, materials used, and exact local project details.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-text-primary">Interactive project image galleries</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-text-primary">Interactive quote requests with city/locality filters</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-text-primary">Clear timeline highlighting stages of construction</span>
                    </li>
                  </ul>
                  <a href="#contact" className="inline-flex items-center gap-2 text-brand-primary font-bold hover:text-brand-dark transition-colors">
                    Build My Builder Portfolio <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              {activeTab === 'pm' && (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold text-text-primary mb-4">
                    Automate Tenant Intake & Save Hours of Calls
                  </h3>
                  <p className="text-text-secondary leading-relaxed mb-6">
                    Stop answering emergency repair calls during weekends. Our simple maintenance request system collects photos and descriptions of issues online, sending them immediately to your inbox.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-text-primary">Custom maintenance intake with photo upload links</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-text-primary">Clean vacancy listings matching your inventory</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-text-primary">Digital rental application forms</span>
                    </li>
                  </ul>
                  <a href="#contact" className="inline-flex items-center gap-2 text-brand-primary font-bold hover:text-brand-dark transition-colors">
                    Build My PM Hub <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              {activeTab === 'landlord' && (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold text-text-primary mb-4">
                    List Rent Units & Route Applicants Straight to WhatsApp
                  </h3>
                  <p className="text-text-secondary leading-relaxed mb-6">
                    Avoid expensive third-party listing platforms. Create a simple portfolio site showcasing your units, amenities, and pricing, with pre-filled WhatsApp click-to-chat features for applicants.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-text-primary">Single or multi-property landing sections</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-text-primary">Click-to-chat links pre-filled with Unit IDs</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-text-primary">Interactive neighborhood utility highlights</span>
                    </li>
                  </ul>
                  <a href="#contact" className="inline-flex items-center gap-2 text-brand-primary font-bold hover:text-brand-dark transition-colors">
                    Build My Landlord Page <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-2xl bg-bg-warm p-4 rounded-2xl border border-border-warm shadow-md">
                {activeTab === 'builder' ? (
                  <img 
                    src="/usecase_builder.png" 
                    alt="Builder Website Mockup on Laptop" 
                    className="w-full h-auto rounded-lg shadow-sm border border-border-warm object-cover"
                  />
                ) : (
                  <img 
                    src="/usecase_pm.png" 
                    alt="Property Management Portal Mockup on Desktop" 
                    className="w-full h-auto rounded-lg shadow-sm border border-border-warm object-cover"
                  />
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-surface-green text-brand-primary rounded-full text-xs font-bold tracking-wide uppercase mb-4 border border-brand-primary/10">
            Pricing Options
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mb-4">
            Packages Built for Every Stage
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-16">
            Transparent pricing with zero hidden development fees. Choose a package to support your team, gather enquiries, and grow your local trust.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            <PackageCard 
              name="Starter Website"
              price="Starting from $799"
              description="A single-page, highly polished website. Best for individual landlords, independent builders, or single developments."
              features={[
                "Single-page responsive design",
                "Project or unit gallery (up to 6 items)",
                "Pre-filled WhatsApp click-to-chat",
                "Contact enquiry lead form",
                "Local SEO setup (Google-ready)",
                "1 year of hosting & domain support"
              ]}
              ctaText="Get Started"
            />
            <PackageCard 
              name="Growth Website"
              price="Starting from $1,499"
              isPopular={true}
              description="Multi-section professional business website. Best for growing builder firms, developers, and local rental portfolios."
              features={[
                "Advanced multi-section layout",
                "Project filter showcase (builder work)",
                "Full interactive tenant contact forms",
                "WhatsApp and phone link triggers",
                "Structured services presentation",
                "Local SEO schema integration",
                "1 year of fully managed updates"
              ]}
              ctaText="Build My Studio"
            />
            <PackageCard 
              name="Pro System"
              price="Starting from $2,499"
              description="Full custom digital setup for property managers, real estate agencies, and busy construction contractors."
              features={[
                "Custom web system setup",
                "Digital property listings dashboard",
                "Interactive maintenance intake form",
                "Advanced tenant application upload",
                "Automated email notifications to office",
                "Google Maps & local review highlights",
                "Priority ongoing technical support"
              ]}
              ctaText="Request Custom Quote"
            />
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="py-20 lg:py-24 bg-white border-y border-border-warm px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-surface-copper text-brand-accent rounded-full text-xs font-bold tracking-wide uppercase mb-4 border border-brand-accent/10">
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mb-4">
            From First Strategy Call to Launch
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-16">
            Building a website shouldn't feel like a second job. We manage design, development, and hosting details so you can focus on property.
          </p>

          <div className="relative mt-8">
            <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-[2px] bg-border-warm/75" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 relative">
              <ProcessStep 
                num="1"
                title="Free Planning Call"
                description="A 30-minute review where we discuss your property services, city location, and key lead goals."
              />
              <ProcessStep 
                num="2"
                title="Structure Draft"
                description="We prepare a visual layout prototype showing how project pages or tenant forms will sit on the page."
              />
              <ProcessStep 
                num="3"
                title="Vite Development"
                description="We code your website in React. It's built for rapid loading, accessibility, and high mobile performance."
              />
              <ProcessStep 
                num="4"
                title="Lead Integration"
                description="We link forms to your email and pre-program WhatsApp triggers to redirect requests cleanly."
              />
              <ProcessStep 
                num="5"
                title="Launch & SEO Sync"
                description="We launch the site on your domain, index it on Google Search Console, and set up tracking."
              />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-surface-green text-brand-primary rounded-full text-xs font-bold tracking-wide uppercase mb-4 border border-brand-primary/10">
            Client Success
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mb-4">
            Real Business Outcomes
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-16">
            Hear from local builders and managers who upgraded their manual text flows into professional lead capturing sites.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="Our custom duplex builds are visual. This website highlights them perfectly. We captured two villa build quotes via the form in the first month. Excellent local setup!"
              author="Mark Rayson"
              role="Founder, Rayson Custom Homes"
              location="Austin, TX"
            />
            <TestimonialCard 
              quote="We replaced our paper repair forms. Tenants upload leak/appliance issues online with photos. It's saved our office hours of calls weekly."
              author="Clara Vance"
              role="Operations Manager, Metro Haven PM"
              location="Denver, CO"
            />
            <TestimonialCard 
              quote="The WhatsApp click-to-chat triggers have been a game changer. Tenant applicants message our phone directly with property IDs, renting units twice as fast."
              author="David Miller"
              role="Property Landlord, Miller Apartments"
              location="Phoenix, AZ"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-24 bg-white border-y border-border-warm px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-surface-copper text-brand-accent rounded-full text-xs font-bold tracking-wide uppercase mb-4 border border-brand-accent/10">
              Your Questions Answered
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-text-secondary">
              Have questions about updates, domains, or listing assets? Find quick details below.
            </p>
          </div>

          <div className="space-y-4">
            <FAQItem 
              question="How long does it take to launch a website?"
              answer="A typical Starter website goes live in 7 to 10 days. Multi-section Growth pages or custom Pro systems with vacancy listings and maintenance intake portals take around 2 to 3 weeks."
            />
            <FAQItem 
              question="Do I need to supply all photos and text?"
              answer="If you have project photos and descriptions, we will optimize them for the page. If you do not, we source and generate realistic, professional construction and property visuals to fit your brand. We also draft all website copy based on our strategy call."
            />
            <FAQItem 
              question="How do the WhatsApp pre-filled leads work?"
              answer="We create custom triggers that link visitors directly to your WhatsApp Business number. When clicked, it opens a chat on their device pre-loaded with a message like: 'Hi, I'm interested in viewing the Oakridge Duplex.' This makes starting the lead conversation friction-free."
            />
            <FAQItem 
              question="Can I request updates after launching?"
              answer="Yes! All of our packages include 1 year of managed support and hosting. Whenever you complete a new construction project or change a rental price, just send us the details on WhatsApp or email, and we update it within 24 hours."
            />
            <FAQItem 
              question="Who owns the website and domain name?"
              answer="You own 100% of the website, copy, and domain name. We help you purchase or register the domain and link it to our secure cloud hosting servers."
            />
          </div>
        </div>
      </section>

      {/* CONTACT CTA FORM */}
      <section id="contact" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-brand-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand-accent/5 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-3 py-1 bg-brand-primary/20 text-surface-green rounded-full text-xs font-bold tracking-wide uppercase mb-6 border border-brand-primary/20">
            Get Started Today
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Get a Free Custom Website Plan
          </h2>
          <p className="text-lg text-surface-green max-w-2xl mx-auto mb-12">
            Tell me about your property business and I will map out the ideal website structure, list features, and estimate launch time. No obligation.
          </p>

          <div className="bg-white text-text-primary text-left p-8 sm:p-10 rounded-2xl shadow-xl border border-border-warm/50 max-w-2xl mx-auto">
            {!submittedForm ? (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-bold text-text-primary mb-2">Your Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-border-warm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-bold text-text-primary mb-2">Business Name</label>
                    <input 
                      type="text" 
                      id="businessName" 
                      name="businessName"
                      required
                      placeholder="e.g. Apex Builders"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-border-warm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="businessType" className="block text-sm font-bold text-text-primary mb-2">Business Type</label>
                    <select 
                      id="businessType" 
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-border-warm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow text-sm cursor-pointer"
                    >
                      <option value="builder">Builder / Contractor</option>
                      <option value="pm">Property Manager</option>
                      <option value="landlord">Landlord (Private)</option>
                      <option value="agency">Real Estate Agency</option>
                      <option value="other">Other Business</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-bold text-text-primary mb-2">Phone / WhatsApp</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone"
                      required
                      placeholder="e.g. +1 (555) 019-9000"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-border-warm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-bold text-text-primary mb-2">City / Operating Area</label>
                  <input 
                    type="text" 
                    id="city" 
                    name="city"
                    required
                    placeholder="e.g. Austin, TX"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-border-warm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="details" className="block text-sm font-bold text-text-primary mb-2">Tell me about your projects or properties</label>
                  <textarea 
                    id="details" 
                    name="details"
                    rows={4}
                    required
                    placeholder="e.g. We build custom houses and want a gallery, or we manage 40 apartments and need tenant request forms..."
                    value={formData.details}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-border-warm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow text-sm"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white font-bold py-4 rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-center text-sm tracking-wide uppercase"
                >
                  Send Request
                </button>
              </form>
            ) : (
              <div className="py-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-surface-green text-brand-primary rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-primary/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">Plan Request Received!</h3>
                <p className="text-text-secondary text-sm max-w-md mx-auto mb-8">
                  Thanks, <span className="font-bold text-text-primary">{formData.name}</span>! I've logged your request for <span className="font-bold text-text-primary">{formData.businessName}</span>.
                </p>
                <div className="bg-bg-warm p-6 rounded-xl border border-border-warm text-left text-sm space-y-3 max-w-md mx-auto mb-8">
                  <span className="block font-bold text-xs uppercase tracking-wider text-brand-accent">Next Steps:</span>
                  <div className="flex gap-2">
                    <span className="font-bold text-brand-primary">1.</span>
                    <span className="text-text-secondary">I will analyze your local competitors in <span className="font-medium text-text-primary">{formData.city}</span>.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-brand-primary">2.</span>
                    <span className="text-text-secondary">Draft a personalized layout structure map.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-brand-primary">3.</span>
                    <span className="text-text-secondary">Reach out to you on <span className="font-medium text-text-primary">{formData.phone}</span> in 24 hours.</span>
                  </div>
                </div>
                <button 
                  onClick={resetForm}
                  className="bg-brand-primary hover:bg-brand-dark text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Submit Another Request
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-text-primary text-border-warm py-16 px-4 sm:px-6 lg:px-8 border-t border-border-warm/15">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">
          
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="p-2 bg-brand-primary rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">PropStudio</span>
            </div>
            <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
              Premium website packages and leads workflows developed specifically for builders, landlords, and property managers in local residential markets.
            </p>
            <div className="flex gap-4 pt-2 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Local & Remote
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Vite + React Hosted
              </span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Navigation</h4>
            <ul className="space-y-2.5 text-sm font-medium text-text-secondary">
              <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
              <li><a href="#use-cases" className="hover:text-white transition-colors">Use Cases</a></li>
              <li><a href="#packages" className="hover:text-white transition-colors">Packages</a></li>
              <li><a href="#process" className="hover:text-white transition-colors">Our Process</a></li>
              <li><a href="#testimonials" className="hover:text-white transition-colors">Outcomes</a></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Connect</h4>
            <ul className="space-y-3 text-sm font-medium text-text-secondary">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-accent shrink-0" />
                <a href="mailto:hello@propstudio.co" className="hover:text-white transition-colors">hello@propstudio.co</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-primary shrink-0" />
                <a href="tel:+15550199000" className="hover:text-white transition-colors">+1 (555) 019-9000</a>
              </li>
              <li className="flex items-center gap-2">
                <MessagesSquare className="w-4 h-4 text-green-500 shrink-0" />
                <a 
                  href="https://wa.me/15550199000?text=Hi%20PropStudio,%20I'd%20like%20to%20get%2520a%2520free%2520website%2520plan" 
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors text-green-500 hover:underline"
                >
                  WhatsApp Business Chat
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-border-warm/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-text-secondary">
          <p>© {new Date().getFullYear()} PropStudio Website Design. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  )
}

// SUB-COMPONENTS

// FAQ Accordion Card
function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-bg-warm border border-border-warm rounded-xl overflow-hidden transition-all duration-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left font-bold text-text-primary hover:bg-border-warm/25 transition-colors focus:outline-none"
      >
        <span className="text-base sm:text-lg">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-brand-primary shrink-0" /> : <ChevronDown className="w-5 h-5 text-brand-primary shrink-0" />}
      </button>
      
      {isOpen && (
        <div className="p-5 pt-0 border-t border-border-warm/50 bg-white/50 text-sm sm:text-base text-text-secondary leading-relaxed animate-slide-down">
          {answer}
        </div>
      )}
    </div>
  )
}

// Service Card
function ServiceCard({ icon, title, description }: ServiceCardProps) {
  return (
    <div className="bg-white border border-border-warm p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col text-left hover:-translate-y-1">
      <div className="p-3 bg-bg-warm rounded-lg self-start mb-6 border border-border-warm/50">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-3">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  )
}

// Process Step
function ProcessStep({ num, title, description }: { num: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center lg:items-start text-center lg:text-left relative z-10 px-4">
      <div className="w-12 h-12 bg-brand-primary text-white font-extrabold rounded-full flex items-center justify-center text-lg mb-4 ring-8 ring-bg-warm">
        {num}
      </div>
      <h4 className="text-lg font-bold text-text-primary mb-2">{title}</h4>
      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xs">{description}</p>
    </div>
  )
}

// Package Card
function PackageCard({ name, price, description, features, isPopular, ctaText }: PackageCardProps) {
  return (
    <div className={`bg-white border p-8 rounded-2xl flex flex-col justify-between text-left transition-all duration-300 relative ${
      isPopular 
        ? 'border-brand-accent ring-2 ring-brand-accent shadow-md hover:shadow-lg scale-100 lg:scale-[1.03] z-10' 
        : 'border-border-warm shadow-sm hover:shadow-md'
    }`}>
      
      {isPopular && (
        <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-brand-accent text-white px-4 py-1 rounded-full text-xxs font-extrabold uppercase tracking-widest shadow-sm">
          Most Popular
        </div>
      )}

      <div>
        <h3 className="text-xl font-extrabold text-text-primary mb-2">{name}</h3>
        <p className="text-xs text-text-secondary leading-relaxed mb-6">{description}</p>
        
        <div className="border-y border-border-warm/75 py-4 mb-6">
          <span className="text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight">{price}</span>
        </div>

        <ul className="space-y-3 mb-8">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <a 
        href="#contact" 
        className={`w-full py-3.5 rounded-xl font-bold text-center text-sm tracking-wide transition-all duration-200 block ${
          isPopular 
            ? 'bg-brand-accent hover:bg-brand-accent/90 text-white shadow-sm hover:-translate-y-0.5' 
            : 'bg-bg-warm border border-border-warm hover:bg-surface-green text-text-primary hover:-translate-y-0.5'
        }`}
      >
        {ctaText}
      </a>
    </div>
  )
}

// Testimonial / Outcome Card
function TestimonialCard({ quote, author, role, location }: { quote: string; author: string; role: string; location: string }) {
  return (
    <div className="bg-white border border-border-warm p-8 rounded-xl shadow-sm flex flex-col justify-between text-left transition-all duration-300 hover:shadow-md">
      <div>
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        
        <p className="text-sm sm:text-base text-text-secondary italic leading-relaxed mb-6">
          "{quote}"
        </p>
      </div>

      <div className="border-t border-border-warm/75 pt-4 mt-2 flex items-center justify-between">
        <div>
          <span className="block font-bold text-text-primary text-sm sm:text-base">{author}</span>
          <span className="block text-xxs font-bold text-brand-primary uppercase tracking-wider">{role}</span>
        </div>
        <span className="text-xxs font-bold text-text-secondary bg-bg-warm px-2 py-1 rounded border border-border-warm/50 uppercase tracking-wider">{location}</span>
      </div>
    </div>
  )
}
