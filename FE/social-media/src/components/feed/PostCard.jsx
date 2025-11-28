import { useState } from "react";
//import { formatDistanceToNow } from "date-fns"; //?date-fns
import { Heart, MessageSquare, Share2, MoreHorizontal } from "lucide-react"; 
//import Button from "../common/ButtonComponent"; 



export default function PostCard({ post }) {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(post.comments && post.comments.length > 0);

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3">
          <img 
            src={post.author.avatar} 
            alt={post.author.name} 
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">{post.author.name}</h3>
            <p className="text-sm text-gray-500">
              @{post.author.handle} • {post.timestamp}
            </p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-line">
          {post.content}
        </p>
      </div>

      {/* Image Attachment */}
      {post.image && (
        <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
          <img 
            src={post.image} 
            alt="Post content" 
            className="w-full h-auto object-cover max-h-[500px]"
          />
        </div>
      )}

      {/* Stats/Divider */}
      <div className="flex items-center gap-4 border-t border-gray-100 pt-3 mt-2">
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
            isLiked ? "text-red-500" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Heart size={20} className={isLiked ? "fill-current" : ""} />
          <span>{isLiked ? post.stats.likes + 1 : post.stats.likes}</span>
        </button>

        <button 
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare size={20} />
          <span>{post.stats.comments}</span>
        </button>

        <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors ml-auto">
          <Share2 size={20} />
          <span>{post.stats.shares}</span>
        </button>
      </div>

      {/* Comments Section (Matches Image 3) */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
          <h4 className="text-sm font-bold text-blue-600 mb-3">Comments:</h4>
          
          <div className="space-y-4 mb-4">
            {post.comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                {/* Vertical Line for Replies */}
                <div className="relative">
                    <img 
                      src={comment.author.avatar} 
                      alt={comment.author.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    {/* Visual connector line if needed for nested replies */}
                    {comment.replies && <div className="absolute left-1/2 top-8 bottom-0 w-px bg-gray-200 -translate-x-1/2 h-full" />}
                </div>

                <div className="flex-1">
                  <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-sm text-gray-900">{comment.author.name}</span>
                      <span className="text-xs text-gray-400">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                  </div>
                  
                  {/* Comment Actions */}
                  <div className="flex gap-4 mt-1 ml-2 text-xs text-gray-500 font-medium">
                    <button className="hover:text-primary">1k Likes</button>
                    <button className="hover:text-primary">Like</button>
                    <button className="hover:text-primary">Reply</button>
                  </div>

                  {/* Nested Replies (Jack J97 Example) */}
                  {comment.replies?.map(reply => (
                     <div key={reply.id} className="flex gap-3 mt-3">
                        <img 
                          src={reply.author.avatar} 
                          alt={reply.author.name} 
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div className="flex-1">
                           <div className="bg-gray-50 rounded-2xl rounded-tl-none px-3 py-2">
                              <span className="font-semibold text-sm text-gray-900 block">{reply.author.name}</span>
                              <span className="text-sm text-gray-700">{reply.text}</span>
                           </div>
                           <div className="flex gap-4 mt-1 ml-2 text-xs text-gray-500">
                              <button className="hover:text-primary">1k Likes</button>
                              <button className="hover:text-primary">Like</button>
                              <button className="hover:text-primary">Reply</button>
                           </div>
                        </div>
                     </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <div className="flex gap-2 items-center">
             <img src="https://i.pravatar.cc/150?u=me" className="w-8 h-8 rounded-full border border-gray-200" />
             <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Write a comment..." 
                  className="w-full bg-gray-100 rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-gray-700 placeholder-gray-400"
                />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}