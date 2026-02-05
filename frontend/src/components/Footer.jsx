import { BookOpen, Github, Twitter, Linkedin } from "lucide-react";
const Footer = () => {
    return (<footer className="border-t border-border bg-card/50 py-12">
       <div className="container mx-auto px-4">
         <div className="grid gap-8 md:grid-cols-4">
           <div className="md:col-span-1">
             <a href="/" className="mb-4 flex items-center gap-2">
               <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
                 <BookOpen className="h-5 w-5 text-white"/>
               </div>
               <span className="text-xl font-bold tracking-tight">PrepVault</span>
             </a>
             <p className="mb-4 text-sm text-muted-foreground">
               Your one-stop platform for placement preparation. Curated resources, organized learning.
             </p>
             <div className="flex gap-3">
               <a href="#" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                 <Twitter className="h-5 w-5"/>
               </a>
               <a href="#" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                 <Github className="h-5 w-5"/>
               </a>
               <a href="#" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                 <Linkedin className="h-5 w-5"/>
               </a>
             </div>
           </div>
 
           <div>
             <h4 className="mb-4 font-semibold">Product</h4>
             <ul className="space-y-2 text-sm text-muted-foreground">
               <li><a href="#" className="transition-colors hover:text-foreground">Features</a></li>
               <li><a href="#" className="transition-colors hover:text-foreground">Pricing</a></li>
               <li><a href="#" className="transition-colors hover:text-foreground">Roadmap</a></li>
               <li><a href="#" className="transition-colors hover:text-foreground">Changelog</a></li>
             </ul>
           </div>
 
           <div>
             <h4 className="mb-4 font-semibold">Resources</h4>
             <ul className="space-y-2 text-sm text-muted-foreground">
               <li><a href="#" className="transition-colors hover:text-foreground">DSA Guide</a></li>
               <li><a href="#" className="transition-colors hover:text-foreground">System Design</a></li>
               <li><a href="#" className="transition-colors hover:text-foreground">Interview Tips</a></li>
               <li><a href="#" className="transition-colors hover:text-foreground">Company Guides</a></li>
             </ul>
           </div>
 
           <div>
             <h4 className="mb-4 font-semibold">Legal</h4>
             <ul className="space-y-2 text-sm text-muted-foreground">
               <li><a href="#" className="transition-colors hover:text-foreground">Privacy Policy</a></li>
               <li><a href="#" className="transition-colors hover:text-foreground">Terms of Service</a></li>
               <li><a href="#" className="transition-colors hover:text-foreground">Cookie Policy</a></li>
             </ul>
           </div>
         </div>
 
         <div className="mt-12 border-t border-border pt-8">
           <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
             <p className="text-sm text-muted-foreground">
               © 2025 PrepVault. All rights reserved.
             </p>
             <p className="text-xs text-muted-foreground">
               All content belongs to original creators. We only link to external resources.
             </p>
           </div>
         </div>
       </div>
     </footer>);
};
export default Footer;
