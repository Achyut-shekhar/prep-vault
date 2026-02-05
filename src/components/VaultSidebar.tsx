 import { FolderOpen, FolderPlus, Lock, Globe, ChevronRight, Plus } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { useState } from "react";
 
 interface Folder {
   id: string;
   name: string;
   isPublic: boolean;
   resourceCount: number;
 }
 
 const mockFolders: Folder[] = [
   { id: "1", name: "Amazon SDE", isPublic: false, resourceCount: 24 },
   { id: "2", name: "Google Interview Prep", isPublic: true, resourceCount: 18 },
   { id: "3", name: "DSA Revision", isPublic: false, resourceCount: 45 },
   { id: "4", name: "System Design", isPublic: true, resourceCount: 12 },
   { id: "5", name: "HackWithInfy", isPublic: false, resourceCount: 8 },
 ];
 
 const VaultSidebar = () => {
   const [folders] = useState<Folder[]>(mockFolders);
   const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
 
   return (
     <section id="vault" className="py-20">
       <div className="container mx-auto px-4">
         <div className="mb-8 flex items-center justify-between">
           <div>
             <h2 className="text-2xl font-bold">My Study Vault</h2>
             <p className="text-muted-foreground">
               Organize resources into folders for focused preparation
             </p>
           </div>
           <Button className="gap-2 bg-primary hover:bg-primary/90">
             <FolderPlus className="h-4 w-4" />
             New Folder
           </Button>
         </div>
 
         <div className="grid gap-6 lg:grid-cols-3">
           {/* Folders list */}
           <div className="rounded-xl border border-border bg-card p-4">
             <div className="mb-4 flex items-center justify-between">
               <h3 className="font-semibold">Folders</h3>
               <span className="text-sm text-muted-foreground">{folders.length} folders</span>
             </div>
 
             <div className="space-y-2">
               {folders.map((folder) => (
                 <button
                   key={folder.id}
                   onClick={() => setSelectedFolder(folder.id)}
                   className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                     selectedFolder === folder.id
                       ? "bg-primary/10 text-primary"
                       : "hover:bg-secondary"
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <FolderOpen
                       className={`h-5 w-5 ${
                         selectedFolder === folder.id ? "text-primary" : "text-muted-foreground"
                       }`}
                     />
                     <div>
                       <div className="flex items-center gap-2">
                         <span className="font-medium">{folder.name}</span>
                         {folder.isPublic ? (
                           <Globe className="h-3.5 w-3.5 text-accent" />
                         ) : (
                           <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                         )}
                       </div>
                       <span className="text-xs text-muted-foreground">
                         {folder.resourceCount} resources
                       </span>
                     </div>
                   </div>
                   <ChevronRight
                     className={`h-4 w-4 transition-transform ${
                       selectedFolder === folder.id ? "rotate-90" : ""
                     }`}
                   />
                 </button>
               ))}
             </div>
           </div>
 
           {/* Selected folder content */}
           <div className="lg:col-span-2">
             {selectedFolder ? (
               <div className="rounded-xl border border-border bg-card p-6">
                 <div className="mb-6 flex items-center justify-between">
                   <div>
                     <h3 className="text-lg font-semibold">
                       {folders.find((f) => f.id === selectedFolder)?.name}
                     </h3>
                     <p className="text-sm text-muted-foreground">
                       {folders.find((f) => f.id === selectedFolder)?.resourceCount} saved resources
                     </p>
                   </div>
                   <div className="flex gap-2">
                     <Button variant="outline" size="sm">
                       Share Folder
                     </Button>
                     <Button size="sm" variant="outline" className="gap-1">
                       <Plus className="h-3.5 w-3.5" />
                       Add Resource
                     </Button>
                   </div>
                 </div>
 
                 <div className="space-y-3">
                   {[1, 2, 3].map((i) => (
                     <div
                       key={i}
                       className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                     >
                       <div className="flex items-center gap-3">
                         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                           <FolderOpen className="h-5 w-5 text-primary" />
                         </div>
                         <div>
                           <p className="font-medium">Sample Resource {i}</p>
                           <p className="text-sm text-muted-foreground">geeksforgeeks.org</p>
                         </div>
                       </div>
                       <Button variant="ghost" size="sm">
                         Open
                       </Button>
                     </div>
                   ))}
                 </div>
               </div>
             ) : (
               <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12">
                 <div className="text-center">
                   <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                   <p className="font-medium">Select a folder</p>
                   <p className="text-sm text-muted-foreground">
                     Click on a folder to view its resources
                   </p>
                 </div>
               </div>
             )}
           </div>
         </div>
       </div>
     </section>
   );
 };
 
 export default VaultSidebar;