"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Cpu,
  Shield,
  Code,
  Briefcase,
  BadgeCheck,
  Award,
  Mail,
  Github,
  Linkedin,
  FileText,
  FolderGit2,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const handleOpenEvent = () => setOpen(true);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpenEvent);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenEvent);
    };
  }, []);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      if (href.startsWith("http") || href.startsWith("mailto:")) {
        window.open(href, href.startsWith("mailto:") ? "_self" : "_blank");
      } else if (href.startsWith("/#") && window.location.pathname === "/") {
        document.querySelector(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push(href);
      }
    },
    [router]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command Palette" description="Điều hướng nhanh trên portfolio">
      <CommandInput placeholder="Tìm section, dự án, hoặc hành động..." />
      <CommandList>
        <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
        <CommandGroup heading="Điều hướng">
          <CommandItem onSelect={() => go("/#features")}>
            <Cpu /> Skills
          </CommandItem>
          <CommandItem onSelect={() => go("/#how-it-works")}>
            <Code /> Workflow
          </CommandItem>
          <CommandItem onSelect={() => go("/#infra")}>
            <Shield /> Lab Stack
          </CommandItem>
          <CommandItem onSelect={() => go("/#developers")}>
            <Briefcase /> Experience &amp; Projects
          </CommandItem>
          <CommandItem onSelect={() => go("/#security")}>
            <Shield /> Playbooks
          </CommandItem>
          <CommandItem onSelect={() => go("/#proof")}>
            <BadgeCheck /> Proof of Work
          </CommandItem>
          <CommandItem onSelect={() => go("/#pricing")}>
            <Award /> Certifications
          </CommandItem>
          <CommandItem onSelect={() => go("/#contact")}>
            <Mail /> Contact
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Dự án">
          <CommandItem onSelect={() => go("/projects/barracuda")}>
            <FolderGit2 /> Barracuda WAF Security Lab
          </CommandItem>
          <CommandItem onSelect={() => go("/projects/ai-threat-detection")}>
            <FolderGit2 /> AI Threat Detection
          </CommandItem>
          <CommandItem onSelect={() => go("/projects/oracle-db-security")}>
            <FolderGit2 /> Oracle SQL Database Security
          </CommandItem>
          <CommandItem onSelect={() => go("/incident-report")}>
            <FileText /> Incident Triage Report
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Liên hệ">
          <CommandItem onSelect={() => go("mailto:tinyly90891@gmail.com")}>
            <Mail /> Email me
            <CommandShortcut>tinyly90891@gmail.com</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("https://www.linkedin.com/in/tuan-pham-8abb3a335/")}>
            <Linkedin /> LinkedIn
          </CommandItem>
          <CommandItem onSelect={() => go("https://github.com/TuanSOC")}>
            <Github /> GitHub
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
