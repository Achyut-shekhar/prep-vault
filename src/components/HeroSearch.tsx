 import { Search, Sparkles, TrendingUp } from "lucide-react";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import { useState } from "react";
 
 const trendingSearches = [
   { name: "Amazon SDE", hot: true },
   { name: "Google SDE", hot: true },
   { name: "HackWithInfy", hot: false },
   { name: "TCS Digital", hot: false },
   { name: "GATE CSE", hot: false },
   { name: "Microsoft SDE", hot: true },
 ];
 
 interface HeroSearchProps {
   onSearch: (query: string) => void;
 }
 
 const HeroSearch = ({ onSearch }: HeroSearchProps) => {
   const [searchQuery, setSearchQuery] = useState("");
 
   const handleSearch = (e: React.FormEvent) => {
     e.preventDefault();
     if (searchQuery.trim()) {
       onSearch(searchQuery);
     }
   };
 
   const handleTrendingClick = (name: string) => {
     setSearchQuery(name);
     onSearch(name);
   };
 
   return (
     <section id="search" className="relative overflow-hidden py-20 md:py-32">
       {/* Background decorations */}
       <div className="absolute inset-0 -z-10">
         <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
         <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
       </div>
 
       <div className="container mx-auto px-4">
         <div className="mx-auto max-w-3xl text-center">
           {/* Badge */}
           <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
             <Sparkles className="h-4 w-4" />
             Your placement prep, simplified
           </div>
 
           {/* Heading */}
           <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
             All placement resources,{" "}
             <span className="text-gradient">one search away</span>
           </h1>
 
           <p className="mb-8 text-lg text-muted-foreground md:text-xl">
             Stop wasting time searching across hundreds of websites. Find interview experiences, 
             DSA problems, and prep materials from trusted sources instantly.
           </p>
 
           {/* Search Bar */}
           <form onSubmit={handleSearch} className="mb-8">
             <div className="relative mx-auto max-w-2xl">
               <div className="relative flex items-center overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-glow transition-shadow focus-within:shadow-xl">
                 <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
                 <Input
                   type="text"
                   placeholder="Search companies, exams, or topics..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="h-14 border-0 bg-transparent pl-12 pr-32 text-base focus-visible:ring-0 md:text-lg"
                 />
                 <Button
                   type="submit"
                   size="lg"
                   className="absolute right-2 bg-primary hover:bg-primary/90"
                 >
                   Search
                 </Button>
               </div>
             </div>
           </form>
 
           {/* Trending Searches */}
           <div className="flex flex-wrap items-center justify-center gap-2">
             <span className="flex items-center gap-1 text-sm text-muted-foreground">
               <TrendingUp className="h-4 w-4" />
               Trending:
             </span>
             {trendingSearches.map((item) => (
               <button
                 key={item.name}
                 onClick={() => handleTrendingClick(item.name)}
                 className="group relative inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium transition-all hover:border-primary/50 hover:bg-primary/5"
               >
                 {item.name}
                 {item.hot && (
                   <span className="flex h-2 w-2">
                     <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-accent opacity-75" />
                     <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                   </span>
                 )}
               </button>
             ))}
           </div>
         </div>
       </div>
     </section>
   );
 };
 
 export default HeroSearch;