
import { create } from 'zustand';
import { User, Role, Student, Staff, Parent, SystemSettings, SystemLog, SessionLog, Application, ShopItem, Order, MilestoneRecord, PaymentRecord, Notice, NoticeTarget, NoticeType, StudentApplication } from '../types';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  updatePassword
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot,
  query,
  orderBy,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  limit,
  arrayUnion,
  where
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJleJuSyL7GvqpcvTsZNnVYRCMmqJNR8o",
  authDomain: "defineddomnain.firebaseapp.com",
  projectId: "defineddomnain",
  storageBucket: "defineddomnain.firebasestorage.app",
  messagingSenderId: "546744382707",
  appId: "1:546744382707:web:9d6f21fc8bf3f7b2a27386"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const secondaryApp = getApps().length > 1 ? getApp("Secondary") : initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

// Helper to sync Firebase Auth password using secondaryAuth
const syncAuthPassword = async (email: string, newPassword: string, fallbackPasswords: string[] = []): Promise<boolean> => {
  const cleanEmail = email.toLowerCase().trim();
  const cleanPass = newPassword.trim();
  if (!cleanEmail || !cleanPass) return false;

  const candidates = Array.from(new Set([cleanPass, ...fallbackPasswords, "000000", "pppppp", "password"]));
  let synced = false;

  for (const p of candidates) {
    if (!p) continue;
    try {
      const cred = await signInWithEmailAndPassword(secondaryAuth, cleanEmail, p);
      if (cred.user) {
        if (p !== cleanPass) {
          await updatePassword(cred.user, cleanPass);
        }
        await signOut(secondaryAuth);
        synced = true;
        break;
      }
    } catch (e) {
      // try next candidate
    }
  }

  if (!synced) {
    try {
      await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, cleanPass);
      await signOut(secondaryAuth);
      synced = true;
    } catch (createErr: any) {
      await signOut(secondaryAuth);
    }
  }
  return synced;
};

// Helper to extract image URL from HTML snippets
const extractSrcFromHtml = (input: string) => {
  if (!input) return '';
  const match = input.match(/src="([^"]+)"/);
  return match ? match[1] : input.trim();
};

type View = 'landing' | 'login' | 'app' | 'careers' | 'shop' | 'verify' | 'id-verify' | 'apply' | 'tour';

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface CartItem extends ShopItem {
  cartId: string;
  quantity: number;
}

export interface MilestoneTemplate {
  id: string;
  label: string;
  minAge: number; 
  maxAge: number; 
  sections: {
    title: string;
    items: string[];
  }[];
  redFlags: string[];
}

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: User | null;
  isLoggedIn: boolean;
  view: View;
  setView: (view: View) => void;
  login: (role: Role, credentials: { email: string; pass: string }) => Promise<void>;
  logout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: (open?: boolean) => void;
  isNoticesOpen: boolean;
  toggleNotices: (open?: boolean) => void;
  notifications: AppNotification[];
  notify: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  students: Student[];
  staff: Staff[];
  parents: Parent[];
  clinicalLogs: SessionLog[];
  systemLogs: SystemLog[];
  applications: Application[];
  studentApplications: StudentApplication[];
  shopItems: ShopItem[];
  cart: CartItem[];
  orders: Order[];
  payments: PaymentRecord[];
  milestoneRecords: MilestoneRecord[];
  milestoneTemplates: MilestoneTemplate[];
  notices: Notice[];
  settings: SystemSettings;
  selectedStudentIdForLog: string | null;
  setSelectedStudentIdForLog: (id: string | null) => void;
  initializeData: () => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (uid: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (uid: string) => Promise<void>;
  addStaff: (staff: Staff) => Promise<void>;
  updateStaff: (id: string, data: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  updateUserProfile: (data: { name?: string; password?: string }) => Promise<void>;
  addSystemLog: (action: string, details: string) => Promise<void>;
  addClinicalLog: (log: Omit<SessionLog, 'id'>) => Promise<void>;
  submitApplication: (app: Omit<Application, 'id' | 'status' | 'timestamp'>) => Promise<void>;
  updateApplicationStatus: (id: string, status: Application['status']) => Promise<void>;
  submitStudentApplication: (app: Omit<StudentApplication, 'id' | 'status' | 'timestamp'>) => Promise<void>;
  updateStudentApplicationStatus: (id: string, status: StudentApplication['status'], reply?: string) => Promise<void>;
  addShopItem: (item: Omit<ShopItem, 'id'>) => Promise<void>;
  deleteShopItem: (id: string) => Promise<void>;
  addToCart: (item: ShopItem) => void;
  updateCartQuantity: (cartId: string, delta: number) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  placeOrder: (orderData: Omit<Order, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  saveMilestoneRecord: (record: Omit<MilestoneRecord, 'id' | 'timestamp' | 'staffId'>) => Promise<void>;
  saveMilestoneTemplate: (template: MilestoneTemplate) => Promise<void>;
  deleteMilestoneTemplate: (id: string) => Promise<void>;
  addPayment: (payment: Omit<PaymentRecord, 'id' | 'qrCodeUrl' | 'verificationHash'>) => Promise<void>;
  addNotice: (title: string, content: string, type: NoticeType, target: NoticeTarget) => Promise<void>;
  replyToNotice: (noticeId: string, message: string) => Promise<void>;
  markNoticeAsViewed: (noticeId: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => {
  onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          set({ user: userData, isLoggedIn: true, view: 'app', activeTab: 'dashboard' });
        }
      } catch (err) {
        console.error("Auth sync error:", err);
      }
    } else {
      set({ user: null, isLoggedIn: false });
    }
  });

  return {
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    toggleTheme: () => set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return { theme: newTheme };
    }),
    user: null,
    isLoggedIn: false,
    view: 'landing',
    setView: (view) => set({ view }),
    isMobileMenuOpen: false,
    toggleMobileMenu: (open) => set((state) => ({ isMobileMenuOpen: open !== undefined ? open : !state.isMobileMenuOpen })),
    isNoticesOpen: false,
    toggleNotices: (open) => set((state) => ({ isNoticesOpen: open !== undefined ? open : !state.isNoticesOpen })),
    notifications: [],
    notify: (type, message, duration = 5000) => {
      const id = Math.random().toString(36).substring(7);
      set(state => ({ notifications: [...state.notifications, { id, type, message }] }));
      setTimeout(() => get().removeNotification(id), duration);
    },
    removeNotification: (id) => set(state => ({ notifications: state.notifications.filter(n => n.id !== id) })),
    settings: { positions: [], classes: [], feesAmount: 500, currentTerm: 'Term 1' },
    selectedStudentIdForLog: null,
    setSelectedStudentIdForLog: (id) => set({ selectedStudentIdForLog: id }),
    students: [],
    staff: [],
    parents: [],
    clinicalLogs: [],
    systemLogs: [],
    applications: [],
    studentApplications: [],
    shopItems: [],
    cart: [],
    orders: [],
    payments: [],
    milestoneRecords: [],
    milestoneTemplates: [],
    notices: [],
    login: async (role, credentials) => {
      const { email, pass } = credentials;
      const cleanEmail = email.toLowerCase().trim();
      const cleanPass = pass.trim();

      let authedUser: User | null = null;

      // 1. First attempt: standard Firebase Auth sign-in
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        const fbUser = userCredential.user;
        const userDocRef = doc(db, 'users', fbUser.uid);
        let userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          authedUser = userDoc.data() as User;
        } else {
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail), limit(1));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            authedUser = qSnap.docs[0].data() as User;
          }
        }
      } catch (authError: any) {
        // 2. If Firebase Auth sign-in failed, check if Firestore holds the updated/edited password set by Admin
        let foundDoc: any = null;
        let foundCollection = '';

        // Check users collection
        const usersQ = query(collection(db, 'users'), where('email', '==', cleanEmail), limit(1));
        const usersSnap = await getDocs(usersQ);
        if (!usersSnap.empty) {
          foundDoc = usersSnap.docs[0].data();
          foundCollection = 'users';
        }

        // Check staff collection
        if (!foundDoc) {
          const staffQ = query(collection(db, 'staff'), where('email', '==', cleanEmail), limit(1));
          const staffSnap = await getDocs(staffQ);
          if (!staffSnap.empty) {
            foundDoc = staffSnap.docs[0].data();
            foundCollection = 'staff';
          }
        }

        // Check parents collection
        if (!foundDoc) {
          const parentQ = query(collection(db, 'parents'), where('email', '==', cleanEmail), limit(1));
          const parentSnap = await getDocs(parentQ);
          if (!parentSnap.empty) {
            foundDoc = parentSnap.docs[0].data();
            foundCollection = 'parents';
          }
        }

        // Check students collection (matching email or student ID)
        if (!foundDoc) {
          const studentEmailQ = query(collection(db, 'students'), where('email', '==', cleanEmail), limit(1));
          const studentEmailSnap = await getDocs(studentEmailQ);
          if (!studentEmailSnap.empty) {
            foundDoc = studentEmailSnap.docs[0].data();
            foundCollection = 'students';
          } else {
            const studentIdMatch = cleanEmail.split('@')[0];
            const studentQ = query(collection(db, 'students'), where('id', '==', studentIdMatch.toUpperCase()), limit(1));
            const studentSnap = await getDocs(studentQ);
            if (!studentSnap.empty) {
              foundDoc = studentSnap.docs[0].data();
              foundCollection = 'students';
            }
          }
        }

        // Check if the record found has matching password or default '000000'
        const validPassword = foundDoc?.password || "000000";
        if (foundDoc && (foundDoc.password === cleanPass || cleanPass === validPassword)) {
          // The password set by Admin matches!
          await syncAuthPassword(cleanEmail, cleanPass, [foundDoc.password, "000000", "pppppp", "password"]);
          
          try {
            const retryCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
            const retryFbUser = retryCred.user;
            const retryUserDoc = await getDoc(doc(db, 'users', retryFbUser.uid));
            if (retryUserDoc.exists()) {
              authedUser = retryUserDoc.data() as User;
            }
          } catch (retryErr) {
            console.warn("Firebase Auth retry failed, using verified Firestore record:", retryErr);
          }

          if (!authedUser && foundDoc) {
            const uid = foundDoc.firebaseUid || foundDoc.id || 'user_' + Date.now();
            authedUser = {
              id: uid,
              name: foundDoc.name || foundDoc.fullName || 'User',
              email: cleanEmail,
              role: foundDoc.role || (foundCollection === 'students' ? 'STUDENT' : foundCollection === 'parents' ? 'PARENT' : foundCollection === 'staff' ? 'SPECIALIST' : 'SUPER_ADMIN'),
              avatar: foundDoc.imageUrl || foundDoc.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${foundDoc.name || foundDoc.fullName || 'User'}`
            };
            await setDoc(doc(db, 'users', uid), authedUser, { merge: true });
          }
        } else {
          throw authError;
        }
      }

      if (!authedUser) {
        await signOut(auth);
        throw new Error('PROFILE_NOT_FOUND');
      }

      // Allow SPECIALIST and ADMIN_SUPPORT to cross-authenticate
      const isSuperAdminOrSupport = (authedUser.role === 'SUPER_ADMIN' || authedUser.role === 'ADMIN_SUPPORT') &&
                                    (role === 'SUPER_ADMIN' || role === 'ADMIN_SUPPORT');
      const isSpecialistOrSupport = (authedUser.role === 'SPECIALIST' || authedUser.role === 'ADMIN_SUPPORT') &&
                                   (role === 'SPECIALIST' || role === 'ADMIN_SUPPORT');
      const isSuperAdmin = authedUser.role === 'SUPER_ADMIN';

      if (authedUser.role !== role && !isSuperAdminOrSupport && !isSpecialistOrSupport && !isSuperAdmin) {
        await signOut(auth);
        throw new Error('ROLE_MISMATCH');
      }

      set({ user: authedUser, isLoggedIn: true, view: 'app', activeTab: 'dashboard' });
      get().notify('success', 'Welcome back!');
    },
    logout: async () => {
      await signOut(auth);
      set({ isLoggedIn: false, view: 'landing', user: null, isMobileMenuOpen: false, cart: [] });
      get().notify('info', 'Logged out.');
    },
    activeTab: 'dashboard',
    setActiveTab: (activeTab) => set({ activeTab, isMobileMenuOpen: false }),
    initializeData: () => {
      import('../utils/seeder').then(m => m.autoSeed(secondaryAuth));

      onSnapshot(query(collection(db, 'students'), orderBy('fullName')), (snapshot) => {
        set({ students: snapshot.docs.map(doc => ({ ...doc.data() } as Student)) });
      });
      onSnapshot(query(collection(db, 'staff'), orderBy('fullName')), (snapshot) => {
        set({ staff: snapshot.docs.map(doc => ({ ...doc.data() } as Staff)) });
      });
      onSnapshot(query(collection(db, 'parents'), orderBy('name')), (snapshot) => {
        set({ parents: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Parent)) });
      });
      onSnapshot(query(collection(db, 'clinical_logs'), orderBy('date', 'desc'), limit(100)), (snapshot) => {
        set({ clinicalLogs: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SessionLog)) });
      });
      onSnapshot(query(collection(db, 'shop_items'), orderBy('name')), (snapshot) => {
        set({ shopItems: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ShopItem)) });
      });
      onSnapshot(query(collection(db, 'milestone_records'), orderBy('timestamp', 'desc')), (snapshot) => {
        set({ milestoneRecords: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MilestoneRecord)) });
      });
      onSnapshot(query(collection(db, 'milestone_templates'), orderBy('label')), (snapshot) => {
        set({ milestoneTemplates: snapshot.docs.map(doc => ({ ...doc.data() } as MilestoneTemplate)) });
      });
      onSnapshot(query(collection(db, 'payments'), orderBy('timestamp', 'desc')), (snapshot) => {
        set({ payments: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PaymentRecord)) });
      });
      onSnapshot(query(collection(db, 'notices'), orderBy('timestamp', 'desc')), (snapshot) => {
        set({ notices: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notice)) });
      });
      onSnapshot(query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(200)), (snapshot) => {
        set({ systemLogs: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SystemLog)) });
      });
      onSnapshot(query(collection(db, 'orders'), orderBy('timestamp', 'desc')), (snapshot) => {
        set({ orders: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order)) });
      });
      onSnapshot(query(collection(db, 'applications'), orderBy('timestamp', 'desc')), (snapshot) => {
        set({ applications: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Application)) });
      });
      onSnapshot(query(collection(db, 'student_applications'), orderBy('timestamp', 'desc')), (snapshot) => {
        set({ studentApplications: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StudentApplication)) });
      });
      onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
        if (snapshot.exists()) set({ settings: snapshot.data() as SystemSettings });
      });
    },
    updateSettings: async (newSettings) => {
      try {
        const oldSettings = get().settings;
        const settingsRef = doc(db, 'settings', 'global');
        await setDoc(settingsRef, { ...oldSettings, ...newSettings }, { merge: true });

        // Automated notice for next term start
        if (newSettings.nextTermStartDate && newSettings.nextTermStartDate !== oldSettings.nextTermStartDate) {
          await get().addNotice(
            "Upcoming Term Schedule", 
            `Official announcement: The next school term is scheduled to begin on ${new Date(newSettings.nextTermStartDate).toLocaleDateString(undefined, { dateStyle: 'full' })}. Please ensure all preparations are complete.`,
            "General",
            "ALL"
          );
        }
      } catch (err) { get().notify('error', 'Update failed.'); }
    },
    addStudent: async (studentData) => {
      try {
        const fullName = `${studentData.firstName} ${studentData.lastName}`;
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef);
        const snapshot = await getDocs(q);
        const count = snapshot.size + 1;
        const formattedId = `DD${count.toString().padStart(3, '0')}`;
        
        const studentEmail = `${formattedId.toLowerCase()}@defineddomain.com`;
        const studentPass = studentData.password && studentData.password.trim().length >= 6 ? studentData.password.trim() : "000000";
        const finalImageUrl = extractSrcFromHtml(studentData.imageUrl || '');
        let studentUid = '';

        // 1. Student Account
        try {
          const studentUserCredential = await createUserWithEmailAndPassword(secondaryAuth, studentEmail, studentPass);
          studentUid = studentUserCredential.user.uid;
        } catch (err: any) {
          if (err.code === 'auth/email-already-in-use') {
            try {
              const cred = await signInWithEmailAndPassword(secondaryAuth, studentEmail, studentPass);
              studentUid = cred.user.uid;
            } catch (sErr) {
              const cred = await signInWithEmailAndPassword(secondaryAuth, studentEmail, "000000");
              studentUid = cred.user.uid;
              await updatePassword(secondaryAuth.currentUser!, studentPass);
            }
          } else { throw err; }
        }

        if (studentUid) {
          const finalStudent = { 
            ...studentData, 
            imageUrl: finalImageUrl, 
            fullName, 
            id: formattedId, 
            email: studentEmail,
            password: studentPass,
            firebaseUid: studentUid, 
            totalPaid: 0 
          };
          await setDoc(doc(db, 'students', studentUid), finalStudent);
          await setDoc(doc(db, 'users', studentUid), { 
            id: studentUid, 
            name: fullName, 
            email: studentEmail, 
            password: studentPass,
            role: 'STUDENT', 
            avatar: finalImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}` 
          });
        }
        
        // 2. Parent Account
        const parentEmail = studentData.parentEmail.toLowerCase().trim();
        const parentPass = studentData.parentPassword && studentData.parentPassword.trim().length >= 6 ? studentData.parentPassword.trim() : "000000";
        let parentUid = '';

        try {
          const parentUserCredential = await createUserWithEmailAndPassword(secondaryAuth, parentEmail, parentPass);
          parentUid = parentUserCredential.user.uid;
        } catch (err: any) {
          if (err.code === 'auth/email-already-in-use') {
            try {
              const cred = await signInWithEmailAndPassword(secondaryAuth, parentEmail, parentPass);
              parentUid = cred.user.uid;
            } catch (sErr) {
              const cred = await signInWithEmailAndPassword(secondaryAuth, parentEmail, "000000");
              parentUid = cred.user.uid;
              await updatePassword(secondaryAuth.currentUser!, parentPass);
            }
          } else { throw err; }
        }

        if (parentUid) {
          const parentRecord: Parent = { 
            id: parentUid, 
            name: studentData.parentName, 
            email: parentEmail, 
            phone: studentData.parentPhone, 
            address: studentData.homeAddress, 
            studentId: formattedId, 
            studentFullName: fullName, 
            firebaseUid: parentUid,
            password: parentPass
          };
          await setDoc(doc(db, 'parents', parentUid), parentRecord);
          await setDoc(doc(db, 'users', parentUid), { 
            id: parentUid, 
            name: studentData.parentName, 
            email: parentEmail, 
            password: parentPass,
            role: 'PARENT', 
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentData.parentName}` 
          });
        }
        
        await signOut(secondaryAuth);
        get().notify('success', `Student account created. Parent account has also been created for ${studentData.parentName}.`);
      } catch (err: any) { 
        await signOut(secondaryAuth);
        get().notify('error', err.message);
      }
    },
    updateStudent: async (uid, data) => {
      try {
        const processed = { ...data };
        if (data.imageUrl) processed.imageUrl = extractSrcFromHtml(data.imageUrl);

        const studentRef = doc(db, 'students', uid);
        const studentSnap = await getDoc(studentRef);
        const existingStudent = studentSnap.exists() ? studentSnap.data() as Student : null;

        const studentEmail = (processed.email || existingStudent?.email || (existingStudent?.id ? `${existingStudent.id.toLowerCase()}@defineddomain.com` : '')).toLowerCase().trim();
        const studentPass = processed.password?.trim();

        if (studentPass && studentEmail) {
          await syncAuthPassword(studentEmail, studentPass, [existingStudent?.password || '', '000000']);
          await setDoc(doc(db, 'users', uid), { password: studentPass }, { merge: true });
        }

        const parentEmail = (processed.parentEmail || existingStudent?.parentEmail || '').toLowerCase().trim();
        const parentPass = processed.parentPassword?.trim();
        if (parentPass && parentEmail) {
          const parentQ = query(collection(db, 'parents'), where('studentId', '==', existingStudent?.id || ''), limit(1));
          const parentSnap = await getDocs(parentQ);
          if (!parentSnap.empty) {
            const parentDoc = parentSnap.docs[0];
            await updateDoc(doc(db, 'parents', parentDoc.id), { password: parentPass });
            await setDoc(doc(db, 'users', parentDoc.id), { password: parentPass }, { merge: true });
            await syncAuthPassword(parentEmail, parentPass, [parentDoc.data()?.password || '', '000000']);
          }
        }

        await updateDoc(studentRef, processed);
        get().notify('success', 'Student profile updated.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    deleteStudent: async (uid) => {
      try {
        await deleteDoc(doc(db, 'students', uid));
        await deleteDoc(doc(db, 'users', uid));
        get().notify('success', 'Student removed.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    addStaff: async (staffData) => {
      try {
        const fullName = `${staffData.firstName} ${staffData.lastName}`;
        const email = staffData.email.toLowerCase().trim();
        const staffPassword = staffData.password && staffData.password.trim().length >= 6 ? staffData.password.trim() : "000000";
        const finalImageUrl = extractSrcFromHtml(staffData.imageUrl || '');
        let staffUid = '';

        try {
          const staffCredential = await createUserWithEmailAndPassword(secondaryAuth, email, staffPassword);
          staffUid = staffCredential.user.uid;
        } catch (err: any) {
          if (err.code === 'auth/email-already-in-use') {
            try {
              const cred = await signInWithEmailAndPassword(secondaryAuth, email, staffPassword);
              staffUid = cred.user.uid;
            } catch (sErr) {
              const cred = await signInWithEmailAndPassword(secondaryAuth, email, "000000");
              staffUid = cred.user.uid;
              await updatePassword(secondaryAuth.currentUser!, staffPassword);
            }
          } else { throw err; }
        }

        if (staffUid) {
          await setDoc(doc(db, 'staff', staffUid), { 
            ...staffData, 
            password: staffPassword,
            imageUrl: finalImageUrl, 
            fullName, 
            id: staffUid, 
            firebaseUid: staffUid 
          });
          await setDoc(doc(db, 'users', staffUid), { 
            id: staffUid, 
            name: fullName, 
            email: email, 
            password: staffPassword,
            role: staffData.role, 
            avatar: finalImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}` 
          });
          await signOut(secondaryAuth);
          get().notify('success', `Staff member registered successfully.`);
        }
      } catch (err: any) { 
        await signOut(secondaryAuth);
        get().notify('error', err.message); 
      }
    },
    updateStaff: async (id, data) => {
      try {
        const processed = { ...data };
        if (data.imageUrl) processed.imageUrl = extractSrcFromHtml(data.imageUrl);

        const staffRef = doc(db, 'staff', id);
        const staffSnap = await getDoc(staffRef);
        const existingStaff = staffSnap.exists() ? staffSnap.data() as Staff : null;
        const email = (processed.email || existingStaff?.email || '').toLowerCase().trim();
        const newPassword = processed.password?.trim();

        if (newPassword && email) {
          await syncAuthPassword(email, newPassword, [existingStaff?.password || '', '000000']);
        }

        await updateDoc(staffRef, processed);

        const userRef = doc(db, 'users', id);
        const userUpdate: any = {};
        if (processed.firstName || processed.lastName) {
          const fn = processed.firstName || existingStaff?.firstName || '';
          const ln = processed.lastName || existingStaff?.lastName || '';
          userUpdate.name = `${fn} ${ln}`.trim();
        }
        if (processed.email) userUpdate.email = processed.email.toLowerCase().trim();
        if (processed.role) userUpdate.role = processed.role;
        if (processed.password) userUpdate.password = processed.password.trim();
        if (processed.imageUrl) userUpdate.avatar = processed.imageUrl;

        if (Object.keys(userUpdate).length > 0) {
          await setDoc(userRef, userUpdate, { merge: true });
        }

        get().notify('success', 'Staff profile updated.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    deleteStaff: async (id) => {
      try {
        await deleteDoc(doc(db, 'staff', id));
        await deleteDoc(doc(db, 'users', id));
        get().notify('success', 'Staff removed.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    updateUserProfile: async ({ name, password }) => {
      const fbUser = auth.currentUser;
      if (!fbUser) return;
      try {
        if (name) {
          await updateProfile(fbUser, { displayName: name });
          await updateDoc(doc(db, 'users', fbUser.uid), { name });
          set(state => ({ user: state.user ? { ...state.user, name } : null }));
        }
        if (password) {
          await updatePassword(fbUser, password);
          await updateDoc(doc(db, 'users', fbUser.uid), { password });
          
          // Also update corresponding staff/student/parent doc if exists
          try {
            const staffDoc = await getDoc(doc(db, 'staff', fbUser.uid));
            if (staffDoc.exists()) await updateDoc(doc(db, 'staff', fbUser.uid), { password });
          } catch(e) {}
          try {
            const studentDoc = await getDoc(doc(db, 'students', fbUser.uid));
            if (studentDoc.exists()) await updateDoc(doc(db, 'students', fbUser.uid), { password });
          } catch(e) {}
          try {
            const parentDoc = await getDoc(doc(db, 'parents', fbUser.uid));
            if (parentDoc.exists()) await updateDoc(doc(db, 'parents', fbUser.uid), { password });
          } catch(e) {}
        }
        get().notify('success', 'Profile updated.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    addSystemLog: async (action, details) => {
      const u = get().user;
      try {
        await addDoc(collection(db, 'logs'), { userId: u?.id || 'system', userName: u?.name || 'System', action, details, timestamp: new Date().toISOString() });
      } catch (err) { console.error(err); }
    },
    addClinicalLog: async (logData) => {
      const u = get().user;
      try {
        await addDoc(collection(db, 'clinical_logs'), { ...logData, staffId: u?.id || 'unknown' });
        const student = get().students.find(item => item.id === logData.studentId);
        const parent = get().parents.find(item => item.studentId === logData.studentId);
        if (student && parent) {
          try {
            await addDoc(collection(db, 'notices'), {
              title: `New record for ${student.fullName}`,
              content: `${u?.name || 'A teacher'} added a new learning record for ${student.fullName}. Open Reports to view the full details.`,
              type: 'Record',
              target: 'PARENT',
              recipientUserId: parent.firebaseUid || parent.id,
              studentId: student.id,
              recordType: 'Lesson',
              authorId: u?.id || 'system',
              authorName: u?.name || 'School team',
              timestamp: new Date().toISOString(),
              replies: [],
              views: []
            });
          } catch (noticeError) {
            console.error('Parent record notification failed:', noticeError);
          }
        }
        get().notify('success', 'Progress saved.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    submitApplication: async (appData) => {
      try {
        await addDoc(collection(db, 'applications'), { ...appData, status: 'Pending', timestamp: new Date().toISOString() });
        get().notify('success', 'Application sent.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    updateApplicationStatus: async (id, status) => {
      try {
        await updateDoc(doc(db, 'applications', id), { status });
        get().notify('success', 'Status updated.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    submitStudentApplication: async (appData) => {
      try {
        await addDoc(collection(db, 'student_applications'), { ...appData, status: 'Pending', timestamp: new Date().toISOString() });
        get().notify('success', 'Application submitted.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    updateStudentApplicationStatus: async (id, status, reply) => {
      try {
        await updateDoc(doc(db, 'student_applications', id), { status, adminReply: reply });
        get().notify('success', `Status updated.`);
      } catch (err: any) { get().notify('error', err.message); }
    },
    addShopItem: async (item) => {
      try {
        await addDoc(collection(db, 'shop_items'), item);
        get().notify('success', 'Item added.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    deleteShopItem: async (id) => {
      try {
        await deleteDoc(doc(db, 'shop_items', id));
        get().notify('success', 'Item removed.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    addToCart: (item) => {
      const existing = get().cart.find(i => i.id === item.id);
      if (existing) {
        get().updateCartQuantity(existing.cartId, 1);
        return;
      }
      const cartId = Math.random().toString(36).substring(7);
      set(state => ({ cart: [...state.cart, { ...item, cartId, quantity: 1 }] }));
    },
    updateCartQuantity: (cartId, delta) => {
      set(state => ({ cart: state.cart.map(i => i.cartId === cartId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i) }));
    },
    removeFromCart: (cartId) => {
      set(state => ({ cart: state.cart.filter(i => i.cartId !== cartId) }));
    },
    clearCart: () => set({ cart: [] }),
    placeOrder: async (orderData) => {
      try {
        await addDoc(collection(db, 'orders'), { ...orderData, status: 'Uncollected', timestamp: new Date().toISOString() });
        get().clearCart();
        get().notify('success', 'Order placed.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    updateOrderStatus: async (orderId, status) => {
      try {
        await updateDoc(doc(db, 'orders', orderId), { status });
        get().notify('success', 'Status updated.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    saveMilestoneRecord: async (record) => {
      try {
        await addDoc(collection(db, 'milestone_records'), {
          ...record,
          staffId: get().user?.id || 'system',
          timestamp: new Date().toISOString()
        });
        const u = get().user;
        const student = get().students.find(item => item.id === record.studentId);
        const parent = get().parents.find(item => item.studentId === record.studentId);
        if (student && parent) {
          try {
            await addDoc(collection(db, 'notices'), {
              title: `New assessment for ${student.fullName}`,
              content: `${u?.name || 'A teacher'} completed a developmental assessment for ${student.fullName}. Open Reports to view the results.`,
              type: 'Record',
              target: 'PARENT',
              recipientUserId: parent.firebaseUid || parent.id,
              studentId: student.id,
              recordType: 'Assessment',
              authorId: u?.id || 'system',
              authorName: u?.name || 'School team',
              timestamp: new Date().toISOString(),
              replies: [],
              views: []
            });
          } catch (noticeError) {
            console.error('Parent assessment notification failed:', noticeError);
          }
        }
        get().notify('success', 'Record saved.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    saveMilestoneTemplate: async (template) => {
      try {
        await setDoc(doc(db, 'milestone_templates', template.id), template);
      } catch (err: any) { get().notify('error', err.message); }
    },
    deleteMilestoneTemplate: async (id) => {
      try {
        await deleteDoc(doc(db, 'milestone_templates', id));
        get().notify('success', 'Template removed.');
      } catch (err: any) { get().notify('error', err.message); }
    },
    addPayment: async (payment) => {
      try {
        const hash = Math.random().toString(36).substring(2, 15);
        const qrCodeUrl = `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent(hash)}`;
        await addDoc(collection(db, 'payments'), { ...payment, verificationHash: hash, qrCodeUrl: qrCodeUrl, timestamp: new Date().toISOString() });
      } catch (err: any) { get().notify('error', err.message); }
    },
    addNotice: async (title, content, type, target) => {
      const u = get().user;
      if (!u) return;
      try {
        await addDoc(collection(db, 'notices'), {
          title, content, type, target,
          authorId: u.id, authorName: u.name,
          timestamp: new Date().toISOString(),
          replies: [],
          views: []
        });
      } catch (err: any) { get().notify('error', 'Notice failed.'); }
    },
    replyToNotice: async (noticeId, message) => {
      const u = get().user;
      if (!u) return;
      try {
        const reply = {
          id: Math.random().toString(36).substring(7),
          userId: u.id, userName: u.name,
          message, timestamp: new Date().toISOString()
        };
        await updateDoc(doc(db, 'notices', noticeId), { replies: arrayUnion(reply) });
      } catch (err: any) { get().notify('error', 'Reply failed.'); }
    },
    markNoticeAsViewed: async (noticeId) => {
      const u = get().user;
      if (!u) return;
      const noticeRef = doc(db, 'notices', noticeId);
      const noticeDoc = await getDoc(noticeRef);
      if (noticeDoc.exists()) {
        const data = noticeDoc.data() as Notice;
        const alreadyViewed = (data.views || []).some(v => v.userId === u.id);
        if (!alreadyViewed) {
          const view = { userId: u.id, userName: u.name, timestamp: new Date().toISOString() };
          await updateDoc(noticeRef, { views: arrayUnion(view) });
        }
      }
    }
  };
});
