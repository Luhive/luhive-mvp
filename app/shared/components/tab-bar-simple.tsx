import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "~/shared/lib/utils/cn";

export type TabItem = {
  name: string;
  value: string;
  content: React.ReactNode;
};

interface TabBarSimpleProps {
  tabs: TabItem[];
  defaultValue?: string;
  className?: string;
}

export function TabBarSimple({ tabs, defaultValue, className }: TabBarSimpleProps) {
  return (
    <Tabs defaultValue={defaultValue ?? tabs[0]?.value} className={cn("gap-4", className)}>
      <TabsList className="bg-background rounded-none border-b p-0 w-full justify-start">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="bg-background data-[state=active]:font-black data-[state=active]:text-primary  h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none!"
          >
            {tab.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
