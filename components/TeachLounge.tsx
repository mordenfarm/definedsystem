import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  Search, MessageSquare, Plus, Bell, BookOpen, Coffee, 
  ChevronRight, ChevronLeft, MoreHorizontal, Download, FileText,
  Calendar, CheckCircle2, Clock, Filter, Eye, ThumbsUp, MessageCircle
} from 'lucide-react';

interface LoungePost {
  id: string;
  refId: string;
  title: string;
  author: string;
  authorAvatar?: string;
  category: 'Announcement' | 'Lesson Plan' | 'ABA Resource' | 'Schedule' | 'Discussion';
  date: string;
  time: string;
  status: 'Published' | 'Important' | 'Discussion' | 'Archived';
  repliesCount: number;
  likesCount: number;
  preview: string;
}

const INITIAL_POSTS: LoungePost[] = [
  {
    id: 'post-1',
    refId: '#LN-101',
    title: 'Term 1 Milestone Assessment Schedule Update',
    author: 'Prominance Magara',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    category: 'Schedule',
    date: '2026-09-01',
    time: '08:30 AM',
    status: 'Important',
    repliesCount: 6,
    likesCount: 14,
    preview: 'All specialists please note that 1–3 Months and 4–7 Months evaluations should be submitted before the Friday staff briefing.'
  },
  {
    id: 'post-2',
    refId: '#LN-102',
    title: 'Discrete Trial Training (DTT) Flashcard Sets Uploaded',
    author: 'Sarah Jenkins',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    category: 'ABA Resource',
    date: '2026-08-30',
    time: '11:15 AM',
    status: 'Published',
    repliesCount: 4,
    likesCount: 22,
    preview: 'New visual prompt cards for motor and verbal imitation protocols are now in the staff shared resource locker.'
  },
  {
    id: 'post-3',
    refId: '#LN-103',
    title: 'Staff Wellness & Coffee Catch-up (Friday 3:30 PM)',
    author: 'Tinashe Admin',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    category: 'Announcement',
    date: '2026-08-29',
    time: '02:00 PM',
    status: 'Published',
    repliesCount: 11,
    likesCount: 19,
    preview: 'Join us in the lounge room for weekly reflections, wins of the week, and coffee.'
  },
  {
    id: 'post-4',
    refId: '#LN-104',
    title: 'Behavior Support Plan Adjustments for Non-Verbal Learners',
    author: 'David Moyo',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    category: 'Lesson Plan',
    date: '2026-08-28',
    time: '09:45 AM',
    status: 'Discussion',
    repliesCount: 8,
    likesCount: 9,
    preview: 'Looking for peer input on token reinforcement schedules when transitioning between tabletop and free play domains.'
  },
  {
    id: 'post-5',
    refId: '#LN-105',
    title: 'Adaptive Seating Request Protocol',
    author: 'Emily Watson',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    category: 'ABA Resource',
    date: '2026-08-25',
    time: '01:20 PM',
    status: 'Published',
    repliesCount: 2,
    likesCount: 7,
    preview: 'Occupational therapy requisitions are open for early intervention sensory cushions and weighted vests.'
  }
];

export const TeachLounge: React.FC = () => {
  const { user, notify } = useStore();
  const [posts, setPosts] = useState<LoungePost[]>(INITIAL_POSTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<LoungePost | null>(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<LoungePost['category']>('Discussion');
  const [newContent, setNewContent] = useState('');
  const pageSize = 5;

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.refId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [posts, searchTerm, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: LoungePost['status']) => {
    switch (status) {
      case 'Important':
        return 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900';
      case 'Published':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900';
      case 'Discussion':
        return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'Archived':
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEntry: LoungePost = {
      id: `post-${Date.now()}`,
      refId: `#LN-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle,
      author: user?.name || 'Prominance Magara',
      authorAvatar: user?.avatar,
      category: newCategory,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Published',
      repliesCount: 0,
      likesCount: 1,
      preview: newContent
    };

    setPosts([newEntry, ...posts]);
    setNewTitle('');
    setNewContent('');
    setShowNewPostModal(false);
    notify('success', 'Announcement published to Teach Lounge', 3000);
  };

  return (
    <div className="w-full min-h-[calc(100vh-72px)] flex flex-col justify-between animate-in fade-in duration-500 font-sans">
      <div className="flex-1 flex flex-col">
        {/* Table Toolbar Header directly on page */}
        <div className="px-6 md:px-8 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
              {filteredPosts.length} Lounge Posts & Bulletins
            </h2>
          </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search posts or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[9px] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[9px] text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Published">Published</option>
            <option value="Important">Important</option>
            <option value="Discussion">Discussion</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[9px] text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Schedule">Schedule</option>
            <option value="ABA Resource">ABA Resource</option>
            <option value="Lesson Plan">Lesson Plan</option>
            <option value="Announcement">Announcement</option>
          </select>

          <button 
            onClick={() => setShowNewPostModal(true)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-[9px] flex items-center gap-1.5 shadow-sm transition-all active:scale-98 shrink-0"
          >
            <Plus size={14} />
            <span>New Post</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3.5 px-5 font-semibold">Post ID</th>
                <th className="py-3.5 px-5 font-semibold">Author</th>
                <th className="py-3.5 px-5 font-semibold">Topic / Title</th>
                <th className="py-3.5 px-5 font-semibold">Category</th>
                <th className="py-3.5 px-5 font-semibold">Date & Time</th>
                <th className="py-3.5 px-5 font-semibold">Engagement</th>
                <th className="py-3.5 px-5 font-semibold">Status</th>
                <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedPosts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No lounge entries matching the selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedPosts.map((post) => (
                  <tr 
                    key={post.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                  >
                    <td className="py-4 px-5 font-mono text-[11px] text-slate-500 font-bold">
                      {post.refId}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        {post.authorAvatar ? (
                          <img 
                            src={post.authorAvatar} 
                            alt={post.author} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-black flex items-center justify-center text-xs">
                            {post.author[0]}
                          </div>
                        )}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {post.author}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <p className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[280px]">
                        {post.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[280px] mt-0.5">
                        {post.preview}
                      </p>
                    </td>

                    <td className="py-4 px-5">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {post.category}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-mono text-[11px] text-slate-500">
                      {post.date} • {post.time}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={12} className="text-slate-400" /> {post.likesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={12} className="text-slate-400" /> {post.repliesCount}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-[9px] text-[10px] font-bold border ${getStatusBadge(post.status)}`}>
                        {post.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[9px] transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer at very bottom */}
      <div className="mt-auto px-6 md:px-8 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredPosts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="font-bold text-slate-900 dark:text-white">
            {Math.min(currentPage * pageSize, filteredPosts.length)}
          </span> of{' '}
          <span className="font-bold text-slate-900 dark:text-white">{filteredPosts.length}</span> results
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-[9px] border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`w-8 h-8 rounded-[9px] text-xs font-bold transition-all ${
                currentPage === num
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-[9px] border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      </div>

      {/* Post Detail Drawer / Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[9px] max-w-2xl w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-[9px] text-[10px] font-bold border ${getStatusBadge(selectedPost.status)}`}>
                  {selectedPost.status}
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">{selectedPost.refId}</span>
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-[9px]"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {selectedPost.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">By {selectedPost.author}</span>
                <span>•</span>
                <span>{selectedPost.date} at {selectedPost.time}</span>
                <span>•</span>
                <span className="text-blue-600 font-semibold">{selectedPost.category}</span>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[9px] border border-slate-100 dark:border-slate-800">
              {selectedPost.preview}
            </p>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => notify('success', 'Liked post!', 2000)}
                  className="px-3.5 py-1.5 rounded-[9px] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <ThumbsUp size={14} /> Like ({selectedPost.likesCount})
                </button>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="px-4 py-1.5 bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold rounded-[9px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleCreatePost} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[9px] max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white">
                Create Lounge Post
              </h3>
              <button 
                type="button"
                onClick={() => setShowNewPostModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-[9px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Post title or topic..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[9px] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[9px] text-xs font-medium text-slate-900 dark:text-white outline-none"
                >
                  <option value="Announcement">Announcement</option>
                  <option value="Lesson Plan">Lesson Plan</option>
                  <option value="ABA Resource">ABA Resource</option>
                  <option value="Schedule">Schedule</option>
                  <option value="Discussion">Discussion</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Content / Instructions</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share details, updates or questions..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[9px] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewPostModal(false)}
                className="px-4 py-2 rounded-[9px] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-[9px] shadow-sm"
              >
                Publish Post
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
