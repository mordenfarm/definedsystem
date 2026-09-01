
import { useStore, MilestoneTemplate } from '../store/useStore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, Auth } from 'firebase/auth';
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';

const ECDC_FULL_DATA: MilestoneTemplate[] = [
  {
    id: 'm-1-3',
    label: '1 to 3 Months',
    minAge: 1,
    maxAge: 3,
    sections: [
      { title: 'Movement', items: [
        'Raises head and cheek when lying on stomach (3 mos.)', 
        'Supports upper body with arms when lying on stomach (3 mos.)', 
        'Stretches legs out when lying on stomach or back (2-3 mos.)', 
        'Opens and shuts hands (2-3 mos.)', 
        'Pushes down on his legs when his feet are placed on firm surface (3 mos.)'
      ] },
      { title: 'Visual', items: [
        'Watches face intently (2-3 mos.)', 
        'Follows moving objects (2 mos.)', 
        'Recognizes familiar objects and people at a distance (3 mos.)', 
        'Starts using hands and eyes in coordination (3 mos.)'
      ] },
      { title: 'Hearing and Speech', items: [
        'Smiles at the sound of voice (2-3 mos.)', 
        'Cooing noises; vocal play (begins at 3 mos.)', 
        'Attends to sound (1-3 mos.)', 
        'Startles to loud noise (1-3 mos.)'
      ] },
      { title: 'Social/Emotional', items: [
        'Begins to develop a social smile (1-3 mos.)', 
        'Enjoys playing with other people and may cry when playing stops (2-3 mos.)', 
        'Becomes more communicative and expressive with face and body (2-3 mos.)', 
        'Imitates some movements and facial expressions'
      ] }
    ],
    redFlags: [
      'Doesn’t seem to respond to loud noises', 
      'Doesn’t follow moving objects with eyes by 2 to 3 months', 
      'Doesn’t smile at the sound of your voice by 2 months', 
      'Doesn’t grasp and hold objects by 3 months', 
      'Doesn’t smile at people by 3 months', 
      'Cannot support head well at 3 months',
      'Doesn’t reach for and grasp toys by 3 to 4 months',
      'Doesn’t bring objects to mouth by 4 months',
      'Doesn’t push down with legs when feet are placed on a firm surface by 4 months'
    ]
  },
  {
    id: 'm-4-7',
    label: '4 to 7 Months',
    minAge: 4,
    maxAge: 7,
    sections: [
      { title: 'Movement', items: [
        'Pushes up on extended arms (5 mos.)', 
        'Pulls to sitting with no head lag (5 mos.)', 
        'Sits with support of his hands (5-6 mos.)', 
        'Sits unsupported for short periods (6-8 mos.)', 
        'Supports whole weight on legs (6-7 mos.)', 
        'Grasps feet (6 mos.)',
        'Transfers objects from hand to hand (6-7 mos.)'
      ] },
      { title: 'Visual', items: [
        'Looks for toy beyond tracking range (5-6 mos.)', 
        'Tracks moving objects with ease (4-7 mos.)', 
        'Grasps objects dangling in front of him (5-6 mos.)', 
        'Looks for fallen toys (5-7 mos.)'
      ] },
      { title: 'Language', items: [
        'Distinguishes emotions by tone of voice (4-7 mos.)', 
        'Responds to sound by making sounds (4-6 mos.)', 
        'Uses voice to express joy and displeasure (4-6 mos.)', 
        'Syllable repetition begins (5-7 mos.)'
      ] },
      { title: 'Cognitive', items: [
        'Finds partially hidden objects (6-7 mos.)', 
        'Explores with hands and mouth (4-7 mos.)', 
        'Struggles to get objects that are out of reach (5-7 mos.)'
      ] }
    ],
    redFlags: [
      'Seems very stiff, tight muscles', 
      'Seems very floppy, like a rag doll', 
      'Head still flops back when body is pulled to sitting position', 
      'Shows no affection for the person who cares for them', 
      'Does not turn head to locate sounds by 4 months',
      'Doesn’t roll over by 6 months',
      'Cannot sit with help by 6 months',
      'Does not bear some weight on legs by 5 months'
    ]
  },
  {
    id: 'm-8-11',
    label: '8 to 11 Months',
    minAge: 8,
    maxAge: 11,
    sections: [
      { title: 'Movement', items: [
        'Gets to sitting position without assistance (8-10 mos.)', 
        'Crawls forward on belly', 
        'Assumes hand and knee position', 
        'Creeps on hands and knees', 
        'Gets from sitting to crawling or prone position (10-11 mos.)', 
        'Pulls self up to standing position', 
        'Walks holding on to furniture', 
        'Stands momentarily without support'
      ] },
      { title: 'Hand and Finger Skills', items: [
        'Uses pincer grasp (thumb and index) (7-10 mos.)', 
        'Bangs two one-inch cubes together', 
        'Puts objects into container (10-11 mos.)', 
        'Takes objects out of container (10-11 mos.)', 
        'Pokes with index finger'
      ] },
      { title: 'Cognitive', items: [
        'Explores objects by shaking, banging, throwing (8-10 mos.)', 
        'Finds hidden objects easily (10-11 mos.)', 
        'Looks at correct picture when image is named', 
        'Imitates gestures (9-11 mos.)'
      ] },
      { title: 'Language', items: [
        'Responds to simple verbal requests', 
        'Responds to “no”', 
        'Makes simple gestures such as shaking head for no', 
        'Babbles with inflection (8-10 mos.)', 
        'Says “dada” and “mama” for specific person (11 mos.)'
      ] }
    ],
    redFlags: [
      'Does not crawl', 
      'Drags one side of body while crawling', 
      'Cannot stand when supported', 
      'Does not search for objects that are hidden (10-11 mos.)', 
      'Says no single words (“mama” or “dada”)', 
      'Does not learn to use gestures such as waving or shaking head', 
      'Does not sit steadily by 10 months'
    ]
  },
  {
    id: 'm-1-2y',
    label: '1 to 2 Years',
    minAge: 12,
    maxAge: 24,
    sections: [
      { title: 'Movement', items: [
        'Walks alone (12-16 mos.)', 
        'Pulls toys behind him while walking (13-16 mos.)', 
        'Begins to run stiffly (16-18 mos.)', 
        'Walks into ball (18-24 mos.)', 
        'Climbs onto/down from furniture unsupported (16-24 mos.)'
      ] },
      { title: 'Language', items: [
        'Points to object or picture when named (18-24 mos.)', 
        'Recognizes names of people, objects, body parts (18-24 mos.)', 
        'Says several single words (15-18 mos.)', 
        'Uses two-word sentences (18-24 mos.)', 
        'Follows simple, one-step instructions (14-18 mos.)'
      ] },
      { title: 'Cognitive', items: [
        'Finds objects hidden under 2 or 3 covers', 
        'Begins to sort shapes and colors (20-24 mos.)', 
        'Begins make-believe play (20-24 mos.)'
      ] },
      { title: 'Social', items: [
        'Imitates behavior of others (18-24 mos.)', 
        'Demonstrates increasing independence (18-24 mos.)', 
        'Begins to show defiant behavior (18-24 mos.)'
      ] }
    ],
    redFlags: [
      'Cannot walk by 18 months', 
      'Fails to develop a mature heel-toe walking pattern', 
      'Does not speak at least 15 words by 18 months', 
      'Does not use two-word sentences by age 2', 
      'Does not follow simple one-step instructions by 24 mos.'
    ]
  },
  {
    id: 'm-2-3y',
    label: '2 to 3 Years',
    minAge: 24,
    maxAge: 36,
    sections: [
      { title: 'Movement', items: [
        'Climbs well (24-30 mos.)', 
        'Walks down stairs alone, placing both feet on each step (26-28 mos.)', 
        'Walks up stairs alternating feet with support (24-30 mos.)', 
        'Swings leg to kick ball (24-30 mos.)', 
        'Pedals tricycle (30-36 mos.)'
      ] },
      { title: 'Hand Skills', items: [
        'Makes vertical, horizontal, circular strokes (30-36 mos.)', 
        'Turns book pages one at a time (24-30 mos.)', 
        'Builds a tower of more than 6 blocks (24-30 mos.)', 
        'Holds a pencil in writing position (30-36 mos.)'
      ] },
      { title: 'Language', items: [
        'Recognizes and identifies common objects (26-32 mos.)', 
        'Understands most sentences (24-40 mos.)', 
        'Can say name, age, and sex (30-36 mos.)', 
        'Uses pronouns (I, you, me, we, they) (24-30 mos.)'
      ] },
      { title: 'Social/Emotional', items: [
        'Separates easily from parents (by 36 mo.)', 
        'Expresses a wide range of emotions (24-36 mos.)', 
        'Objects to major changes in routine (24-36 mos.)'
      ] }
    ],
    redFlags: [
      'Frequent falling and difficulty with stairs', 
      'Persistent drooling or very unclear speech', 
      'Inability to build a tower of more than 4 blocks', 
      'Inability to communicate in short phrases', 
      'No involvement in pretend play', 
      'Extreme difficulty separating from primary caregiver'
    ]
  },
  {
    id: 'm-3-4y',
    label: '3 to 4 Years',
    minAge: 36,
    maxAge: 48,
    sections: [
      { title: 'Movement', items: [
        'Hops and stands on one foot up to 5 seconds', 
        'Goes up and downstairs without support', 
        'Kicks ball forward with control', 
        'Catches a bounced ball most of the time'
      ] },
      { title: 'Language & Cognitive', items: [
        'Speaks in sentences of 5 to 6 words', 
        'Understands concept of counting and may know a few numbers', 
        'Correctly names at least four colors', 
        'Tells stories and recalls parts of a story'
      ] },
      { title: 'Social & Emotional', items: [
        'Cooperates with other children', 
        'Plays "Mom" or "Dad"', 
        'More inventive in fantasy play', 
        'Dresses and undresses self with minimal help'
      ] }
    ],
    redFlags: [
      'Cannot jump in place or ride a tricycle', 
      'Cannot grasp a crayon between thumb and fingers', 
      'Has trouble scribbling', 
      'Does not use sentences of more than three words'
    ]
  },
  {
    id: 'm-4-5y',
    label: '4 to 5 Years',
    minAge: 48,
    maxAge: 60,
    sections: [
      { title: 'Movement', items: [
        'Stands on one foot for 10 seconds or longer', 
        'Hops, somersaults, swings and climbs', 
        'Uses fork and spoon and sometimes a table knife', 
        'Cares for own toilet needs independently'
      ] },
      { title: 'Language & Cognitive', items: [
        'Recalls parts of a story accurately', 
        'Speaks clearly using complex sentences', 
        'Counts 10 or more objects', 
        'Correctly names at least four colors and shapes'
      ] },
      { title: 'Social & Emotional', items: [
        'Wants to please and be like friends', 
        'More likely to agree with rules', 
        'Shows independence and can manage peer conflict'
      ] }
    ],
    redFlags: [
      'Acts unusually fearful, aggressive, or shy', 
      'Cannot brush teeth, wash hands, or undress without help', 
      'Cannot draw a person with head and body', 
      'Trouble concentrating on single activity for more than 5 minutes'
    ]
  }
];

let seederActive = false;

export const autoSeed = async (secondaryAuth?: Auth) => {
  if (seederActive) return;
  seederActive = true;
  
  const state = useStore.getState();
  const db = getFirestore();
  
  // Seed Admin
  if (secondaryAuth) {
    const adminEmail = 'admin@gmail.com';
    const adminPass = 'pppppp';
    let uid = '';

    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, adminEmail, adminPass);
      uid = cred.user.uid;
      console.log("Admin account created in Auth.");
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(secondaryAuth, adminEmail, adminPass);
          uid = cred.user.uid;
          console.log("Admin already exists in Auth, retrieved UID.");
        } catch (signInErr) {
          console.error("Failed to sign in to existing admin account:", signInErr);
        }
      } else {
        console.error("Admin Auth creation error:", err);
      }
    }

    if (uid) {
      try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            id: uid,
            name: 'System Administrator',
            email: adminEmail,
            role: 'SUPER_ADMIN',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
          });
          console.log("Admin profile created in Firestore.");
        } else {
          // If it exists but maybe has wrong role? User didn't specify, but let's ensure it's correct.
          const data = userDoc.data();
          if (data.role !== 'SUPER_ADMIN') {
            await setDoc(userDocRef, { role: 'SUPER_ADMIN' }, { merge: true });
            console.log("Updated existing admin user to SUPER_ADMIN role.");
          }
        }
      } catch (firestoreErr) {
        console.error("Admin Firestore seeding error:", firestoreErr);
      }
      await signOut(secondaryAuth);
    }
  }

  // Only seed if templates are empty to avoid overwriting user data
  if (state.milestoneTemplates.length === 0) {
    console.log("Seeding Progress Assessment Templates...");
    try {
      for (const template of ECDC_FULL_DATA) {
        await state.saveMilestoneTemplate(template);
      }
      console.log("Seeding Complete.");
    } catch (err) {
      console.error("Seeding failed:", err);
    }
  }
  
  seederActive = false;
};
