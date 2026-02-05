 import { Search, FolderOpen, Share2, Users, Shield, Zap } from "lucide-react";
 
 const features = [
   {
     icon: <Search className="h-6 w-6" />,
     title: "Smart Search",
     description: "Find resources from trusted sources across the web instantly with AI-powered search",
   },
   {
     icon: <FolderOpen className="h-6 w-6" />,
     title: "Personal Vault",
     description: "Organize resources into company-wise or topic-wise folders for focused preparation",
   },
   {
     icon: <Share2 className="h-6 w-6" />,
     title: "Shareable Folders",
     description: "Share your curated prep material with friends through simple shareable links",
   },
   {
     icon: <Users className="h-6 w-6" />,
     title: "Community Feed",
     description: "Learn from peers, share experiences, and stay updated with placement insights",
   },
   {
     icon: <Shield className="h-6 w-6" />,
     title: "Trusted Sources",
     description: "All resources from verified sources - GeeksforGeeks, LeetCode, GitHub, and more",
   },
   {
     icon: <Zap className="h-6 w-6" />,
     title: "Lightning Fast",
     description: "No more tab hopping. Get everything you need in one place, instantly",
   },
 ];
 
 const Features = () => {
   return (
     <section className="border-y border-border bg-card/50 py-20">
       <div className="container mx-auto px-4">
         <div className="mb-12 text-center">
           <h2 className="mb-3 text-2xl font-bold md:text-3xl">
             Everything you need to ace placements
           </h2>
           <p className="mx-auto max-w-2xl text-muted-foreground">
             Stop wasting hours searching. Start preparing smarter with tools designed for placement success.
           </p>
         </div>
 
         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {features.map((feature, index) => (
             <div
               key={feature.title}
               className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
               style={{ animationDelay: `${index * 100}ms` }}
             >
               <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                 {feature.icon}
               </div>
               <h3 className="mb-2 font-semibold">{feature.title}</h3>
               <p className="text-sm leading-relaxed text-muted-foreground">
                 {feature.description}
               </p>
             </div>
           ))}
         </div>
       </div>
     </section>
   );
 };
 
 export default Features;