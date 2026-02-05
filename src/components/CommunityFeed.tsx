 import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Verified } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 
 interface Post {
   id: string;
   author: {
     name: string;
     handle: string;
     avatar: string;
     verified: boolean;
   };
   content: string;
   timestamp: string;
   likes: number;
   comments: number;
   shares: number;
   tags: string[];
 }
 
 const mockPosts: Post[] = [
   {
     id: "1",
     author: {
       name: "Priya Sharma",
       handle: "@priya_codes",
       avatar: "",
       verified: true,
     },
     content: "Just cleared my Amazon SDE-1 interview! 🎉 The key was focusing on behavioral questions alongside DSA. Here's my complete prep strategy thread 🧵",
     timestamp: "2h ago",
     likes: 234,
     comments: 45,
     shares: 89,
     tags: ["Amazon", "Interview", "Success"],
   },
   {
     id: "2",
     author: {
       name: "Rahul Verma",
       handle: "@rahul_dev",
       avatar: "",
       verified: false,
     },
     content: "Compiled a list of 50 must-do System Design questions for FAANG interviews. Link in my vault - check my profile! 📚",
     timestamp: "5h ago",
     likes: 567,
     comments: 78,
     shares: 156,
     tags: ["SystemDesign", "FAANG", "Resources"],
   },
   {
     id: "3",
     author: {
       name: "Ananya Reddy",
       handle: "@ananya_prep",
       avatar: "",
       verified: true,
     },
     content: "HackWithInfy results out! Scored in Power Programmer category 💪 Ask me anything about the exam pattern and preparation!",
     timestamp: "8h ago",
     likes: 892,
     comments: 234,
     shares: 45,
     tags: ["HackWithInfy", "Infosys", "AMA"],
   },
 ];
 
 const CommunityFeed = () => {
   return (
     <section id="community" className="py-20">
       <div className="container mx-auto px-4">
         <div className="mb-8 text-center">
           <h2 className="mb-2 text-2xl font-bold md:text-3xl">Community Feed</h2>
           <p className="mx-auto max-w-2xl text-muted-foreground">
             Learn from peers, share your experiences, and stay updated with the latest placement insights
           </p>
         </div>
 
         <div className="mx-auto max-w-2xl space-y-4">
           {/* Compose box */}
           <div className="rounded-xl border border-border bg-card p-4">
             <div className="flex gap-3">
               <Avatar className="h-10 w-10">
                 <AvatarFallback className="bg-primary/10 text-primary">U</AvatarFallback>
               </Avatar>
               <div className="flex-1">
                 <textarea
                   placeholder="Share your interview experience or prep tips..."
                   className="min-h-[80px] w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                 />
                 <div className="flex items-center justify-between border-t border-border pt-3">
                   <div className="text-xs text-muted-foreground">
                     Only placement-related content
                   </div>
                   <Button size="sm" className="bg-primary hover:bg-primary/90">
                     Post
                   </Button>
                 </div>
               </div>
             </div>
           </div>
 
           {/* Posts */}
           {mockPosts.map((post, index) => (
             <div
               key={post.id}
               className="animate-fade-in rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20"
               style={{ animationDelay: `${index * 100}ms` }}
             >
               <div className="mb-3 flex items-start justify-between">
                 <div className="flex gap-3">
                   <Avatar className="h-10 w-10">
                     <AvatarImage src={post.author.avatar} />
                     <AvatarFallback className="bg-primary/10 text-primary">
                       {post.author.name.charAt(0)}
                     </AvatarFallback>
                   </Avatar>
                   <div>
                     <div className="flex items-center gap-1">
                       <span className="font-semibold">{post.author.name}</span>
                       {post.author.verified && (
                         <Verified className="h-4 w-4 fill-primary text-primary-foreground" />
                       )}
                     </div>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <span>{post.author.handle}</span>
                       <span>·</span>
                       <span>{post.timestamp}</span>
                     </div>
                   </div>
                 </div>
                 <Button variant="ghost" size="icon" className="h-8 w-8">
                   <MoreHorizontal className="h-4 w-4" />
                 </Button>
               </div>
 
               <p className="mb-3 leading-relaxed">{post.content}</p>
 
               <div className="mb-4 flex flex-wrap gap-2">
                 {post.tags.map((tag) => (
                   <span
                     key={tag}
                     className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                   >
                     #{tag}
                   </span>
                 ))}
               </div>
 
               <div className="flex items-center justify-between border-t border-border pt-3">
                 <div className="flex items-center gap-4">
                   <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive">
                     <Heart className="h-4 w-4" />
                     {post.likes}
                   </button>
                   <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
                     <MessageCircle className="h-4 w-4" />
                     {post.comments}
                   </button>
                   <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent">
                     <Share2 className="h-4 w-4" />
                     {post.shares}
                   </button>
                 </div>
                 <button className="text-muted-foreground transition-colors hover:text-primary">
                   <Bookmark className="h-4 w-4" />
                 </button>
               </div>
             </div>
           ))}
 
           <div className="pt-4 text-center">
             <Button variant="outline" className="w-full">
               Load More Posts
             </Button>
           </div>
         </div>
       </div>
     </section>
   );
 };
 
 export default CommunityFeed;