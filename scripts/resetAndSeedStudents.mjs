import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAJleJuSyL7GvqpcvTsZNnVYRCMmqJNR8o",
  authDomain: "defineddomnain.firebaseapp.com",
  projectId: "defineddomnain",
  storageBucket: "defineddomnain.firebasestorage.app",
  messagingSenderId: "546744382707",
  appId: "1:546744382707:web:9d6f21fc8bf3f7b2a27386"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Category mapping helper
const formatCategory = (code) => {
  const map = {
    'AU': 'AU - Autism',
    'CP': 'CP - Cerebral Palsy',
    'ID': 'ID - Intellectual Disability',
    'TR': 'TR - Trisomy 21',
    'DE': 'DE - Developmental Delay',
    '-': 'General'
  };
  return map[code] || code || 'General';
};

// Student List 4 from defined specifications
const RAW_STUDENT_LIST = [
  { no: 2, name: 'Tinotenda Chidananzi', classCode: 'DDM', idNo: '002', category: 'ID' },
  { no: 3, name: 'Ruziro Benhura', classCode: 'DDF', idNo: '003', category: 'AU' },
  { no: 5, name: 'Genius Muchandibaya', classCode: 'DDM', idNo: '005', category: 'CP' },
  { no: 6, name: 'Tafara Musodo', classCode: 'DDM', idNo: '006', category: 'CP' },
  { no: 9, name: 'Wverelaton Nyazika', classCode: 'DDM', idNo: '009', category: 'CP' },
  { no: 13, name: 'Nyasha Chitoteinbe', classCode: 'DDM', idNo: '013', category: 'AU' },
  { no: 14, name: 'Elshaddai Gonese', classCode: 'DDF', idNo: '014', category: 'TR' },
  { no: 15, name: 'Shekairah Mashamba', classCode: 'DDM', idNo: '015', category: 'AU' },
  { no: 16, name: 'Anotidaishe Chipendo', classCode: 'DDF', idNo: '016', category: 'CP' },
  { no: 19, name: 'Paige Taraguisa', classCode: 'DDM', idNo: '019', category: 'AU' },
  { no: 20, name: 'Ranga Njiye', classCode: 'DDM', idNo: '020', category: 'DE' },
  { no: 21, name: 'Munyaradzi Nyakamba', classCode: 'DDM', idNo: '021', category: 'AU' },
  { no: 22, name: 'Nyasha Sakala', classCode: 'DDM', idNo: '022', category: 'AU' },
  { no: 23, name: 'Tafara Chigodoro', classCode: 'DDM', idNo: '023', category: 'TR' },
  { no: 24, name: 'Ryan Chibuda', classCode: 'DDM', idNo: '024', category: 'AU' },
  { no: 25, name: 'Abiel Gwarena', classCode: 'DDM', idNo: '025', category: 'AU' },
  { no: 26, name: 'Anashe Munyangadzi', classCode: 'DDF', idNo: '026', category: 'AU' },
  { no: 27, name: 'Lawrence Matukutire', classCode: 'DDM', idNo: '027', category: 'ID' },
  { no: 28, name: 'Takunda Mutimuri', classCode: 'DDM', idNo: '028', category: 'CP' },
  { no: 29, name: 'Mukundi Tahaona', classCode: 'DDM', idNo: '029', category: 'AU' },
  { no: 31, name: 'Ellen Machauda', classCode: 'DDF', idNo: '031', category: 'CP' },
  { no: 32, name: 'Shallom Charamba', classCode: 'DDF', idNo: '032', category: 'AU' },
  { no: 33, name: 'Anesu Machipamba', classCode: 'DDF', idNo: '033', category: '-' },
  { no: 34, name: 'Tinaye Musingafi', classCode: 'DDM', idNo: '034', category: '-' },
  { no: 35, name: 'Matipa Chigumbu', classCode: 'DDM', idNo: '035', category: '-' },
  { no: 36, name: 'Tadiwanashe Zvitambo', classCode: 'DDF', idNo: '036', category: '-' },
  { no: 37, name: 'Jerry Zhou', classCode: 'DDM', idNo: '037', category: '-' },
  { no: 38, name: 'Shalom Kachamba', classCode: 'DDF', idNo: '038', category: '-' },
  { no: 39, name: 'Nomsa Salani', classCode: 'DDF', idNo: '039', category: '-' }
];

export async function resetAndSeedStudents() {
  console.log('=====================================================');
  console.log('🔄 Starting Student Records Reset & Database Seeding...');
  console.log('=====================================================\n');

  // 1. Fetch current students
  const studentsSnap = await getDocs(collection(db, 'students'));
  console.log(`📋 Found ${studentsSnap.size} existing student records.`);

  const studentUids = new Set();
  const studentIds = new Set();

  studentsSnap.forEach((docSnap) => {
    studentUids.add(docSnap.id);
    const data = docSnap.data();
    if (data.id) studentIds.add(data.id.toUpperCase());
  });

  // 2. Delete all existing records from 'students' collection
  console.log('🗑️  Deleting students collection records...');
  for (const docSnap of studentsSnap.docs) {
    await deleteDoc(docSnap.ref);
  }
  console.log('✅ Students collection cleared.');

  // 3. Delete student-associated users from 'users' collection
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`📋 Scanning ${usersSnap.size} users in Firestore...`);
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    if (userData.role === 'STUDENT' || studentUids.has(userDoc.id)) {
      console.log(`   - Deleting student user record: ${userData.email || userDoc.id} (${userData.name})`);
      await deleteDoc(userDoc.ref);
    }
  }
  console.log('✅ Student user profiles cleared.');

  // 4. Delete old student-associated parents
  const parentsSnap = await getDocs(collection(db, 'parents'));
  console.log(`📋 Clearing ${parentsSnap.size} parent records...`);
  for (const parentDoc of parentsSnap.docs) {
    await deleteDoc(parentDoc.ref);
  }
  // Also clean up any users with PARENT role
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    if (userData.role === 'PARENT') {
      await deleteDoc(userDoc.ref);
    }
  }
  console.log('✅ Parents records cleared.');

  // 5. Delete student clinical logs, milestone records, payments, orders
  const collectionsToClean = [
    'clinical_logs',
    'milestone_records',
    'payments',
    'orders'
  ];

  for (const col of collectionsToClean) {
    const snap = await getDocs(collection(db, col));
    console.log(`🗑️  Clearing ${snap.size} records from '${col}'...`);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
    console.log(`✅ Collection '${col}' cleared.`);
  }

  // 6. Insert new students from Student List 4
  console.log(`\n🌱 Seeding ${RAW_STUDENT_LIST.length} new students from Student List 4...`);

  for (const item of RAW_STUDENT_LIST) {
    const formattedId = `DD${item.idNo}`;
    const nameParts = item.name.trim().split(/\s+/);
    const firstName = nameParts[0] || item.name;
    const lastName = nameParts.slice(1).join(' ') || '';
    const fullName = item.name.trim();
    const gender = item.classCode === 'DDF' ? 'Female' : 'Male';
    const email = `${formattedId.toLowerCase()}@defineddomain.com`;
    const password = '000000';
    const parentEmail = `parent.${formattedId.toLowerCase()}@defineddomain.com`;
    const parentPhone = '+263 775 000 000';
    const parentName = `Guardian of ${fullName}`;
    const categoryName = formatCategory(item.category);

    // Generate a deterministic or auto doc id for student
    const studentDocId = `student_${formattedId.toLowerCase()}`;
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;

    const studentRecord = {
      id: formattedId,
      firstName,
      lastName,
      fullName,
      gender,
      assignedClass: item.classCode,
      diagnosis: categoryName,
      dob: '2018-01-01',
      enrollmentDate: '2026-09-01',
      termEntry: 'Term 3 2026',
      parentName,
      parentPhone,
      parentEmail,
      parentPassword: password,
      homeAddress: 'Masvingo, Zimbabwe',
      medicalRecords: 'Standard medical record',
      socialHistory: 'Enrolled at Defined Domains Inclusive School',
      targetBehaviors: 'Developmental milestones and inclusive learning',
      uniformSizes: 'Medium',
      assignedStaffId: 'unassigned',
      imageUrl: avatarUrl,
      firebaseUid: studentDocId,
      totalPaid: 0,
      email,
      password,
      idCardIssuedAt: '2026-09-01T00:00:00.000Z',
      idCardExpiresAt: '2028-09-01T00:00:00.000Z',
      idCardAcademicYear: '2026',
    };

    // Save student document in 'students'
    await setDoc(doc(db, 'students', studentDocId), studentRecord);

    // Save student user record in 'users'
    await setDoc(doc(db, 'users', studentDocId), {
      id: studentDocId,
      name: fullName,
      email,
      password,
      role: 'STUDENT',
      avatar: avatarUrl
    });

    // Save parent record in 'parents' and 'users'
    const parentDocId = `parent_${formattedId.toLowerCase()}`;
    const parentRecord = {
      id: parentDocId,
      name: parentName,
      email: parentEmail,
      phone: parentPhone,
      address: 'Masvingo, Zimbabwe',
      studentId: formattedId,
      studentFullName: fullName,
      firebaseUid: parentDocId,
      password
    };

    await setDoc(doc(db, 'parents', parentDocId), parentRecord);
    await setDoc(doc(db, 'users', parentDocId), {
      id: parentDocId,
      name: parentName,
      email: parentEmail,
      password,
      role: 'PARENT',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(parentName)}`
    });

    console.log(`   ✨ [${item.no}] Added: ${formattedId} - ${fullName} (${item.classCode}) [${categoryName}]`);
  }

  console.log('\n=====================================================');
  console.log('🎉 Reset and Seeding completed successfully!');
  console.log(`Total students added: ${RAW_STUDENT_LIST.length}`);
  console.log('=====================================================\n');
}

// If invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetAndSeedStudents()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error resetting and seeding students:', err);
      process.exit(1);
    });
}
