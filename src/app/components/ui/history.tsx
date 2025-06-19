import React, { useEffect, useState } from "react";

import Page from "../../models/Page";
import { Card } from "./card";
import { CardContent } from "./card-content";
import { Button } from "./button";
// components/ui/card.tsx
interface History {
  pages: Page[];
  date: Date | string;
}

export function History({ children }: { children: React.ReactNode }) {
  const [historyList, setHistoryList] = useState<History[]>([])

   React.useEffect(() => {
    const storedHistory = localStorage.getItem('history');
    if (storedHistory) {
      setHistoryList(JSON.parse(storedHistory));
    } else {
      setHistoryList([]);
    }
  }, []);

  function addToHistory(page: Page) {
     const historyItem: History = {
        pages: [page],
        date: new Date()
      };
      const prevHistory = JSON.parse(localStorage.getItem('history') || '[]') as History[];

      prevHistory.push(historyItem);
      localStorage.setItem('history', JSON.stringify(prevHistory));
   }

   return (<div className="mt-8">
      <Card>
         <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-xl font-semibold">History</h2>
               <Button
                  type="button"
                  onClick={() => {
                     localStorage.removeItem('history');
                     window.location.reload();
                  }}
               >
                  Clear History
               </Button>
            </div>
            <ul>
               {historyList.length === 0 ? (
                  <li className="text-gray-500">No history yet.</li>
               ) : (
                  historyList.map((history, idx) => (
                     <li key={idx} className="mb-4">
                        <div className="text-gray-600 text-sm mb-1">
                           {new Date(history.date).toLocaleString()}
                        </div>
                        <ul className="ml-4 list-disc">
                           {history.pages.map((p, i) => (
                              <li key={i}>
                                 <span className="font-bold">{p.title}</span> — <span className="text-pink-600">{p.url}</span>
                              </li>
                           ))}
                        </ul>
                     </li>
                  ))
               )}
            </ul>
         </CardContent>
      </Card>
   </div>)
}
