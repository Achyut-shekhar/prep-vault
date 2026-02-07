import ResourceCard from "./ResourceCard";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
const filterTypes = ["All", "Articles", "Videos", "GitHub"];
const SearchResults = ({ query, results }) => {
    const [activeFilter, setActiveFilter] = useState("All");
    
    // Ensure results is an array to prevent crashes
    const safeResults = Array.isArray(results) ? results : [];

    const filteredResults = safeResults.filter((resource) => {
        if (activeFilter === "All")
            return true;
        if (activeFilter === "Articles")
            return resource.type === "blog";

        if (activeFilter === "Videos")
            return resource.type === "video";
        if (activeFilter === "GitHub")
            return resource.type === "github";
        return true;
    });
    return (<section className="pb-20">
       <div className="container mx-auto px-4">
         <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
           <div>
             <h2 className="text-2xl font-bold">
               Results for "<span className="text-primary">{query}</span>"
             </h2>
             <p className="text-muted-foreground">
               Found {filteredResults.length} resources from trusted sources
             </p>
           </div>
 
           <div className="flex items-center gap-2">
             <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
               {filterTypes.map((filter) => (<button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeFilter === filter
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"}`}>
                   {filter}
                 </button>))}
             </div>
             <Button variant="outline" size="icon" className="shrink-0" aria-label="Filter options">
               <SlidersHorizontal className="h-4 w-4"/>
             </Button>
           </div>
         </div>
 
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
           {filteredResults.map((resource, index) => (<div key={resource.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
               <ResourceCard resource={resource}/>
             </div>))}
         </div>
 
         {filteredResults.length === 0 && (<div className="py-20 text-center">
             <Filter className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50"/>
             <p className="text-lg font-medium">No resources found</p>
             <p className="text-muted-foreground">Try adjusting your filters</p>
           </div>)}
       </div>
     </section>);
};
export default SearchResults;
