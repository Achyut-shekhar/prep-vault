 import { useState } from "react";
 import { FolderPlus, Lock, Globe } from "lucide-react";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 
 interface NewFolderDialogProps {
   onCreateFolder: (name: string, isPublic: boolean) => void;
 }
 
 const NewFolderDialog = ({ onCreateFolder }: NewFolderDialogProps) => {
   const [open, setOpen] = useState(false);
   const [folderName, setFolderName] = useState("");
   const [isPublic, setIsPublic] = useState(false);
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (folderName.trim()) {
       onCreateFolder(folderName.trim(), isPublic);
       setFolderName("");
       setIsPublic(false);
       setOpen(false);
     }
   };
 
   const presetNames = [
     "Amazon SDE",
     "Google Interview",
     "DSA Revision",
     "System Design",
     "HackWithInfy",
     "TCS Digital",
     "GATE CSE",
   ];
 
   return (
     <Dialog open={open} onOpenChange={setOpen}>
       <DialogTrigger asChild>
         <Button className="gap-2 bg-primary hover:bg-primary/90">
           <FolderPlus className="h-4 w-4" />
           New Folder
         </Button>
       </DialogTrigger>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
               <FolderPlus className="h-5 w-5 text-primary" />
             </div>
             Create New Folder
           </DialogTitle>
           <DialogDescription>
             Organize your resources by company, exam, or topic for focused preparation.
           </DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-6 pt-4">
           {/* Folder Name Input */}
           <div className="space-y-2">
             <Label htmlFor="folder-name">Folder Name</Label>
             <Input
               id="folder-name"
               placeholder="e.g., Amazon SDE Prep"
               value={folderName}
               onChange={(e) => setFolderName(e.target.value)}
               className="h-11"
               autoFocus
             />
           </div>
 
           {/* Quick Suggestions */}
           <div className="space-y-2">
             <Label className="text-muted-foreground">Quick suggestions</Label>
             <div className="flex flex-wrap gap-2">
               {presetNames.map((name) => (
                 <button
                   key={name}
                   type="button"
                   onClick={() => setFolderName(name)}
                   className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                     folderName === name
                       ? "border-primary bg-primary/10 text-primary"
                       : "border-border hover:border-primary/50 hover:bg-secondary"
                   }`}
                 >
                   {name}
                 </button>
               ))}
             </div>
           </div>
 
           {/* Visibility Toggle */}
           <div className="rounded-lg border border-border bg-secondary/30 p-4">
             <div className="flex items-start justify-between gap-4">
               <div className="flex items-start gap-3">
                 <div className={`mt-0.5 rounded-lg p-2 ${isPublic ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                   {isPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                 </div>
                 <div>
                   <p className="font-medium">
                     {isPublic ? "Public Folder" : "Private Folder"}
                   </p>
                   <p className="text-sm text-muted-foreground">
                     {isPublic
                       ? "Anyone with the link can view resources"
                       : "Only you can see this folder"}
                   </p>
                 </div>
               </div>
               <Switch
                 checked={isPublic}
                 onCheckedChange={setIsPublic}
                 className="data-[state=checked]:bg-accent"
               />
             </div>
 
             {isPublic && (
               <div className="mt-3 rounded-md bg-accent/10 px-3 py-2 text-sm text-accent">
                 💡 Share your prep material with friends and juniors!
               </div>
             )}
           </div>
 
           {/* Actions */}
           <div className="flex gap-3 pt-2">
             <Button
               type="button"
               variant="outline"
               className="flex-1"
               onClick={() => setOpen(false)}
             >
               Cancel
             </Button>
             <Button
               type="submit"
               className="flex-1 bg-primary hover:bg-primary/90"
               disabled={!folderName.trim()}
             >
               Create Folder
             </Button>
           </div>
         </form>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default NewFolderDialog;