import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Search } from "lucide-react";
import {
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { ModeToggle } from "./components/mode-toggle";

interface Tab {
  id: number;
  title: string;
  url: string;
  favIconUrl: string;
}

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chrome.tabs.query({}, (result) => {
      const validTabs: Tab[] = result
        .filter(
          (
            tab
          ): tab is chrome.tabs.Tab & {
            id: number;
            title: string;
            url: string;
          } =>
            typeof tab.id === "number" &&
            typeof tab.title === "string" &&
            typeof tab.url === "string"
        )
        .map((tab) => ({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          favIconUrl: `https://www.google.com/s2/favicons?domain=${
            new URL(tab.url).hostname
          }&sz=16`,
        }));
      setTabs(validTabs);
    });

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const filteredTabs = tabs.filter(
    (tab) =>
      tab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tab.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleTabClick = (tabId: number) => {
    chrome.tabs.update(tabId, { active: true });
    window.close();
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredTabs.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredTabs.length) % filteredTabs.length
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredTabs.length > 0) {
          handleTabClick(filteredTabs[selectedIndex].id);
        }
        break;
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  return (
    <TooltipProvider>
      <div className="w-[350px] p-4 bg-background">
        <div className="flex justify-between items-center mb-4">
          <div className="relative flex-1 mr-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search tabs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-8"
            />
          </div>
          <div className="flex items-center space-x-1">
            <ModeToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Info</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Keyboard shortcuts:</p>
                <ul className="list-disc pl-4">
                  <li>↑/↓: Navigate tabs</li>
                  <li>Enter: Open selected tab</li>
                  <li>Ctrl+Shift+F: Toggle Quick Tab Search (Windows/Linux)</li>
                  <li>Command+Shift+F: Toggle Quick Tab Search (Mac)</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <ScrollArea className="h-[400px] pr-4">
          <div ref={listRef}>
            {filteredTabs.map((tab, index) => (
              <Button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                variant={index === selectedIndex ? "default" : "ghost"}
                className="w-full justify-start mb-2 p -2 h-auto font-normal"
              >
                <img
                  src={tab.favIconUrl}
                  alt=""
                  className="mr-2 w-4 h-4 flex-shrink-0"
                />
                <span className="truncate text-sm">{tab.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
