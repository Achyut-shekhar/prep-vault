import { Search, BookOpen, Users, FolderOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (<nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
       <div className="container mx-auto flex h-16 items-center justify-between px-4">
         <div className="flex items-center gap-8">
           <a href="/" className="flex items-center gap-2">
             <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
               <BookOpen className="h-5 w-5 text-white"/>
             </div>
             <span className="text-xl font-bold tracking-tight">PrepVault</span>
           </a>
 
           <div className="hidden items-center gap-6 md:flex">
             <a href="#search" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
               <Search className="h-4 w-4"/>
               Explore
             </a>
             <a href="#vault" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
               <FolderOpen className="h-4 w-4"/>
               My Vault
             </a>
             <a href="#community" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
               <Users className="h-4 w-4"/>
               Community
             </a>
           </div>
         </div>
 
         <div className="hidden items-center gap-3 md:flex">
           <ThemeToggle />
           <Button variant="ghost" size="sm">
             Sign In
           </Button>
           <Button size="sm" className="bg-primary hover:bg-primary/90">
             Get Started
           </Button>
         </div>
 
         <button className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
           {isMenuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
         </button>
       </div>
 
       {isMenuOpen && (<div className="border-t border-border/50 bg-background p-4 md:hidden">
           <div className="flex flex-col gap-2">
             <a href="#search" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">
               <Search className="h-4 w-4"/>
               Explore
             </a>
             <a href="#vault" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">
               <FolderOpen className="h-4 w-4"/>
               My Vault
             </a>
             <a href="#community" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary">
               <Users className="h-4 w-4"/>
               Community
             </a>
             <hr className="my-2 border-border"/>
             <Button variant="ghost" size="sm" className="justify-start">
               Sign In
             </Button>
             <Button size="sm" className="bg-primary hover:bg-primary/90">
               Get Started
             </Button>
             <ThemeToggle />
           </div>
         </div>)}
     </nav>);
};
export default Navbar;
