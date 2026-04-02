"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  User, MapPin, Shield, Bug, CalendarDays, BookOpen, Diamond, 
  Wand2, Building, Type, ListTree, AlignLeft,
  Swords, Clock, Film, Network, Dna, BookMarked, Globe, Flame, Church
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TemplateDef {
  value: string;
  label: string;
  templateId: string;
  description: string;
  attributes: string[];
  icon: any;
}

export const LORE_TEMPLATES: TemplateDef[] = [
  {
    value: "character", label: "Character", templateId: "_template_character",
    description: "A person, NPC, or notable individual in your world.",
    attributes: ["Race", "Role", "Status", "Goals"],
    icon: User
  },
  {
    value: "location", label: "Location", templateId: "_template_location",
    description: "A geographical region, city, or specific place of interest.",
    attributes: ["Type", "Region", "Population", "Ruler"],
    icon: MapPin
  },
  {
    value: "faction", label: "Faction", templateId: "_template_faction",
    description: "An organization, guild, cult, or political body.",
    attributes: ["Type", "Leader", "Goals", "Status"],
    icon: Shield
  },
  {
    value: "creature", label: "Creature", templateId: "_template_creature",
    description: "A species, monster, or natural beast.",
    attributes: ["Type", "Habitat", "Danger Level", "Abilities"],
    icon: Bug
  },
  {
    value: "event", label: "Event", templateId: "_template_event",
    description: "A historical occurrence, war, or significant milestone.",
    attributes: ["Date", "Outcome", "Consequences", "Secrets"],
    icon: CalendarDays
  },
  {
    value: "manuscript", label: "Manuscript", templateId: "_template_manuscript",
    description: "An in-world book, letter, or document.",
    attributes: ["Genre", "Status", "Word Count"],
    icon: BookOpen
  },
  {
    value: "item", label: "Item / Artifact", templateId: "_template_item",
    description: "A notable object, weapon, or magical artifact.",
    attributes: ["Type", "Rarity", "Magic Properties", "Creator"],
    icon: Diamond
  },
  {
    value: "spell", label: "Spell / Magic", templateId: "_template_spell",
    description: "A magical incantation, ritual, or spell.",
    attributes: ["School", "Level", "Casting Time", "Duration"],
    icon: Wand2
  },
  {
    value: "building", label: "Building", templateId: "_template_building",
    description: "A castle, tavern, ruin, or structure.",
    attributes: ["Type", "Owner", "Purpose", "Condition"],
    icon: Building
  },
  {
    value: "language", label: "Language", templateId: "_template_language",
    description: "A spoken tongue, script, or dialect.",
    attributes: ["Family", "Speakers", "Script", "Phrase"],
    icon: Type
  },
  {
    value: "statblock", label: "Statblock", templateId: "_template_statblock",
    description: "Crunchy mechanics and stats for combat.",
    attributes: ["CR", "AC", "HP", "Attributes"],
    icon: ListTree
  },
  // ── Session-runtime ──────────────────────────────────────────────────────────
  {
    value: "session", label: "Session", templateId: "_template_session",
    description: "A play session with recap, active hooks, and GM notes.",
    attributes: ["Session Date", "Players", "Status", "Active Hooks"],
    icon: Clock
  },
  {
    value: "quest", label: "Quest", templateId: "_template_quest",
    description: "A mission, bounty, or storyline hook with rewards and consequences.",
    attributes: ["Status", "Quest Giver", "Reward", "Location"],
    icon: Swords
  },
  {
    value: "scene", label: "Scene", templateId: "_template_scene",
    description: "A single encounter, dramatic beat, or scene.",
    attributes: ["Location", "Participants", "Outcome", "GM Notes"],
    icon: Film
  },
  // ── Societal & Metaphysical ──────────────────────────────────────────────────
  {
    value: "organization", label: "Organization", templateId: "_template_organization",
    description: "A guild, company, or formal body that isn't a military faction.",
    attributes: ["Type", "Leader", "Headquarters", "Purpose"],
    icon: Network
  },
  {
    value: "race", label: "Race / Species", templateId: "_template_race",
    description: "A sentient or notable species, sub-race, or lineage.",
    attributes: ["Homeland", "Lifespan", "Traits", "Culture"],
    icon: Dna
  },
  {
    value: "myth", label: "Myth / Legend", templateId: "_template_myth",
    description: "A story, prophecy, or legend whose truth may be disputed.",
    attributes: ["Type", "Origin", "Truth Status", "Related Entities"],
    icon: BookMarked
  },
  {
    value: "cosmology", label: "Cosmology", templateId: "_template_cosmology",
    description: "The planar structure, cosmic forces, and creation lore of your world.",
    attributes: ["Planes", "Cosmic Forces", "Afterlife", "Creation Myth"],
    icon: Globe
  },
  {
    value: "deity", label: "Deity", templateId: "_template_deity",
    description: "A god, demigod, or divine being with domains and worshippers.",
    attributes: ["Domain", "Alignment", "Symbol", "Worshippers"],
    icon: Flame
  },
  {
    value: "religion", label: "Religion", templateId: "_template_religion",
    description: "A faith system with tenets, practices, and holy texts.",
    attributes: ["Primary Deity", "Tenets", "Practices", "Holy Text"],
    icon: Church
  },
  {
    value: "lore", label: "General Lore", templateId: "",
    description: "A blank slate for unconstrained worldbuilding.",
    attributes: [],
    icon: AlignLeft
  }
];

interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: TemplateDef) => void;
}

export function TemplatePicker({ open, onOpenChange, onSelect }: TemplatePickerProps) {
  const [search, setSearch] = useState("");

  const filtered = LORE_TEMPLATES.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold" style={{ fontFamily: "var(--font-cinzel)" }}>
            Choose a Template
          </DialogTitle>
        </DialogHeader>

        <div className="pt-2 pb-4">
          <Input 
            placeholder="Search templates..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full max-w-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => {
                    onSelect(t);
                    setSearch("");
                    onOpenChange(false);
                  }}
                  className="group relative flex flex-col items-start w-full h-full rounded-xl border-2 border-border bg-card/80 p-4 text-left transition-all hover:border-primary hover:shadow-xl hover:bg-card/90"
                >
                  <div className="flex flex-col items-start gap-3 w-full mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 border border-primary/20 shadow-inner group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="w-full">
                      <h3 className="font-bold text-sm uppercase tracking-wider leading-tight group-hover:text-primary transition-colors text-foreground/90 break-words" style={{ fontFamily: "var(--font-cinzel)" }}>
                        {t.label}
                      </h3>
                      <div className="h-0.5 w-6 bg-primary/30 mt-1.5 group-hover:w-8 group-hover:bg-primary/60 transition-all duration-300" />
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full flex flex-col">
                    <p className="text-xs sm:text-sm text-muted-foreground/90 line-clamp-3 leading-relaxed mb-3 flex-1">
                      {t.description}
                    </p>
                    {t.attributes.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        {t.attributes.map(attr => (
                          <span key={attr} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border/50">
                            {attr}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No templates found matching "{search}".
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
